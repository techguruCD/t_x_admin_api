import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import {
    deleteAuthFromCacheMemory,
    generateAuthCodes, getAuthFromCacheMemory, generateAuthTokens,
    handleExistingUser, handleUnverifiedUser,
    saveTokenToCacheMemory, sensitiveFilter
} from '../services/auth.service';
import { sendEmail } from '../services/email.service';
import { Email } from '../types';
import { AuthenticatedRequest } from '../types';
import { Status, IStatusDoc } from '../models/status.model';
import { User, IUserDoc,} from '../models/user.model';
import { IPasswordDoc, Password } from '../models/password.model';
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from '../utils/errors';
import { ProfileData, UserRole, UserWithStatus } from '../models/types/user.types';
import { randomUUID } from 'crypto';
import * as CONFIG from '../config';
import { PopulateEmbeddedDoc } from '../models/types/typeutil';
import { JWT_REFRESH_EXP, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from '../config';
import { OAuth2Client } from 'google-auth-library';
import { Types } from 'mongoose'

const userSignup = async (req: Request, res: Response, next: NextFunction) => {
    const {
        email, firstname, lastname,
        password, role,
    } = req.body;
    const userInfo = {
        email: email as Email,
        firstname: firstname as string,
        lastname: lastname as string,
        password: password as string,
        role: role as UserRole,
    };

    // Check if user already exists
    type UserWithStatus = PopulateEmbeddedDoc<IUserDoc, 'status', IStatusDoc>;
    const existingUserDoc = await User.findOne({ email }).populate<UserWithStatus>('status');
    const existingUser: UserWithStatus | undefined = existingUserDoc?.toObject();

    if (existingUser) return await handleExistingUser(existingUser, res, next);

    // Create new user in session
    let user: IUserDoc | undefined;
    const session = await mongoose.startSession()
    await session.withTransaction(async () => {
            user = (await User.create([userInfo], { session }))[0]

        if (user) {
            const profileData = { ...userInfo } as ProfileData<'SuperAdmin'>

            // Create users profile
            const profile = await user.createProfile(profileData, session);

            // Create password
            await Password.create([{ user: user._id, password }], { session });
        }

        await session.commitTransaction();
        session.endSession();
    });

    // If user is not created throw error
    if (!user) throw new BadRequestError('An error occurred');

    // Get access token
    const populatedUser: UserWithStatus = await user.populate<UserWithStatus>('status')
    return await handleUnverifiedUser(populatedUser.toObject(), res);
    // TODO: Send welcome email after signup
};


const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    const email: Email = req.query.email as Email;

    // Get user
    const user: IUserDoc & { status: IStatusDoc } | null
        = await User.findOne({ email }).populate('status');

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Check if user is unverified
    user.status?.isVerified
        ? next(new BadRequestError("User's email already verified"))
        : await handleUnverifiedUser(user.toObject(), res);
}

const verifyUserEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const verificationCode: number = req.body.verification_code;

    // Get user
    const user = req.user
    if (user.status.isVerified) return next(new BadRequestError('User already verified'));

    // // Check if verification code is correct
    const authCode = await getAuthFromCacheMemory({
        authClass: 'code',
        type: 'verification',
        email: req.user.email
    })

    const validVerificationCode = authCode && (authCode == verificationCode.toString())
    if (!validVerificationCode) {
        throw new NotFoundError('Invalid verification code')
    }

    // // Verify user
    const dataToUpdate = { isVerified: true }

    await Status.findOneAndUpdate({ user: user._id }, dataToUpdate);

    // Blacklist access token
    deleteAuthFromCacheMemory({
        authClass: 'token',
        type: 'verification',
        email: req.user.email
    })

    // Delete verification code
    deleteAuthFromCacheMemory({
        authClass: 'code',
        type: 'verification',
        email: req.user.email
    })

    res.status(200).send({
        status: 'success',
        message: 'User verified',
        data: {
            user: { ...user, ...sensitiveFilter },
        },
    });
}

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const email: Email = req.body.email;

    // Get user
    const user: UserWithStatus | null = await User.findOne({ email }).populate('status');

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Get password reset code
    const { passwordResetCode } = await generateAuthCodes<'password_reset'>(user, 'password_reset');

    // Send password reset email
    sendEmail({
        to: email,
        subject: 'Reset your password',
        text: `Your password reset code is ${passwordResetCode}`,
    });

    
    // Get access token
    const { access_token } = await generateAuthTokens(user.toObject(), 'password_reset');

    return res.status(200).send({
        status: 'success',
        message: 'Password reset code sent to user email',
        data: {
            user: { ...user.toObject(), ...sensitiveFilter },
            access_token,
        },
    });
}

const resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { password_reset_code: passwordResetCode, new_password: newPassword } = req.body;

    // Check if password reset code is correct
    const auth_code = await getAuthFromCacheMemory({
        authClass: 'code',
        type: 'password_reset',
        email: req.user.email
    })

    const validPasswordResetCode = auth_code && (auth_code == passwordResetCode.toString())
    if (!validPasswordResetCode) {
        return next(new BadRequestError('Invalid password reset code'));
    }

    // Update password
    const password = await Password.findOne({ user: req.user._id });

    password
        ? await password.updatePassword(newPassword)
        : next(new InternalServerError('An error occurred'));

    // // Blacklist access token
    await deleteAuthFromCacheMemory({
        authClass: 'code',
        type: 'password_reset',
        email: req.user.email,
    })
    await deleteAuthFromCacheMemory({
        authClass: 'token',
        type: 'password_reset',
        email: req.user.email,
    })

    res.status(200).send({
        status: 'success',
        message: 'Password reset successful',
        data: {
            user: { ...req.user, ...sensitiveFilter },
        },
    });
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone_number, password } = req.body;

    // Get user
    type UserWithStatusAndPassword = UserWithStatus & { password: IPasswordDoc }
    const userDocQuery = {} as any
    if (email) userDocQuery.email = email
    else if (phone_number) userDocQuery.phone_number = phone_number
    else {
        throw new BadRequestError('Missing required field in requrest parameters')
    }
    const user: UserWithStatusAndPassword | null = await User.findOne(userDocQuery).populate('status password')

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Check if user is verified
    if (!user.status.isVerified) return next(new BadRequestError('User is not verified'));
    if (!user.status.isActive) return next(new BadRequestError('User is not activated'));

    // Check if password is correct
    const passwordIsCorrect = await user.password.comparePassword(password);
    if (!passwordIsCorrect) return next(new BadRequestError('Incorrect password'));

     // Get access token
    const { access_token, refresh_token } = await generateAuthTokens(user.toObject(), 'access');

    const tokenBind = randomUUID()
    await saveTokenToCacheMemory({
        type: 'cookie_bind',
        token: tokenBind,
        email: user.email,
        expiry: JWT_REFRESH_EXP
    })

    res.cookie('cookie_bind_id', tokenBind, {
        httpOnly: true,
        expires: new Date(Date.now() + JWT_REFRESH_EXP * 1000),
        sameSite: 'strict',
    });

    return res.status(200).send({
        status: 'success',
        message: 'User logged in',
        data: {
            user: { ...user.toObject(), ...sensitiveFilter },
            access_token,
            refresh_token
        },
    });
}

const logout = async (req: AuthenticatedRequest, res: Response) => {
    // Blacklist access token
    deleteAuthFromCacheMemory({
        authClass: 'token',
        email: req.user.email,
        type: 'access',
    })

    deleteAuthFromCacheMemory({
        authClass: 'token',
        email: req.user.email,
        type: 'cookie_bind',
    })

    deleteAuthFromCacheMemory({
        authClass: 'token',
        email: req.user.email,
        type: 'refresh',
    })

    res.status(200).send({
        status: 'success',
        message: 'User logged out',
        data: null,
    });
}

const deactivateUserAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const email = req.query.email;

    // Deactivate user account
    const user: UserWithStatus | null
        = await User.findOne({ email }).populate<UserWithStatus>('status');

    if (!user) return next(new BadRequestError('User does not exist'));
    if (user.role === 'SuperAdmin') {
        return next(new ForbiddenError('You cannot deactivate a super admin account'));
    }

    user.status.isActive = false;
    await user.status.save();

    res.status(200).send({
        status: 'success',
        data: null
    })
}

const activateUserAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const email = req.query.email;

    // Activate user account 
    const user: UserWithStatus | null
        = await User.findOne({ email }).populate<UserWithStatus>('status');

    if (!user) return next(new BadRequestError('User does not exist'));
    if (user.role === 'SuperAdmin') {
        return next(new ForbiddenError('You cannot activate a super admin account'));
    }

    user.status.isActive = true;
    await user.status.save();

    res.status(200).send({
        status: 'success',
        data: null
    })
}

const googleSignin = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const code = authorization?.split(' ')[1];

    if (!code) {
        return next(new BadRequestError('Missing required params in request body'))
    }

    const client = new OAuth2Client(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, 'postmessage');

    // Exchange code for tokens
    const { tokens } = await client.getToken(code)

    // Verify id token
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token as string,
        audience: OAUTH_CLIENT_ID,
    }),
        payload = ticket.getPayload();

    const missing_data_in_payload =
        !payload || !payload.family_name || !payload.given_name ||
        !payload.sub || !payload.email
    if (missing_data_in_payload) {
        throw new InternalServerError('An error occured');
    }
    const existing_user = await User.findOne<UserWithStatus>({ email: payload.email }).populate('status')

    // Create new user in db
    let user: IUserDoc | undefined
    const random_str = randomUUID(); // Random unique str as password, won't be needed for authentication
    if (!existing_user) {
        const user_info = {
            firstname: payload.given_name,
            lastname: payload.family_name,
            email: payload.email as Email,
            role: 'SuperAdmin',
            password: random_str,
            googleId: payload.sub,
            // wishlist: '' as unknown as Types.ObjectId,
            // cart: '' as unknown as Types.ObjectId
        } as ProfileData<'SuperAdmin'> & { password: string }

        const session = await mongoose.startSession()
        await session.withTransaction(async () => {
            user = await User.create([user_info], { session }).then(doc => doc[0])
            if (user) {
                const profile_data =
                    user_info.role === 'SuperAdmin'
                        ? { ...user_info } as ProfileData<'SuperAdmin'>
                        : undefined

                // Create users profile
                const profile = await user.createProfile(profile_data, session);
                if (!profile) throw new InternalServerError('An error occured')
                console.log(profile)
                await Password.create([{ user: profile.user, password: user_info.password }], { session });
            }

            await session.commitTransaction();
            session.endSession();
        });
    }

    const curr_user = await User.findOne({ email: payload.email }).populate<UserWithStatus>('status')
    if (!curr_user) {
        return next(new InternalServerError('An error occured'))
    }

    const { access_token, refresh_token } = await generateAuthTokens(curr_user.toObject(), 'access');

    const token_bind = randomUUID()
    await saveTokenToCacheMemory({
        type: 'cookie_bind',
        token: token_bind,
        email: curr_user.email,
        expiry: JWT_REFRESH_EXP
    })

    res.cookie('cookie_bind_id', token_bind, {
        httpOnly: true,
        expires: new Date(Date.now() + JWT_REFRESH_EXP * 1000),
        sameSite: 'strict',
    });

    res.status(200).send({
        status: 'success',
        message: 'User logged in',
        data: {
            user: { ...curr_user.toObject(), ...sensitiveFilter },
            access_token,
            refresh_token
        },
    });
}
// const uploadDocumentsForVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
// }

export {
    userSignup,
    resendVerificationEmail,
    verifyUserEmail,
    forgotPassword,
    resetPassword,
    login, logout,
    googleSignin,
    deactivateUserAccount,
    activateUserAccount,
};
