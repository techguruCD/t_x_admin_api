import { Router, Application } from 'express';

import authRouter from './auth.routes';

export default function routeHandler(app: Application) {
    app.use('/auth', authRouter);
}