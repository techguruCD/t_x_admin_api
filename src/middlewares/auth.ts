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
        status: 'success',
        message: 'Successfully exchanged auth tokens',
        data: {
            access_token,
        }
    })
}

const basicAuth = function (tokenType: AuthToken | undefined = undefined) {
    return async (req: Request & { user?: UserWithStatus }, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        // Check if authorization header is present
        if (!authHeader?.startsWith('Bearer'))
            return next(new UnauthenticatedError('Invalid authorization header'));

        // Get JWT config variables
        const secret = tokenType
            ? getJWTConfigVariables(tokenType).secret
            : config.JWT_ACCESS_SECRET;

        const jwtToken = authHeader.split(' ')[1];
        const payload = jwt.verify(jwtToken, secret) as string;
        req.user = payload ? Object(payload) as UserWithProfileAndStatus : undefined
        const user = req.user

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

        // Check if user wants to exchange or get new auth tokens
        const userWantsToGetOrExchangeAuthTokens = (req.method === 'GET' && req.path === '/authtoken')
        if (userWantsToGetOrExchangeAuthTokens && req.user) {
            // Check cookie bind id
            const savedId = await getAuthFromCacheMemory({
                email: req.user.email,
                type: 'cookie_bind',
                authClass: 'token',
            })

            const cookie = req.cookies
            const cookieBindId = cookie?.cookie_bind_id
            if (savedId !== cookieBindId) {
                return next(new UnauthenticatedError('Invalid cookie bind id'))
            }

            return await exchangeAuthTokens(req as AuthenticatedRequest, res);
        }
       
        if (req.originalUrl == '/auth/loggedinuser') {
            return res.status(200).send({
                status: 'success',
                message: 'User is logged in',
                data: {
                    user: { ...user, ...sensitiveFilter }
                }
            })
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
