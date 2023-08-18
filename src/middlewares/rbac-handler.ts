import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../utils/errors';
import { withAuthentication } from './auth';

// Role-based access control
export default function rbacHandler(roles: string[]) {
    return withAuthentication(
        async (req: AuthenticatedRequest, res: Response, next: NextFunction)
            : Promise<void> => {
            const { user } = req;

            let isPermitted = false
            isPermitted = roles.includes(user.role)

            if (isPermitted) {
                return next()
            } else {
                return next(new ForbiddenError('You are not authorized to perform this action.'))
            }
        })
}