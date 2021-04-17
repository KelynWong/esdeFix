/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const {verify} = require('jsonwebtoken');
const logger =new (require("../services/loggerService"))("verifyToken")
/** @type {import("express").RequestHandler} */
function verifyToken (req, res, next) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.includes('Bearer ')) {
        res.status(401);
        res.json({
            message: "Not authenticated!"
        });
        return;
    }

    const accessToken = authorizationHeader.split('Bearer ')[1];

    verify(accessToken, process.env.JWTKEY, function (err, decoded) {
        if (err) {
            res.status(401);
            res.json({
                message: "Not authorized!"
            });
            logger.warn("user with ip="+req.connection.remoteAddress+" tried to gain access  without a valid token");
            return;
        }
        req.token ={
            userId : decoded.id,
            userRole :decoded.role
        }
        next();
    });
}
/**
 * @callback next
 */
module.exports = verifyToken;