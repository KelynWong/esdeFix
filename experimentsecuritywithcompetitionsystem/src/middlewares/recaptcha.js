/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const { connect, constants } = require('http2');
const logger =new (require("../services/loggerService"))("recaptcha")
const url = new URL(`https://www.google.com`);
let client = connect(url);
/**
 * @param {import('express').Request}req
 * @param {import('express').Response}res
 * @param {function}next
*/
module.exports = function (req, res, next) {
    /* if is a get request skip it */
    if (req.method === "GET") {
        return next();
    }
    /* get the  recaptcha toke send from the client*/
    let captcha = req.body.captcha;
    if (captcha) {
        if (client.closed) {
            /* if the connection timeout creat a new connection */
            client = connect(url);
        }
        const req2 = client.request({
            [constants.HTTP2_HEADER_SCHEME]: "https",
            [constants.HTTP2_HEADER_METHOD]: constants.HTTP2_METHOD_GET,
            [constants.HTTP2_HEADER_PATH]: `/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${encodeURIComponent(captcha)}`
        });
        let data = [];
        req2.on("response", (headers) => {
            if (headers[constants.HTTP2_HEADER_STATUS]===200) {
                /* get data in chunk */
                req2.on("data", data.push.bind(data));
                req2.on("end", () => {
                    data = JSON.parse(Buffer.concat(data));
                    if (data.success && data.score > 0.3) {
                        req.action = data.action;
                        next();
                    } else {
                        logger.warn("Bot with ip="+req.connection.remoteAddress+" have fail the CAPTCHA");
                        res.status(422).json({ message: "Invalid Captcha token" });
                    }
                });
            }else{
                logger.error("reCAPTCHA server unavailable");
                res.status(502).json({ message: "reCAPTCHA server unavailable" });
            }
        });

    } else {
        logger.warn("Bot with ip="+req.connection.remoteAddress+" send request without Captcha token");
        res.status(422).json({ message: "Captcha token not found" });
    }
}