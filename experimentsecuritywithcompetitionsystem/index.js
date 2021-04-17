/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
require('dotenv').config();
const express = require("express");
const cors = require('cors')
const recaptcha = require("./src/middlewares/recaptcha");
const formData = require('express-form-data');
const { readFileSync } = require("fs");
const { resolve } = require('path');
const logger = new (require("./src/services/loggerService"))("index");
//const dummyUserFn = require('./src/middlewares/dummyUserFn');

let app = express();
app.use(cors({ origin: /^https?:\/\/(localhost|127\.0\.0\.1):300(1|2)$/i }));

//Server Settings
const PORT = 5000;
const path = require("path");
const bodyParser = require("body-parser");
const bootstrap = require("./src/bootstrap");

//https://github.com/ortexx/express-form-data#readme


//Parse data with connect-multiparty. 
app.use(formData.parse({}));
//Delete from the request all empty files (size == 0)
app.use(formData.format());
//Change the file objects to fs.ReadStream 
app.use(formData.stream());
//Union the body and the files
app.use(formData.union());

//Pug Template Engine
app.set("view engine", "pug");
app.set("views", path.resolve("./src/views"));

//Request Parsing
app.use(bodyParser.json());
//Not using the following because the client side will be using
//formdata technique to send data. This is due to the web application
//has file submission functionality.
//app.use(express.json());
//app.use(express.urlencoded({ extended: true }));

app.use(recaptcha);









//Express Router
const router = express.Router();
app.use(router);
const rootPath = path.resolve("./dist");

//All client side files are parked inside the dist directory.
//The client side files are compiled by using Gulp
//The actual code files which developers edit is at /src/assets
app.use(express.static(rootPath));
//Applied this middleware function to supply dummy user id for testing
//when I have not prepared the login functionality.
//router.use(dummyUserFn.useDummyUserForTesting); 
bootstrap(app, router);

//Index Page (Home public page)
router.get('/', (req, res, next) => {
    res.send('<html><title>Backend API system for experimenting security concept</title><body>This project provides only backend API support</body></html>');
});

router.use((err, req, res, next) => {
    if (err) {
        //Handle file type and max size of image
        return res.send(err.message);
    }
});

process.on('uncaughtException', function (error, origin) {
    //Handle the error safely. 
    //Developer note: As long as you have callback hell, the error handling code
    //will break. This often occurs during team development.
    //Key reference: https://www.toptal.com/nodejs/node-js-error-handling
    console.error('process.on method is automatically called for unhandled errors:\n ',
        error, 'origin:\n',
        origin);
    logger.error("uncaughtException due to " + error.message + " on " + origin)
    process.exit(1);
})



/* 
Uncomment this if want to use http for testing
app.listen(PORT, err => {
    if (err) return console.error(`Cannot Listen on PORT: ${PORT}`);
    console.log(`\x1b[33mServer is Listening on: \x1b[4mhttp://localhost:${PORT}/\x1b[0m`);
}); */
new (require("https")).Server({
    key: readFileSync(resolve(__dirname, "localhost.key")),
    cert: readFileSync(resolve(__dirname, "localhost.crt"))
}, app).listen(5001, console.log.bind(console, "\x1b[32mServer is Listening on: \x1b[4mhttps://localhost:5001/\x1b[0m"))