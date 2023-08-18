import * as z from "zod";
import { Request, Response, NextFunction } from "express";
import { AdminWithStatus } from '../models/types/user.types';
import { MongoServerError } from 'mongodb';

interface AuthenticatedRequest extends Request {
    headers: {
        authorization: string
    },
    user: AdminWithStatus
}
interface AuthenticatedAsyncController {
    (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>
}

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot be longer than 100 characters')
    .regex(/[A-Za-z0-9!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]+/, {
        message: 'Password must contain at least one special character',
    })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one digit' });


type MongoDuplicateKeyError = MongoServerError & {
    code: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyValue?: { [key: string]: any };
};

type NodeENV = 'dev' | 'test' | 'prod';

type Email = string & { __brand: 'email' };

type AuthCode = 'password_reset' | 'verification' | 'su_activation' | 'su_deactivation'
type AuthToken = 'access' | 'refresh' | 'password_reset' | 'verification' | 'su_activation' | 'su_deactivation' | 'cookie_bind';
type Password = z.infer<typeof passwordSchema>;

export {
    MongoDuplicateKeyError,
    NodeENV,
    Email, AuthCode, AuthToken,
    AuthenticatedRequest,
    AuthenticatedAsyncController,
    passwordSchema, Password,
};
