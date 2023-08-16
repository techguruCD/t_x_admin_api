import { Router, Application } from 'express';

import authRouter from './auth.routes';
import userRouter from './user.routes';

export default function routeHandler(app: Application) {
    app.use('/auth', authRouter);
    app.use('/user', userRouter);
}