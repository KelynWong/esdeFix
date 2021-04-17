/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const transporter = require("nodemailer").createTransport({
  host: "smtp-mail.outlook.com",
    port: 587,
    secureConnection: false, 
    auth: {
      user: process.env.EMAIL_USERNAME, // generated ethereal user
      pass:process.env.EMAIL_PASSWORD, // generated ethereal password
    }
    
  });
  /**
   * @param {string} hostname 
   * @param {string} UserEmail 
   * @param {string} token 
   */
module.exports.verifyEmail = function(hostname,UserEmail,token){
  return  transporter.sendMail({
    to: UserEmail,
    from: `Bee Design Award Competition <${process.env.EMAIL_USERNAME}>`,
    subject: 'verify Email',
    text:'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        `${hostname}/verifyEmail.html?token=` + encodeURIComponent(token) + '\n\n' +
        'The link will expire in 10 minute.\n'
})
}
