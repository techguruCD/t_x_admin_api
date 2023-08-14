import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/global';
import { ForbiddenError } from '../utils/errors';
import { withAuthentication } from './auth';
import { PermissionGroup, Priviledge } from '../models/rbac.model';

async function authenticateRoutePriviledge(req: AuthenticatedRequest) {
    let isAllowed = false
    const route = req.baseUrl + req.path

    // Get priviledge for route in database
    const priviledge = await Priviledge.findOne({ route, method: req.method })

    // If priviledge is not found
    if (!priviledge) return 'priviledge not found';

    // If priviledge is found
    // Get users priviledges
    const { user } = req as AuthenticatedRequest
    const usersCustomPermissions = user.custom_permissions
    if (usersCustomPermissions) {
        const userWasManuallyGivenAccess = usersCustomPermissions.allowed_priviledges.includes(priviledge._id.toString()),
            userWasManuallyDeniedAccess = usersCustomPermissions.restricted_priviledges.includes(priviledge._id.toString())
        if (userWasManuallyGivenAccess) {
            isAllowed = true
        } else if (userWasManuallyDeniedAccess) {
            isAllowed = false
        }
    }

    const permissionGroup = await PermissionGroup.findOne({ name: user.role })

    // If user's role is not found
    if (!permissionGroup) return true;

    const permissionGroupIsPermitted = permissionGroup.allowed_priviledges.includes(priviledge._id.toString()),
        permissionGroupIsRestricted = permissionGroup.restricted_priviledges.includes(priviledge._id.toString())
    if (permissionGroupIsPermitted) {
        isAllowed = true
    } else if (permissionGroupIsRestricted) {
        isAllowed = false
    }

    return isAllowed
}

// Role-based access control
export default function rbacHandler(roles: string[]) {
    return withAuthentication(
        async (req: AuthenticatedRequest, res: Response, next: NextFunction)
            : Promise<void> => {
            const { user } = req;
            // ////console.log(req.user)

            let isPermitted = false
            isPermitted = roles.includes(user.role)

            const response = await authenticateRoutePriviledge(req)

            if (response === true) {
                isPermitted = true
            } else if (response === false) {
                isPermitted = false
            }

            if (isPermitted) {
                return next()
            } else {
                return next(new ForbiddenError('You are not authorized to perform this action.'))
            }
        })
}