import { Router } from 'express';
import { getUsers, getUserInfo } from '../controllers/user.controller';
import { basicAuth, withAuthentication } from '../middlewares/auth';

const router = Router();

router.use(basicAuth())

router
    .get('/', withAuthentication(getUsers))
    .get('/userinfo', withAuthentication(getUserInfo))

export default router;
