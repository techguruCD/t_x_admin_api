import Mongoose from 'mongoose';
import { NodeENV } from '../types';
import * as config from '../config';
import redis_client from './redis'
import logger from '../middlewares/winston';

function getDBConnectionString(env: NodeENV): string {
    switch (env) {
        case 'test':
            return config.MONGO_URI_TEST;
        case 'dev':
            return config.MONGO_URI_DEV;
        case 'prod':
            return config.MONGO_URI_PROD;
    }
}

async function initMongoDBConnection() {
    const mongoURL: string = getDBConnectionString(config.NODE_ENV);

    Mongoose.set('strictQuery', false);
    await Mongoose.connect(mongoURL);

    logger.info(`Connection to ${Mongoose.connection.name} MongoDB database successful`);
}

async function initRedisConnection() {
    try {
        await redis_client.connect()
    } catch (error) {
        logger.info('An error occured while connecting to REDIS')
        logger.error(error)
        process.exit(1)
    }
}

export async function connectToDatabase() {
    await initRedisConnection();
    await initMongoDBConnection();

    return Mongoose.connection;
}
