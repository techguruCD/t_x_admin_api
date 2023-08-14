import { createClient } from 'redis'
import { REDIS_URL } from '../config'
import logger from '../middlewares/winston'

const redisClient = createClient({
    url: REDIS_URL
})

redisClient.on('error', (error) => {
    logger.info('An error occured while connecting to REDIS')
    logger.error(error)
    process.exit(1)
})

redisClient.on('connect', () => {
    logger.info('Connection to REDIS database successful')
})

export default redisClient