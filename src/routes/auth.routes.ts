import { Router } from 'express';
import {
    resendVerificationEmail, userSignup,
    verifyUserEmail, forgotPassword,
    resetPassword,
    logout,
    login,
    getLoggedInUsersData,
    exchangeAuthTokens
} from '../controllers/auth.controller';
import { basicAuth, withAuthentication } from '../middlewares/auth';
import validator from '../middlewares/router-schema-validator';
import * as schema from './validators/auth.schema';

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
    .post('/login', validator(schema.login), login)
    .post(
        '/logout',
        basicAuth(),
        withAuthentication(logout))
       .get('/authtoken', basicAuth('refresh'), withAuthentication(exchangeAuthTokens))
    .get('/loggedinuser', basicAuth(), withAuthentication(getLoggedInUsersData))

export default router;
