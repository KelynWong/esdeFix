/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const pool = require('../config/database')
/**
 * @callback callback
 * @param {Error} error
 * @param {{user_id:number, fullname:string, email:string, user_password:string, role_name:string, role_id:number }[]} result
 */
/**
 * @param {string} email 
 */
module.exports.authenticate = (email) => {
    return new Promise((resolve,reject)=>{
        pool.getConnection((err, connection) => {
            if (err) {
               reject(err)
    
            } else {
                try {
                    /* fixed sql  */
                    connection.query(`SELECT user.user_id, fullname, email, user_password, role_name, user.role_id  
                       FROM user INNER JOIN role ON user.role_id=role.role_id WHERE email=? AND verified=1`, email, (err, rows) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(rows);
                        }
                        connection.release();
    
                    });
                } catch (error) {
                     reject(error);
                }
            }
        }); //End of getConnection
    })
   

} //End of authenticate