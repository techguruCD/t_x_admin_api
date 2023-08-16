import { Router } from 'express';
import { getUsers, getUserInfo } from '../controllers/user.controller';
import { withAuthentication } from '../middlewares/auth';

const router = Router();

router
    .get('/', withAuthentication(getUsers))
    .get('/userinfo', withAuthentication(getUserInfo))

export default router;
