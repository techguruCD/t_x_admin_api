import winston, { format } from "winston";

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf((info) => {
    return `${info.timestamp} [${info.level}]: ${info.message}`;
});

const enumerateErrorFormat = format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        enumerateErrorFormat(),
        colorize({
            colors: { info: 'cyan', error: 'red' }
        }),
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat
    ),
    transports: [
        new winston.transports.Console()
    ]
});

export default logger;
