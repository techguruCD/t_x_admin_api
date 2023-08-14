import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as config from '../config';
import redisClient from '../database/redis';
import { IStatusDoc } from '../models/types/status.types';
import { IUserDoc, UserWithProfileAndStatus, UserWithStatus } from '../models/types/user.types';
import { User } from '../models/user.model';
import { Email, AuthCode, AuthToken } from '../types';
import { BadRequestError } from '../utils/errors';
import { sendEmail } from './email.service';
import logger from '../middlewares/winston';

type AuthClass = 'code' | 'token'
const sensitiveFilter = {
    password: undefined,
    status: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    __v: undefined
}

function getJWTConfigVariables(jwtTokenType: AuthToken): {
    secret: string;
    expiry: number;
} {
    switch (jwtTokenType) {
        case 'access':
            return {
                secret: config.JWT_ACCESS_SECRET,
                expiry: config.JWT_ACCESS_EXP
            };

        case 'refresh':
            return {
                secret: config.JWT_REFRESH_SECRET,
                expiry: config.JWT_REFRESH_EXP
            };

        case 'password_reset':
            return {
                secret: config.JWT_PASSWORDRESET_SECRET,
                expiry: config.JWT_PASSWORDRESET_EXP,
            };

        case 'verification':
            return {
                secret: config.JWT_EMAILVERIFICATION_SECRET,
                expiry: config.JWT_EMAILVERIFICATION_EXP,
            };

        case 'su_activation':
            return {
                secret: config.JWT_SUPERADMINACTIVATION_SECRET,
                expiry: config.JWT_SUPERADMINACTIVATION_EXP,
            };

        case 'su_deactivation':
            return {
                secret: config.JWT_SUPERADMINACTIVATION_SECRET,
                expiry: config.JWT_SUPERADMINACTIVATION_EXP,
            };

        // if config_type is not 'access' or 'refresh', throw an error
        default:
            throw new Error(`Invalid config_type: ${jwtTokenType}`);
    }
}

async function deleteAuthForUser(user: IUserDoc) {
    const { email } = user

    const type = [
        'access', 'refresh',
        'password_reset', 'verification',
        'su_activation', 'su_deactivation'
    ]
    const authClass = ['code', 'token']

    const key = type.map(t => authClass.map(c => `${t}_${c}:${email}`)).flat()

    await redisClient.del(key)

    return true
}

interface DeleteAuthFromCacheMemoryProps {
    type: AuthToken,
    authClass: AuthClass,
    email: Email
}
async function deleteAuthFromCacheMemory
    (tokenData: DeleteAuthFromCacheMemoryProps) {
    const { type, authClass, email } = tokenData

    const key = `${type}_${authClass}:${email}`
    const authCode = await redisClient.del(key)

    return authCode
}

interface SaveCodeToCacheMemoryProps {
    email: Email,
    expiry: number,
    code: string | number,
    type: AuthCode
}
async function saveCodeToCacheMemory(codeData: SaveCodeToCacheMemoryProps) {
    const { email, expiry, code, type } = codeData

    const key = `${type}_code:${email}`
    const authCode = await redisClient.setEx(key, expiry, code.toString())

    return authCode
}

interface SaveTokenToCacheMemoryProps {
    email: Email,
    expiry: number,
    token: string | number,
    type: AuthToken,
}
async function saveTokenToCacheMemory(tokenData: SaveTokenToCacheMemoryProps) {
    const { email, expiry, token, type } = tokenData

    const key = `${type}_token:${email}`
    const authToken = await redisClient.setEx(key, expiry, token.toString())

    return authToken
}

interface GetAuthFromCacheMemoryProps {
    type: AuthToken,
    authClass: AuthClass,
    email: Email
}
async function getAuthFromCacheMemory
    (tokenData: GetAuthFromCacheMemoryProps) {
    const { type, authClass, email } = tokenData

    const key = `${type}_${authClass}:${email}`
    const authCode = await redisClient.get(key)

    return authCode
}

type getAuthCodesResponse = {
    'password_reset': {
        passwordResetCode: number;
    },
    'verification': {
        verificationCode: number;
    },
    'su_activation': {
        activationCode1: number;
        activationCode2: number;
    },
    'su_deactivation': {
        deactivationCode1: number;
        deactivationCode2: number;
    }
}
async function generateAuthCodes<T extends AuthCode>
    (user: IUserDoc, codeType: T)
    : Promise<getAuthCodesResponse[T]> {

    // 4 digit random number
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    let verificationCode: number | undefined,
        passwordResetCode: number | undefined,
        activationCode1: number | undefined,
        activationCode2: number | undefined,
        activationCode: number | undefined,
        deactivationCode1: number | undefined,
        deactivationCode2: number | undefined,
        deactivationCode: number | undefined,
        authCode: number;

    switch (codeType) {
        case 'verification':
            verificationCode = randomNumber;
            authCode = verificationCode;
            break;

        case 'password_reset':
            passwordResetCode = randomNumber;
            authCode = passwordResetCode;
            break;

        case 'su_activation':
            activationCode1 = randomNumber;
            activationCode2 = Math.floor(1000 + Math.random() * 9000);
            activationCode = parseInt(`${activationCode1}${activationCode2}` as string, 10);
            authCode = activationCode;
            break;

        case 'su_deactivation':
            deactivationCode1 = randomNumber;
            deactivationCode2 = Math.floor(1000 + Math.random() * 9000);
            deactivationCode = parseInt(`${deactivationCode1}${deactivationCode2}` as string, 10);
            authCode = deactivationCode;
            break;

        default:
            throw new Error('Invalid code type');
    }

    await saveCodeToCacheMemory({
        email: user.email,
        type: codeType,
        code: authCode,
        expiry: getJWTConfigVariables(codeType).expiry
    })

    logger.info([
        verificationCode,
        passwordResetCode,
        activationCode1, activationCode2,
        deactivationCode1, deactivationCode2,
    ])

    return {
        verificationCode,
        passwordResetCode,
        activationCode1, activationCode2,
        deactivationCode1, deactivationCode2,
    } as getAuthCodesResponse[T]
}

async function generateAuthTokens
    (user: UserWithStatus, tokenType: AuthToken = 'access')
    : Promise<{ access_token: string; refresh_token: string | undefined }> {
    const userProfile = await user.getProfile()
    const data = { ...user.toObject(), profile: userProfile } as UserWithProfileAndStatus

    // Access token usecase may vary, so we can't use the same secret for all
    const { secret, expiry } = getJWTConfigVariables(tokenType);
    const access_token = jwt.sign(data, secret, { expiresIn: expiry });
    const refresh_token = jwt.sign(data, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXP,
    });

    saveTokenToCacheMemory({
        type: tokenType,
        email: user.email,
        token: access_token,
        expiry: expiry
    })

    if (tokenType == 'access') {
        saveTokenToCacheMemory({
            type: 'refresh',
            email: user.email,
            token: refresh_token,
            expiry: config.JWT_REFRESH_EXP
        })
    }

    // If the secret is the same as the access token secret,
    // i.e the token is meant for post authentication
    // then return the refresh token, else return undefined
    return {
        access_token,
        refresh_token: secret == config.JWT_ACCESS_SECRET
            ? refresh_token
            : undefined,
    };
}

async function handleUnverifiedUser
    (unverifiedUser: UserWithStatus, res: Response)
    : Promise<Response> {

    // Get verificateion code
    const { verificationCode }: { verificationCode: number }
        = await generateAuthCodes<'verification'>(unverifiedUser, 'verification');

    // Send verification email
    sendEmail({
        to: unverifiedUser.email,
        subject: 'Verify your email address',
        text: `Your verification code is ${verificationCode}`,
    });

    // Get access token
    const { access_token } = await generateAuthTokens(unverifiedUser, 'verification');

    return res.status(200).send({
        success: true,
        message: 'Verification code sent to user email',
        data: {
            user: { ...unverifiedUser.toObject(), ...sensitiveFilter },
            access_token,
        },
    });
}

async function handleExistingUser(
    existingUser: UserWithStatus, res: Response, next: NextFunction)
    : Promise<Response | NextFunction> {

    const response =
        existingUser.status?.isVerified
            ? next(new BadRequestError('Email belongs to an existing user'))
            : await handleUnverifiedUser(existingUser, res);

    return response as Response | NextFunction;
}

export {
    getAuthFromCacheMemory,
    saveTokenToCacheMemory,
    deleteAuthFromCacheMemory,
    generateAuthCodes,
    sensitiveFilter, getJWTConfigVariables, generateAuthTokens,
    handleExistingUser, handleUnverifiedUser
};