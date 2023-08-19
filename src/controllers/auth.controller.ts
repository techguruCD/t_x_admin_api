import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import {
    deleteAuthFromCacheMemory,
    generateAuthCodes,
    getAuthFromCacheMemory,
    generateAuthTokens,
    handleExistingUser,
    handleUnverifiedUser,
    saveTokenToCacheMemory,
    sensitiveFilter,
} from '../services/auth.service';
import { sendEmail } from '../services/email.service';
import { Email } from '../types';
import { AuthenticatedRequest } from '../types';
import { Status } from '../models/status.model';
import { Admin } from '../models/user.model';
import { IPasswordDoc, Password } from '../models/password.model';
import {
    BadRequestError,
    ForbiddenError,
    InternalServerError,
    NotFoundError,
} from '../utils/errors';
import { AdminWithStatus, IAdminDoc } from '../models/types/user.types';
import { randomUUID } from 'crypto';
import { PopulateEmbeddedDoc } from '../models/types/typeutil';
import { JWT_REFRESH_EXP } from '../config';
import logger from '../middlewares/winston';

const userSignup = async (req: Request, res: Response, next: NextFunction) => {
    const { email, firstname, lastname, password } = req.body;

    const role = 'SuperAdmin';
    const userInfo = {
        email: email as Email,
        firstname: firstname as string,
        lastname: lastname as string,
        password: password as string,
    };

    // Check if user already exists
    const existingUser: AdminWithStatus | null = await Admin.findOne({
        email,
    }).populate<AdminWithStatus>('status');

    if (existingUser) {
        return await handleExistingUser(existingUser, res, next);
    }

    // Create new user in session
    let user: IAdminDoc | undefined;
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        user = (await Admin.create([userInfo], { session }))[0];

        await Password.create([{ admin: user._id, password }], { session });
        await session.commitTransaction();
        session.endSession();
    });

    if (!user) throw new BadRequestError('An error occurred');

    // Get access token
    const populatedUser = await user.populate<AdminWithStatus>('status');
    return await handleUnverifiedUser(populatedUser, res);
    // TODO: Send welcome email after signup
};

const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    const email: Email = req.query.email as Email;

    const user = await Admin.findOne({ email }).populate<AdminWithStatus>('status');

    if (!user) {
        return next(new BadRequestError('Admin does not exist'));
    }

    user.status?.isVerified
        ? next(new BadRequestError("Admin's email already verified"))
        : await handleUnverifiedUser(user, res);
};

const verifyUserEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const verificationCode: number = req.body.verification_code;

    const user = req.user;
    if (user.status.isVerified) {
        return next(new BadRequestError('Admin already verified'));
    }

    const authCode = await getAuthFromCacheMemory({
        authClass: 'code',
        type: 'verification',
        email: req.user.email,
    });

    const validVerificationCode = authCode && authCode == verificationCode.toString();
    if (!validVerificationCode) {
        throw new BadRequesError('Invalid verification code');
    }

    await Status.findOneAndUpdate({ admin: user._id }, { isVerified: true });

    deleteAuthFromCacheMemory({
        authClass: 'token',
        type: 'verification',
        email: req.user.email,
    });

    deleteAuthFromCacheMemory({
        authClass: 'code',
        type: 'verification',
        email: req.user.email,
    });

    res.status(200).send({
        success: true,
        message: 'Admin verified',
        data: {
            user: { ...user, ...sensitiveFilter },
        },
    });
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const email: Email = req.body.email;

    const user = await Admin.findOne({ email }).populate<AdminWithStatus>('status');
    if (!user) return next(new BadRequestError('Admin does not exist'));

    const { passwordResetCode } = await generateAuthCodes<'password_reset'>(user, 'password_reset');

    sendEmail({
        to: email,
        subject: 'Reset your password',
        text: `Your password reset code is ${passwordResetCode}`,
    });

    const { access_token } = await generateAuthTokens(user, 'password_reset');

    return res.status(200).send({
        success: true,
        message: 'Password reset code sent to user email',
        data: {
            user: { ...user.toObject(), ...sensitiveFilter },
            access_token,
        },
    });
};

const resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { password_reset_code: passwordResetCode, new_password: newPassword } = req.body;

    // Check if password reset code is correct
    const authCode = await getAuthFromCacheMemory({
        authClass: 'code',
        type: 'password_reset',
        email: req.user.email,
    });

    const validPasswordResetCode = authCode && authCode == passwordResetCode.toString();
    if (!validPasswordResetCode) {
        return next(new BadRequestError('Invalid password reset code'));
    }

    // Update password
    const password = await Password.findOne({ admin: req.user._id });

    if (password) {
        await password.updatePassword(newPassword)
    } else {
        return next(new InternalServerError('An error occurred'));
    }

    // // Blacklist access token
    await deleteAuthFromCacheMemory({
        authClass: 'code',
        type: 'password_reset',
        email: req.user.email,
    });
    await deleteAuthFromCacheMemory({
        authClass: 'token',
        type: 'password_reset',
        email: req.user.email,
    });

    res.status(200).send({
        success: true,
        message: 'Password reset successful',
        data: {
            user: { ...req.user, ...sensitiveFilter },
        },
    });
};

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    type AdminWithStatusAndPassword = PopulateEmbeddedDoc<
        AdminWithStatus,
        'password',
        IPasswordDoc
    >;
    const user = await Admin.findOne({ email }).populate<AdminWithStatusAndPassword>(
        'status password'
    );

    if (!user) return next(new BadRequestError('Admin does not exist'));

    if (!user.status.isVerified) {
        return next(new BadRequestError('Admin is not verified'));
    }

    if (!user.status.isActive) {
        return next(new BadRequestError('Admin is not activated'));
    }

    const passwordIsCorrect = await user.password.comparePassword(password);
    if (!passwordIsCorrect) {
        return next(new BadRequestError('Incorrect password'));
    }

    const { access_token, refresh_token } = await generateAuthTokens(user, 'access');

    const tokenBind = randomUUID();
    await saveTokenToCacheMemory({
        type: 'cookie_bind',
        token: tokenBind,
        email: user.email,
        expiry: JWT_REFRESH_EXP,
    });

    res.cookie('cookie_bind_id', tokenBind, {
        httpOnly: true,
        expires: new Date(Date.now() + JWT_REFRESH_EXP * 1000),
        sameSite: 'strict',
    });

    return res.status(200).send({
        success: true,
        message: 'Admin logged in',
        data: {
            user: { ...user.toObject(), ...sensitiveFilter },
            access_token,
            refresh_token,
        },
    });
};

const logout = async (req: AuthenticatedRequest, res: Response) => {
    deleteAuthFromCacheMemory({
        authClass: 'token',
        email: req.user.email,
        type: 'access',
    });

    deleteAuthFromCacheMemory({
        authClass: 'token',
        email: req.user.email,
        type: 'cookie_bind',
    });

    deleteAuthFromCacheMemory({
        authClass: 'token',
        email: req.user.email,
        type: 'refresh',
    });

    res.status(200).send({
        success: true,
        message: 'Admin logged out',
        data: null,
    });
};

const getLoggedInUsersData = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    res.status(200).send({
        success: true,
        message: 'User is logged in',
        data: {
            user: { ...req.user, ...sensitiveFilter },
        },
    });
};

const exchangeAuthTokens = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = await Admin.findById(req.user._id).populate<AdminWithStatus>('status');
    if (!user) {
        logger.error('Authenticated user but no existing record found in database');
        return next(new InternalServerError('An error occured'));
    }
    const { access_token } = await generateAuthTokens(user, 'access');

    res.status(200).send({
        success: true,
        message: 'Successfully exchanged auth tokens',
        data: {
            access_token,
        },
    });
};

export {
    userSignup,
    resendVerificationEmail,
    verifyUserEmail,
    forgotPassword,
    resetPassword,
    login,
    logout,
    getLoggedInUsersData,
    exchangeAuthTokens,
};
