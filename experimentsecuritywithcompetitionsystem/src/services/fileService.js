/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
//Reference: https://cloudinary.com/documentation/node_integration
const cloudinary = require('cloudinary').v2;
const pool = require('../config/database')
const { unlink } = require("fs")
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    upload_preset: 'upload_to_design'
});
/**
 * @param {import('fs').ReadStream} file 
 * @returns {Promise<{imageURL:string,publicId:string,status:string}>}
 */
module.exports.uploadFile = (file) => {
    return new Promise((resolve, reject) => {
        // upload image here
        let uploadStream = cloudinary.uploader.upload_stream({ upload_preset: 'upload_to_design' }, (err, result) => {
            /* delete file after uploaded */
            unlink(file.path, console.log);
            if (err) {
                console.error(err)
                reject(err)
            } else {
                //Inspect whether I can obtain the file storage id and the url from cloudinary
                //after a successful upload.
                console.log({ imageURL: result.secure_url, publicId: result.public_id });
                resolve({ imageURL: result.secure_url, publicId: result.public_id, status: 'success' })
            }
        })
        file.pipe(uploadStream);
    })

} //End of uploadFile
/**
 * 
 * @param {string} imageURL 
 * @param {string} publicId 
 * @param {number} userId 
 * @param {string} designTitle 
 * @param {string} designDescription
 * @returns {Promise<import('mysql').OkPacket>}
 */
module.exports.createFileData = (imageURL, publicId, userId, designTitle, designDescription) => {
    console.log('createFileData method is called.');
    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                reject(err);
            } else {
                console.log('Executing query');
                let query = `INSERT INTO file ( cloudinary_file_id, cloudinary_url , 
                 design_title, design_description,created_by_id ) 
                 VALUES (?,?,?,?,?) `;
                connection.query(query, [publicId, imageURL, designTitle, designDescription, userId], (err, rows) => {
                    if (err) {
                        console.error('Error on query on creating record inside file table', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of createFileData
/**
 * 
 * @param {number} userId 
 * @param {number} pageNumber 
 * @param {string} search
 * @returns {Promise<[{"file_id":number,"cloudinary_url":string,"design_title":string,"design_description":string}[],Promise<import('mysql').OkPacket>]>}
 */
module.exports.getFileData = (userId, pageNumber, search) => {

    console.log('getFileData method is called.');
    const page = pageNumber;
    if (search == null) { search = ''; };
    const limit = 4; //Due to lack of test files, I have set a 3 instead of larger number such as 10 records per page
    const offset = (page - 1) * limit;
    let designFileDataQuery = '';
    let designFileDataInput;
    /*If the user did not provide any search text, the search variable
    should be null. The following console.log should output undefined.
    console.log(search);
    -------------- Code which does not use stored procedure -----------
    Query for fetching data with page number and offset (and search)*/
    if ((search == '') || (search == null)) {
        console.log('\x1b[32mPrepare query without search text\x1b[0m');
        /*fixed*/
        designFileDataQuery = `SELECT file_id,cloudinary_url,design_title,design_description 
        FROM file  WHERE created_by_id=?  LIMIT ?,?;
        SET @total_records =(SELECT count(file_id) FROM file WHERE created_by_id=?   );SELECT @total_records total_records; `;
        designFileDataInput = [userId, offset, limit, userId]
    } else {
        designFileDataQuery = `SELECT file_id,cloudinary_url,design_title,design_description 
            FROM file  WHERE created_by_id=? AND design_title LIKE CONCAT('%',?,'%')  LIMIT ?,?;
            SET @total_records =(SELECT count(file_id) FROM file WHERE created_by_id=? AND design_title LIKE CONCAT('%',?,'%') );SELECT @total_records total_records;`;
        designFileDataInput = [userId, search, offset, limit, userId, search]
    }
    //--------------------------------------------------------------------
    //designFileDataQuery = `CALL sp_get_paged_file_records(?,?,?,?, @total_records); SELECT @total_records total_records;`;

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Database connection error ', err);
                reject(err);
            } else {
                console.log('Executing query to obtain 1 page of 3 data');
                connection.query(designFileDataQuery, designFileDataInput, (err, results) => {
                    if (err) {
                        console.log('Error on query on reading data from the file table', err);
                        reject(err);
                    } else {
                        //The following code which access the SQL return value took 2 hours of trial
                        //and error.
                        console.log('Accessing total number of rows : ', results[2][0].total_records);
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getFileData