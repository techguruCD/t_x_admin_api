import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoDuplicateKeyError } from '../types';
import {
    BadRequestError,
    CustomAPIError,
    InternalServerError,
    UnauthenticatedError,
} from '../utils/errors';
import { ZodError } from 'zod';
import { NODE_ENV } from '../config';
import logger from '../middlewares/winston';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response {
    // log the error to the console, but only if the environment is not "test"
    NODE_ENV !== 'test' ? console.error(err) : null;

    let error: CustomAPIError | undefined;

    if (err.name === 'MongoServerError') {
        const mongoError = err as MongoDuplicateKeyError;
        if (mongoError.code === 11000) {
            const error_key_value = mongoError.keyValue;
            const message = `Duplicate field value: ${JSON.stringify(error_key_value)}`;

            error = new BadRequestError(message);
        } else {
            error = new InternalServerError('An error occurred');
        }
    } else if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors,
        });
    } else if (err instanceof MongooseError.ValidationError) {
        const error_messages = Object.values(err.errors);
        const message = error_messages.join(', ');

        error = new InternalServerError(message);
    } else if (err.name === 'TokenExpiredError') {
        error = new UnauthenticatedError('Token expired');
    } else if (
        err.name === 'JsonWebTokenError' &&
        (
            err.message === 'jwt malformed' ||
            err.message === 'invalid signature' ||
            err.message === 'invalid token'
        )) {

        error = new UnauthenticatedError('Invalid authentication token');
    } else if (err.message == 'Not allowed by CORS') {
        error = new UnauthenticatedError('Not allowed by CORS');
    } else if (err instanceof CustomAPIError) {
        return res.status(err.statusCode).send({
            data: null,
            message: err.message,
        });
    }

    if (error) {
        return res.status(error.statusCode).send({
            data: null,
            message: error.message,
        });
    }

    return res.status(500).send({ message: 'An error occurred' });
}

export default errorHandler;
