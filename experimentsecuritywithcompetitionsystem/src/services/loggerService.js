/**
 * @author Ang Yun Zane (1949955)
 * @author Wong En Ting Kelyn (1935800)
 * Class:DIT/FT/2A/21
 */
const {resolve}= require("path")
const winston = require("winston");
class LoggerService {
  constructor(fileName) {
    this.logger = winston.createLogger({
      transports: [
        //transport,
        new winston.transports.Console({
          format:{transform:(info)=>{
            let message = Symbol.for("message");
            switch(info.level){
              case "info":
                info[message]="\x1b[32m"+info[message]+"\x1b[0m";
                break;
              case "debug":
              case "warn":
                info[message]= "\x1b[33m"+info[message]+"\x1b[0m";
                 break
              case "error" :
                info[message]= "\x1b[31m"+info[message]+"\x1b[0m";
                 break
            }
            return info;
          }}
        }),
        new winston.transports.File({
          filename: resolve(__dirname,"../../logs/app.log"),
        }),
      ],
      format: winston.format.printf( info => {
        let message = `${new Date().toLocaleString("en-SG")} | ${info.level.toUpperCase()} | ${fileName}.js | ${
          info.message
        } | `;
        message += info.obj
          ?` data:${JSON.stringify(info.obj)} | `
          : "";

        return message;
      }),
    });
  }

  //Functions that will be used to log in endpoint
/**
 * @param {string} message 
 * @param {{[s:string]:any}|undefined} obj 
 */
  async info(message, obj) {
    this.logger.log("info", message, {
      obj,
    });
  }
/**
 * @param {string} message 
 * @param {{[s:string]:any}|undefined} obj 
 */
  async debug(message, obj) {
    this.logger.log("debug", message, {
      obj,
    });
  }
  /**
 * @param {string} message 
 * @param {{[s:string]:any}|undefined} obj 
 */
  async warn(message, obj) {
    this.logger.log("warn", message, {
      obj,
    });
  }
/**
 * @param {string} message 
 * @param {{[s:string]:any}|undefined} obj 
 */
  async error(message, obj) {
    this.logger.log("error", message, {
      obj,
    });
  }
}
module.exports = LoggerService;
