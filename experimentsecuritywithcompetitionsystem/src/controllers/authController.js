/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const user = require('../services/userService');
const auth = require('../services/authService');
const emailService = require("../services/emailService");
const { compareSync, hash } = require('bcrypt');
const { sign, verify } = require('jsonwebtoken');
const logger = new (require("../services/loggerService"))("authController");

const REGEXP_EMAIL = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
const REGEXP_PASSWORD = /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}/;
const REGEXP_TEXT = /^[\w\s]{1,}$/;
/**@type {{[s:number]:number}}  */
const failLogin = {};
/**
 * @type {import('express').RequestHandler<import("express-serve-static-core").ParamsDictionary,any,{email:string,password:string}>} req 
 */
exports.processLogin = async function (req, res) {
    if (req.action === "login") {
        let email = req.body.email;
        let password = req.body.password;
        if (REGEXP_EMAIL.test(email)) {
            try {
                let results = await auth.authenticate(email)
                console.log(results)
                if (results.length === 1) {
                    if ((password == null) || (results[0] == null)) {
                        return res.status(401).json({ message: 'login failed' });
                    }
                    /* fixed */
                    if (compareSync(password, results[0].user_password)) {
                        let data = {
                            user_id: results[0].user_id,
                            role_name: results[0].role_name,
                            token: sign({ id: results[0].user_id, role: results[0].role_name }, process.env.JWTKEY, {
                                expiresIn: 86400 //Expires in 24 hrs
                            })
                        }; //End of data variable setup
                        if (results[0].user_id in failLogin) {
                            delete failLogin[results[0].user_id]
                        }

                        logger.info(`User with id=${results[0].user_id} and ip=${req.connection.remoteAddress} has login`)
                        return res.status(200).json(data);
                    } else {
                        let user_id = results[0].user_id;
                        failLogin[user_id] = user_id in failLogin ? failLogin[user_id] + 1 : 1;
                        if (failLogin[user_id] === 3) {
                            logger.warn("user with id=" + user_id + " and ip address=" + req.connection.remoteAddress + " had failed login for 3 times")
                        }
                        // return res.status(500).json({ message: 'Login has failed.' });
                        return res.status(500).json({ message: 'Login has failed.' });
                    } //End of passowrd comparison with the retrieved decoded password.
                } else {
                    return res.status(500).json({ message: 'Login has failed.' });
                }
                //End of checking if there are returned SQL results
            } catch (error) {
                /* console.error('\x1b[31mauthenticate method : catch block section code is running');
                console.error(error, '=======================================================================\x1b[0m'); */
                logger.error('Login has failed due to ' + error.message);
                return res.status(500).json({ message: 'Login has failed.' });
            } //end of try
        } else {
            res.status(400).json({ message: "Invalid input" })
        }

    } else {
        res.status(422).json({ message: "Invalid action" })
    }
};

/** @type {import('express').RequestHandler<any,any,{fullName:string,email:string,password:string}>}*/
// If user submitted data, run the code in below
exports.processRegister = async function (req, res) {
    console.log('processRegister running');
    let {fullName,email,password} =req.body;
    if (fullName == null) {
        return res.status(400).json({ message: "Missing input" })
    }
    if (REGEXP_EMAIL.test(email) && REGEXP_PASSWORD.test(password) && REGEXP_TEXT.test(fullName)) {
        try {
            let hashedPW = await hash(password, 10);
            let results = await user.createUser(fullName, email, hashedPW);
            console.log(results);
            logger.info("new account have been added with id=" + results.insertId)
            let token = sign({ id: results.insertId }, process.env.EMAIL_TOKEN, {
                expiresIn: 600//10 minute
            })
            let emailResult = await (emailService.verifyEmail(req.headers.origin, email, token).catch(err => {
                user.deleteUser(results.insertId)
                throw err;
            }));
            return res.status(201).json({ message: 'Completed registration' });
        } catch (error) {
           /*  console.error('\x1b[31mprocessRegister method : catch block section code is running');
            console.error(error, '=======================================================================\x1b[0m'); */
            logger.error("Unable to complete registration due to " + error.message)
            return res.status(500).json({ message: 'Unable to complete registration' });
        }
    } else {
        res.statusCode = 400;
        res.json({ message: "Invalid import" });
    }

}; //End of processRegister
/** @type {import('express').RequestHandler<import("express-serve-static-core").ParamsDictionary,any,{token:string}>}*/
exports.emailVilified =  function (req, res) {
    verify(req.body.token, process.env.EMAIL_TOKEN, async (err, decoded) => {
        if (err) {
            console.log(err)
            res.status(401).json({
                message: "Not authorized!"
            });
            return;
        }
        try {
            await user.emailVilified(decoded.id);
            res.json({ message: "your email have been Vilified" })
        } catch (error) {
            /* console.error('\x1b[31emailVilified method : catch block section code is running');
            console.error(error, '=======================================================================\x1b[0m'); */
            logger.error("Unable to vilify email due to " + error.message);
        }
    })
}