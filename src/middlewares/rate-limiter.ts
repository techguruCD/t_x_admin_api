import rateLimit from 'express-rate-limit';

const rateLimiter = ({ time, limit }: { time: number, limit: number }) => {
    return rateLimit({
        windowMs: time * 60 * 1000, // 15 minutes
        max: limit, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later',
        headers: true,
    });
}

export default rateLimiter;