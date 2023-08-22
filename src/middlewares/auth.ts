import { Request, Response, NextFunction } from 'express';
import { UnauthenticatedError } from '../utils/errors';
import { generateAuthTokens, getJWTConfigVariables, getAuthFromCacheMemory, sensitiveFilter } from '../services/auth.service';
import * as config from '../config';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedAsyncController, AuthenticatedRequest, AuthToken } from '../types';
import { AdminWithStatus } from '../models/types/user.types';

const basicAuth = (tokenType?: AuthToken) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let authHeader = req.headers.authorization;

        let savedToken: string | null = null;
        if (tokenType === 'refresh') {
            const cookieBindId = req.cookies['cookie_bind_id'];
            savedToken = await getAuthFromCacheMemory({
                email: cookieBindId,
                type: 'refresh',
                authClass: 'token'
            })

            if (!savedToken) {
                return next(new UnauthenticatedError('Invalid refresh token'));
            }

            authHeader = 'Bearer ' + savedToken
        }

        // Check if authorization header is present
        if (!authHeader?.startsWith('Bearer')) {
            return next(new UnauthenticatedError('Invalid authorization header'));
        }

        // Get JWT config variables
        const secret = tokenType
            ? getJWTConfigVariables(tokenType).secret
            : config.JWT_ACCESS_SECRET;

        const jwtToken = authHeader.split(' ')[1];
        const payload = jwt.verify(jwtToken, secret);

        (req as any).user = Object(payload) as AdminWithStatus;

        // Prevents the user from having more than one active session at time
        // TODO: Embed cookie_bind_id into token and add another check for it
        if (tokenType != 'refresh') {
            savedToken = await getAuthFromCacheMemory({
                email: (req as any).user.email,
                type: tokenType ?? 'access',
                authClass: 'token'
            })
        }

        const invalidAuthentication = !savedToken || savedToken !== jwtToken
        if (invalidAuthentication) {
            return next(new UnauthenticatedError('Invalid authentication'))
        }

        next()
    };
}

function withAuthentication(handler: AuthenticatedAsyncController) {
    return async (req: Request, res: Response, next: NextFunction) => {
        return handler(req as AuthenticatedRequest, res, next)
    }
}

export { basicAuth, withAuthentication }
