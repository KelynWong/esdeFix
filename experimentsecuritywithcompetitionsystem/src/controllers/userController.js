const userManager = require('../services/userService');
const fileDataManager = require('../services/fileService');
const logger = new (require("../services/loggerService"))("userController");
const { ReadStream } = require("fs");
const REGEXP_SANITIZATION = /[<>"']/g;
const REGEXP_TEXT = /^[\w\s]{1,}$/;
/** @typedef {import('express-serve-static-core').ParamsDictionary} ParamsDictionary*/
/** @type {import("express").RequestHandler<ParamsDictionary,any,{designTitle:string,designDescription:string,file:ReadStream}>} */
exports.processDesignSubmission = async function (req, res) {
    let designTitle = req.body.designTitle;
    let designDescription = req.body.designDescription;
    let userId = req.token.userId;
    let file = req.body.file;
    /* check if any input is missing */
    if (designTitle == null || designDescription == null || file == null) {
        res.status(400).json({ message: "messing input" });
        return;
    }
    /* check it is file */
    if (file instanceof ReadStream && REGEXP_TEXT.test(designTitle) && REGEXP_TEXT.test(designDescription)) {
        try {
            let uploadResult = await fileDataManager.uploadFile(file)
           // console.log('check result variable in fileDataManager.upload code block\n', uploadResult);
            //Update the file table inside the MySQL when the file image
            //has been saved at the cloud storage (Cloudinary)
            let { imageURL, publicId } = uploadResult
            /* console.log('check uploadResult before calling createFileData in try block', uploadResult); */
            logger.info("Image have been upload to Cloudinary by id=" + userId);
            let result = await fileDataManager.createFileData(imageURL, publicId, userId, designTitle, designDescription)
            /* console.log('Inspert result variable inside fileDataManager.uploadFile code');
            console.log(result); */
            logger.info("Image info have been insert to database with id=" + result.insertId);
            res.status(200).json({ message: 'File submission completed.', imageURL: imageURL });
        } catch (error) {
            /* console.error('\x1b[31mprocessDesignSubmission method : catch block section code is running');
            console.error(error, '=======================================================================\x1b[0m'); */
            logger.error('File submission failed due to ' + error.message);
            res.status(500).json({
                message: 'File submission failed.'
            });
        }
    } else {
        res.status(400).json({ message: "invalid import" })
    }
}; //End of processDesignSubmission

/** @type {import("express").RequestHandler<{search:string,pagenumber:number},{number_of_records:number,page_number:number,filedata:{"file_id":number,"cloudinary_url":string,"design_title":string,"design_description":string}[]},undefined>} */
exports.processGetSubmissionData = async function (req, res) {
    let pageNumber = parseInt(req.params.pagenumber);
    let search = req.params.search;
    let userId = req.token.userId;
    /* check if page number is a number */
    if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ message: "invalid page number" });
    }
    try {
        let results = await fileDataManager.getFileData(userId, pageNumber, search);
        //console.log('Inspect result variable inside processGetSubmissionData code\n', results);
        if (results) {
            /*output sanitization */
            results[0].forEach(x=>{
                x.design_description = x.design_description.replace(REGEXP_SANITIZATION,"")
                x.design_title=x.design_title.replace(REGEXP_SANITIZATION,"")
            })
            var jsonResult = {
                'number_of_records': results[0].length,
                'page_number': pageNumber,
                'filedata': results[0],
                'total_number_of_records': results[2][0].total_records
            }
            return res.status(200).json(jsonResult);
        }
    } catch (error) {
        /* console.error('\x1b[31mprocessGetSubmissionData method : catch block section code is running');
        console.error(error, '=======================================================================\x1b[0m'); */
        logger.error("Server is unable to process your request due to " + error.message);
        return res.status(500).json({
            message:"Server is unable to process your request"
        });
    }

}; //End of processGetSubmissionData

/** @type {import("express").RequestHandler<{pagenumber:number,search:string},{number_of_records:number,pageNumber:number,userdata:{user_id:number, fullname:string, email:string, role_name:string }[],total_number_of_records:number}>} */
exports.processGetUserData = async function (req, res) {
    /* check if the user is admin as only admin can search for user */
    if (req.token.userRole === 'admin') {
        let pageNumber = parseInt(req.params.pagenumber);
        let search = req.params.search;
        /* check if page number is a number */
        if (isNaN(pageNumber) || pageNumber < 1) {
            return res.status(400).json({ message: 'Invalid page number' })
        }
        try {
            let results = await userManager.getUserData(pageNumber, search);
           // console.log('Inspect result variable inside processGetUserData code\n', results);
            if (results) {
                /*output sanitization */
                results[0].forEach(x=>{
                    x.email = x.email.replace(REGEXP_SANITIZATION,"");
                    x.fullname = x.fullname.replace(REGEXP_TEXT,"");
                })
                var jsonResult = {
                    'number_of_records': results[0].length,
                    'page_number': pageNumber,
                    'userdata': results[0],
                    'total_number_of_records': results[2][0].total_records
                }
                return res.status(200).json(jsonResult);
            }
        } catch (error) {
            /* console.error('\x1b[31mprocessGetUserData method : catch block section code is running');
            console.error(error, '=======================================================================\x1b[0m'); */
            logger.error("Server is unable to process your request due to " + error.message);
            return res.status(500).json({
                message:"Server is unable to process your request "
            });
        }
    } else {
        logger.warn("user with id="+req.token.userId+" and IP="+req.connection.remoteAddress+" tried to access forbidden data");
        res.status(403).json({ message: "you are not allow to search for user" })
    }


}; //End of processGetUserData

/** @type {import("express").RequestHandler<{recordId:number}>} */
exports.processGetOneUserData = async function (req, res) {
    let recordId = parseInt(req.params.recordId);
    if (isNaN(recordId) || recordId < 0) {
        res.statusCode = 400;
        res.json({ message: "Invalid id" });
    }


    try {
        /* check if the user is admin or the user itself */
        if (req.token.userId === recordId || req.token.userRole === "admin") {
            let result = (await userManager.getOneUserData(recordId))[0];
          //  console.log('Inspect result variable inside processGetOneUserData code\n', result);
            if (result) {
                /*output sanitization */
                result.fullname = result.fullname.replace(REGEXP_SANITIZATION, "");
                result.email = result.email.replace(REGEXP_SANITIZATION, "");
                var jsonResult = {
                    'userdata': result,
                }
                logger.info("User data with id=" + recordId + " have been view by id=" + req.token.userId);
                return res.status(200).json(jsonResult);
            } else {
                res.status(404).json({ message: "User not found" })
            }
        } else {
            logger.warn("user with id="+req.token.userId+" and IP="+req.connection.remoteAddress+" tried to access forbidden data");
            return res.status(403).json({ message: "You are not allow to view user data" });
        }

    } catch (error) {
        logger.error("Server is unable to process your request due to " + error.message);
        /* console.error('\x1b[31mprocessGetOneUserData method : catch block section code is running');
         console.error(error, '=======================================================================\x1b[0m'); */
        return res.status(500).json({message:"Server is unable to process your request."});
    }

}; //End of processGetOneUserData

/** @type {import("express").RequestHandler<null,{message:string},{newRoleId:number,recordId:number}>} */
exports.processUpdateOneUser = async function (req, res) {
    console.log('processUpdateOneUser running');
    /* check if the user is admin as only admin can change role */
    if (req.token.userRole === 'admin') {
        //Collect data from the request body
        let { recordId, roleId:newRoleId } = req.body;
        if (isNaN(recordId) || isNaN(newRoleId)) {
            res.statusCode = 400;
            res.json({ message: "invalid id" })
            return;
        }
        try {
            results = await userManager.updateUser(recordId, newRoleId);
            logger.info("user data with id=" + recordId + " have been updated by admin with id=" + req.token.userId);
            return res.status(200).json({ message: 'Completed update' });
        } catch (error) {
            /*  console.error('\x1b[31mprocessUpdateOneUser method : catch block section code is running');
             console.error(error, '=======================================================================\x1b[0m'); */
            logger.error("Unable to complete update operation due to " + error.message);
            return res.status(500).json({ message: 'Unable to complete update operation' });
        }
    } else {
        logger.warn("user with id="+req.token.userId+" and IP="+req.connection.remoteAddress+" is forbidden to edit user data");
        res.status(403).json({ message: 'You not allow to edit user' });
    }



}; //End of processUpdateOneUser

/** @type {import("express").RequestHandler<{fileId:number}>} */
exports.processGetOneDesignData = async function (req, res) {
    let recordId = parseInt(req.params.fileId);
    let userId = req.token.userId;
    /* check if the file is a number */
    if (isNaN(recordId) || recordId < 0) {
        return res.status(400).json({ message: 'Invalid file id' })
    }

    try {
        let result = (await userManager.getOneDesignData(recordId, userId))[0];
        if (result) {

            result.design_description = result.design_description.replace(REGEXP_SANITIZATION, "");
            result.design_title = result.design_title.replace(REGEXP_SANITIZATION, "");
            var jsonResult = {
                'filedata': result,
            }
            return res.status(200).json(jsonResult);
        } else {
            res.status(404).json({ message: "Design not found" })
        }
    } catch (error) {
/*console.error('\x1b[31mprocessUpdateOneUser method : catch block section code is running');
console.error(error, '=======================================================================\x1b[0m');*/
        logger.error("Server is unable to process the request due to " + error.message);
        return res.status(500).json({
            message:"Server is unable to process the request."
        });
    }

}; //End of processGetOneDesignData

/** @type {import("express").RequestHandler} */
exports.processUpdateOneDesign = async function (req, res) {
    console.log('processUpdateOneFile running');
    //Collect data from the request body 
    let { fileId, designTitle, designDescription } = req.body;
    console.log({ fileId, designTitle, designDescription })
    let userId = req.token.userId;
    /* check if file id is a number */
    if (typeof fileId !== "number" || isNaN(fileId) || fileId < 0) {
        return res.status(400).json({ message: 'Invalid file id' })
    }
    /* check if all the data required is there */
    if (designDescription == null || designTitle == null) {
        return res.status(400).json({ message: 'Missing input' })
    }
    if (REGEXP_TEXT.test(designDescription) && REGEXP_TEXT.test(designTitle)) {
        try {
            results = await userManager.updateDesign(fileId, designTitle, designDescription, userId);
            console.log(results);
            return res.status(200).json({ message: 'Completed update' });
        } catch (error) {
            /*  console.error('\x1b[31mprocessUpdateOneDesign method : catch block section code is running');
             console.error(error, '=======================================================================\x1b[0m'); */
            logger.error('Unable to complete update operation due to ' + error.message);
            return res.status(500).json({ message: 'Unable to complete update operation' });
        }
    } else {
        return res.status(400).json({ message: 'Invalid input' })
    }

}; //End of processUpdateOneDesign