import router from "../src/routes";
import config from './config';
import mongoose from 'mongoose';
import express from "express";
import cors from "cors";
import { METHODS } from "http";
const morgan = require('morgan');

const Blog = require('./schemas/blog');
const Blogcategory = require('./schemas/blogcategory');
const bodyParser = require('body-parser');

const app = express();

var flash = require('connect-flash');
var session = require('express-session');

app.use(session({
    cookie: { maxAge: 60000 },
    secret: 'woot',
    resave: false,
    saveUninitialized: false
}));
const path = require('path');
app.use(flash());
app.use(morgan('dev'));

// we imported config
// we imported router
// we imported mongoose
// we imported cors
// we imported express and set up a new express 
// instance const app = express().

const port = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
app.use(bodyParser.json());

// allow cors
var corsOptions = {
    origin: ["http://localhost:3000/", "http://localhost:3000"],
    methods: "GET,POST,PUT,DELETE"
};
app.use(cors(corsOptions));
// set route in middleware

app.use('/', router);

app.set('view engine', 'ejs');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
// mongoose connection
mongoose.connect(config.mongodbUrl(), { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;
db.on("error", (error) => { console.error(error); })
db.once("open", () => { console.log("connected to database"); })

app.use('/static', express.static('../src/public/assets'));
app.use(express.static(path.join(__dirname, '../src/public')));
app.set('views', path.join(__dirname, '../src/views'));

// Error handlers
const logger = require('./logger');

// Log messages of different levels
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');

// Log a debug message (won't be logged unless level is set to 'debug')
logger.debug('This is a debug message');


// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (error, req, res, next) {
        res.status(error.status || 500);
        res.send({
            message: error.message,
            error: error
        });
    });
}

// Production error handler
// No stacktraces leaked to user
app.use(function (error, req, res, next) {
    res.status(error.status || 500);
    res.send({
        message: error.message,
        error: error
    });
});

console.log('this is node js app');

app.listen(port, () => console.log(`Server is running on  http://localhost:${port}`));

export default app;
