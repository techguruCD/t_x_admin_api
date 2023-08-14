import { Router, Application } from 'express';

import authRouter from './auth.routes';
import rbacRouter from './rbac.routes';
// import profileRouter from './profile.routes';
// import chatRouter from './chat.routes';
// import inboxRouter from './inbox.routes'
import usergroupRouter from './usergroup.routes'; 
import docRouter from './doc.routes'; 
import profileRouter from './profile.routes'; 
// import notificationRouter from './notification.routes';

export default function routeHandler(app: Application) {
    app.use('/auth', authRouter);
    app.use('/rbac', rbacRouter);
    // app.use('/profile', profileRouter);
    // app.use('/chat', chatRouter);
    // app.use('/inbox', inboxRouter);
    app.use('/usergroup', usergroupRouter);                 
    app.use('/document', docRouter);                 
    app.use('/profile', profileRouter);                 
    // app.use('/notificationgroup', notificationRouter);
}