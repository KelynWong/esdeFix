/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const pool = require('../config/database')
/**
 * @typedef {import("mysql").OkPacket} OkPacket
 */
/**
 * @param {string} fullname
 * @param {string} email
 * @param {string} password
 * @returns {Promise<OkPacket>}
 */
module.exports.createUser = (fullname, email, password) => {
    console.log(fullname, email, password);
    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('\x1b[31mDatabase connection error \x1b[0m', err);
                reject(err);
            } else {
                connection.query('INSERT INTO user ( fullname, email, user_password, role_id) VALUES (?,?,?,2) ', [fullname, email, password], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of createUser
/**
 * @param {number} id
 * @returns {Promise<OkPacket>} 
 */
module.exports.emailVilified = (id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                reject(err)
            } else {
                conn.query("UPDATE user  SET verified=1 WHERE user_id=? ;", id, (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results)
                    }
                    conn.release();
                })
            }
        })
    })
}//end of emailVilified 
/**
 * 
 * @param {Number} id 
 */
module.exports.deleteUser = function (id) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                reject(err)
            } else {
                conn.query("DELETE FROM user WHERE user_id=? ;", id, (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results)
                    }
                    conn.release();
                })
            }
        })
    })
}
/**
 * @param {number} recordId
 * @param {number} newRoleId
 * @returns {Promise<OkPacket>}
 */
module.exports.updateUser = (recordId, newRoleId) => {

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('\x1b[31mDatabase connection error\x1b[0m ', err);
                reject(err);
            } else {
                /*fixed sql*/
                connection.query(`UPDATE user SET role_id =? WHERE user_id=?`, [newRoleId, recordId], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of updateUser

/**
 * @param {number} recordId
 * @param {number} newRoleId
 * @returns {Promise<[{user_id:number, fullname:string, email:string, role_name:string }[],OkPacket,[{total_records:number}]]>}
 */
module.exports.getUserData = (pageNumber, search) => {
    console.log('\x1b[32mgetUserData method is called.\x1b[0m');
    const page = pageNumber;
    if (search == null) { search = ''; };
    const limit = 4; //Due to lack of test files, I have set a 3 instead of larger number such as 10 records per page
    const offset = (page - 1) * limit;
    let userDataQuery;
    let userDataInput;
    //If the user did not provide any search text, the search variable
    //should be null. The following console.log should output undefined.
    //console.log(search);
    //-------------- Code which does not use stored procedure -----------
    //Query for fetching data with page number, search text and offset value
    if ((search == '') || (search == null)) {
        console.log('Prepare query without search text');
        userDataQuery = `SELECT user_id, fullname, email, role_name 
        FROM user INNER JOIN role ON user.role_id = role.role_id LIMIT ?,? ;
        SET @total_records =(SELECT count(user_id) FROM user);SELECT @total_records total_records; `;
        userDataInput = [offset, limit]
    } else {
        userDataQuery = `SELECT user_id, fullname, email, role_name 
        FROM user INNER JOIN role ON user.role_id = role.role_id AND fullname LIKE CONCAT('%',?,'%')  LIMIT ?,?;
    SET @total_records =(SELECT count(user_id) FROM user WHERE fullname LIKE CONCAT('%',?,'%') );SELECT @total_records total_records;`;
        userDataInput = [search, offset, limit, search]
    }

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Database connection error ', err);
                /*fixed*/
                reject(err);
            } else {

                connection.query(userDataQuery, userDataInput, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('\x1b[32mAccessing total number of rows : \x1b[0m', results[2][0].total_records);
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getUserData
/**
 * @param {number} recordId
 * @returns {Promise<{user_id:number, fullname:string, email:string, role_id:number, role_name:string}[]>}
 */
module.exports.getOneUserData = function (recordId) {
    console.log('\x1b[32mgetOneUserData method is called.');
    console.log('Prepare query to fetch one user record\x1b[0m');
    /*fixed*/
    userDataQuery = `SELECT user_id, fullname, email, user.role_id, role_name 
        FROM user INNER JOIN role ON user.role_id = role.role_id WHERE user_id=?`;

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('\x1b[31mDatabase connection error \x1b[0m', err);
                /*fixed*/
                reject(err);
            } else {
                connection.query(userDataQuery, [recordId], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getOneUserData
/**
 * @param {number} recordId
 * @param {number} userId
 * @returns {Promise<{file_id:number,cloudinary_file_id:string,cloudinary_url:string,design_title:string,design_description:string }>}
 */
module.exports.getOneDesignData = function (recordId, userId) {
    console.log('\x1b[32mgetOneDesignData method is called.');
    console.log('Prepare query to fetch one design record\x1b[0m');
    /*fixed*/
    userDataQuery = `SELECT file_id,cloudinary_file_id,cloudinary_url,design_title,design_description 
        FROM file WHERE file_id=? AND  created_by_id=?`;

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('\x1b[31mDatabase connection error \x1b[0m', err);
                /*fixed*/
                reject(err);
            } else {
                connection.query(userDataQuery, [recordId, userId], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getOneDesignData
/**
 * @param {number} recordId
 * @param {string} title
 * @param {string} description
 * @param {number} userId
 * @returns {Promise<OkPacket>}
 */
module.exports.updateDesign = (recordId, title, description, userId) => {

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('\x1b[31mDatabase connection error \x1b[0m', err);
                /*fixed*/
                reject(err);
            } else {
                connection.query(`UPDATE file SET design_title =? , design_description=? WHERE file_id=? AND  created_by_id=?`, [title, description, recordId, userId], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of updateDesign