import { Request, Response, NextFunction } from 'express';
import { UnauthenticatedError } from '../utils/errors';
import { generateAuthTokens, getJWTConfigVariables, getAuthFromCacheMemory, sensitiveFilter } from '../services/auth.service';
import * as config from '../config';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedAsyncController, AuthenticatedRequest, AuthToken } from '../types';
import { UserWithProfileAndStatus, UserWithStatus } from '../models/types/user.types';

async function exchangeAuthTokens(req: AuthenticatedRequest, res: Response) {
    const { access_token } = await generateAuthTokens(req.user, 'access')

    return res.status(200).send({
        success: true,
        message: 'Successfully exchanged auth tokens',
        data: {
            access_token,
        }
    })
}

const basicAuth = (tokenType?: AuthToken) => {
    return async (req: Request & { user?: UserWithStatus }, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        // Check if authorization header is present
        if (!authHeader?.startsWith('Bearer')){
            return next(new UnauthenticatedError('Invalid authorization header'));
        }

        // Get JWT config variables
        const secret = tokenType
            ? getJWTConfigVariables(tokenType).secret
            : config.JWT_ACCESS_SECRET;
            
        const jwtToken = authHeader.split(' ')[1];
        const payload = jwt.verify(jwtToken, secret) as string;
        req.user = payload ? Object(payload) as UserWithProfileAndStatus : undefined

        if (req.user) {
            const savedToken = await getAuthFromCacheMemory({
                email: req.user.email,
                type: tokenType ?? 'access',
                authClass: 'token'
            })

            const invalidAuthentication = !savedToken || savedToken !== jwtToken
            if (invalidAuthentication) {
                return next(new UnauthenticatedError('Invalid authentication'))
            }
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
