/* eslint-disable @typescript-eslint/no-unused-vars */
import 'express-async-errors';
import express, { Application, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';
import { NODE_ENV } from './config';
import errorHandler from './middlewares/error-handler';
import routeHandler from './routes';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
import logger from './middlewares/winston';


function initMiddlewares(app: Application) {
    app.use(helmet())

    if (NODE_ENV == 'dev') {
        app.use(morgan('dev'))
    }

    app.use(cors());

    app.use(express.json())

}

function initExpressRouteHandler(app: Application): void {
    app.use(cookieParser())

    routeHandler(app);

    app.use(errorHandler);

    app.all('*', (req: Request, res: Response, _next: NextFunction) => {
        res.status(404).send({
            status: 'error',
            message: 'Route not found',
        });
    });

    return
}

export const app: Application = express();

/**
 * Start Express server
 *
 * @description Initializes middlewares, and route handlers then starts server
 *
 */
export function initExpressServer() {
    initMiddlewares(app);

    initExpressRouteHandler(app);

    return app
}
