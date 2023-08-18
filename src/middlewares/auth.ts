import { Request, Response, NextFunction } from 'express';
import { UnauthenticatedError } from '../utils/errors';
import { generateAuthTokens, getJWTConfigVariables, getAuthFromCacheMemory, sensitiveFilter } from '../services/auth.service';
import * as config from '../config';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedAsyncController, AuthenticatedRequest, AuthToken } from '../types';
import { AdminWithStatus } from '../models/types/user.types';

const basicAuth = (tokenType?: AuthToken) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        
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

        const savedToken = await getAuthFromCacheMemory({
            email: (req as any).user.email,
            type: tokenType ?? 'access',
            authClass: 'token'
        })

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
