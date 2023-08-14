import { Router } from 'express';
import {
    updateEndUserProfileData,
    updateVendorLogo,
    completePhoneNumberUpdate
} from '../controllers/user.controller';
import { basicAuth, withAuthentication } from '../middlewares/auth';
import validator from '../middlewares/router-schema-validator';
import permit from '../middlewares/rbac-handler'
import * as schema from './validators/auth.schema';
import rateLimiter from '../middlewares/rate-limiter'

const router = Router();

router
    .post('/enduser/update', basicAuth(), withAuthentication(updateEndUserProfileData))
    .patch('/enduser/update', basicAuth('otp'), withAuthentication(completePhoneNumberUpdate))
    .patch('/vendor/update', basicAuth(), withAuthentication(updateVendorLogo))
   
export default router;
