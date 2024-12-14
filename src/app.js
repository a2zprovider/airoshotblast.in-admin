import router from "../src/routes";
import config from './config';
import mongoose from 'mongoose';
import express from "express";
import cors from "cors";
import morgan from 'morgan';
import bodyParser from 'body-parser';
import path from 'path';
import flash from 'connect-flash';
import session from 'express-session';
import logger from './logger'; // Assuming your logger is set up properly

const app = express();

// Session setup
app.use(session({
    cookie: { maxAge: 60000 },
    secret: 'woot',
    resave: false,
    saveUninitialized: false
}));

// Flash messages
app.use(flash());

// Logging setup
app.use(morgan('dev'));
logger.info('Server started');

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS configuration
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "http://localhost:3000/",
        "http://localhost:5173",
        "http://localhost:5173/",
        "http://185.166.39.93:3000/",
        "http://185.166.39.93:3000",
        "http://gulfsouks.com",
        "http://gulfsouks.com/",
        "https://gulfsouks.com",
        "https://gulfsouks.com/",
        "https://www.gulfsouks.com",
        "https://www.gulfsouks.com/",
    ],
    methods: "GET,POST,PUT,DELETE"
};
app.use(cors(corsOptions));

// Routes
app.use('/', router);

// Set view engine
app.set('view engine', 'ejs');

// Mongoose connection setup
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(config.mongodbUrl(), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        logger.info("Connected to database");
    })
    .catch(err => {
        logger.error("Database connection error: ", err);
        process.exit(1); // Exit process with failure
    });

// Static files
app.use('/static', express.static(path.join(__dirname, '../src/public/assets')));
app.use(express.static(path.join(__dirname, '../src/public')));
app.set('views', path.join(__dirname, '../src/views'));

// 404 error handler
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Development error handler
if (app.get('env') === 'development') {
    app.use((error, req, res, next) => {
        logger.error(`Error at ${req.originalUrl}:`, error);
        res.status(error.status || 500).send({
            message: error.message,
            error: error
        });
    });
}

// Production error handler (no stack traces leaked to user)
app.use((error, req, res, next) => {
    logger.error(`Error at ${req.originalUrl}:`, error);
    res.status(error.status || 500).send({
        message: error.message,
        error: {}
    });
});

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Perform a graceful shutdown if necessary
    process.exit(1); // Exit process with failure
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
    logger.error("Uncaught Exception thrown:", err);
    // Perform a graceful shutdown if necessary
    process.exit(1); // Exit process with failure
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});

export default app;
