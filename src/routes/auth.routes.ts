import { Router } from 'express';
import {
    resendVerificationEmail, userSignup,
    verifyUserEmail, forgotPassword,
    resetPassword,
    logout,
    login,
    activateUserAccount,
    deactivateUserAccount,
    googleSignin,
    getLoggedInUsersData,
    exchangeAuthTokens
} from '../controllers/auth.controller';
import {
    requestSuperAdminAccountActivation,
    requestSuperAdminAccountDeactivation,
    activateSuperAdminAccount,
    deactivateSuperAdminAccount,
} from '../controllers/su_auth.controller'
import { basicAuth, withAuthentication } from '../middlewares/auth';
import validator from '../middlewares/router-schema-validator';
import permit from '../middlewares/rbac-handler'
import * as schema from './validators/auth.schema';
import rateLimiter from '../middlewares/rate-limiter'

const router = Router();

router
    .post('/signup', validator(schema.userSignup), userSignup)
    .get(
        '/verificationemail',
        validator(schema.resendVerificationEmail),
        resendVerificationEmail
    )
    .post(
        '/verifyemail/',
        validator(schema.verifyUserEmail),
        basicAuth('verification'),
        withAuthentication(verifyUserEmail)
    )
    .post(
        '/forgotpassword',
        validator(schema.forgotPassword),
        forgotPassword)
    .patch(
        '/resetpassword',
        validator(schema.resetPassword),
        basicAuth('password_reset'),
        withAuthentication(resetPassword))
    .post('/login', rateLimiter({ time: 1, limit: 5 }), validator(schema.login), login)
    .post('/googlesignin', rateLimiter({ time: 1, limit: 5 }), googleSignin)
    .post(
        '/logout',
        basicAuth(undefined),
        withAuthentication(logout))
    .post(
        '/user/activate',
        validator(schema.activateUserAccount),
        basicAuth(),
        permit(['SuperAdmin']),
        withAuthentication(activateUserAccount))
    .post(
        '/user/deactivate',
        validator(schema.deactivateUserAccount),
        basicAuth(),
        permit(['SuperAdmin']),
        withAuthentication(deactivateUserAccount))
    .get('/authtoken', basicAuth('refresh'), withAuthentication(exchangeAuthTokens))
    .get('/loggedinuser', basicAuth(), withAuthentication(getLoggedInUsersData))

router.use(permit(['SuperAdmin']))
router
    .get(
        '/su/requestactivation',
        validator(schema.requestSuperAdminAccountActivation),
        requestSuperAdminAccountActivation)
    .post(
        '/su/activate',
        validator(schema.activateSuperAdminAccount),
        basicAuth('su_activation'),
        withAuthentication(activateSuperAdminAccount))
    .get(
        '/su/requestdeactivation',
        validator(schema.requestSuperAdminAccountDeactivation),
        requestSuperAdminAccountDeactivation)
    .post(
        '/su/deactivate',
        validator(schema.deactivateSuperAdminAccount),
        basicAuth('su_deactivation'),
        withAuthentication(deactivateSuperAdminAccount)
    );

export default router;
