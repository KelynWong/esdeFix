/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
// Import controlers
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const verifyToken = require('./middlewares/verifyToken');
const logger = new (require("./services/loggerService"))("route");
const {resolve} = require("path")

// Match URL's with controllers
/**
 * @param {import('express').Router} router 
 */
exports.appRoute = router => {
    router.post('/api/user/login', authController.processLogin);
    router.post('/api/user/register', authController.processRegister);
    router.patch('/api/user/register/verify', authController.emailVilified);
    router.post('/api/user/process-submission',verifyToken, userController.processDesignSubmission);
    router.put('/api/user/',verifyToken, userController.processUpdateOneUser);
    router.put('/api/user/design/', verifyToken,userController.processUpdateOneDesign);

    router.get('/api/user/process-search-design/:pagenumber/:search?',verifyToken, userController.processGetSubmissionData);
    router.get('/api/user/process-search-user/:pagenumber/:search?', verifyToken,userController.processGetUserData);
    router.get('/api/user/:recordId', verifyToken,userController.processGetOneUserData);
    router.get('/api/user/design/:fileId',verifyToken, userController.processGetOneDesignData);
    router.get('/api/log',verifyToken, function(req,res){
        if (req.token.userRole === 'admin'){
            res.sendFile(resolve(__dirname+"/../logs/app.log"),console.log);
        }else{
            logger.warn("user with id="+req.token.userId+" and IP="+req.connection.remoteAddress+" tried to access forbidden data");
            res.status(403).json({ message: "you are not allow to view the logs" })
        }
    })

};