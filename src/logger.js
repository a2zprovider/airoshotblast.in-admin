// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// Custom format for log messages
const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Create the logger instance
const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'log/combined.log' })
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'log/exceptions.log' })
    ],
    rejectionHandlers: [
        new transports.File({ filename: 'log/rejections.log' })
    ]
});


module.exports = logger;