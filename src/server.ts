import dotenv from 'dotenv';
import { NodeENV } from './types';

/**
 * Set env config based on current node environment
 * i.e
 * if NODE_ENV = 'dev' use .env.dev file
 * if NODE_ENV = 'prod' use .env.prod
 * if NODE_ENV = 'test' use .env.test
 */
const NODE_ENV = process.env.NODE_ENV as NodeENV;
const path = NODE_ENV != 'prod'
    ? `${__dirname}/../.env.${NODE_ENV}`
    : `${__dirname}/../.env`;
dotenv.config({ path });

import { connectToDatabase } from './database/index';
import { initExpressServer } from './app';
import { PORT } from './config'
import logger from './middlewares/winston';

async function startServer() {
    try {
        await connectToDatabase();

        const app = initExpressServer();

        app.listen(PORT, () => {
            logger.info(`Server started on port ${PORT}`);
        });

    } catch (error) {
        console.error(error);
    }
}

startServer();
