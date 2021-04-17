let app = require("express")()
app.use(require("cors")())
app.post("/",(req,res)=>{
    req.pipe(process.stdout,{end:false})
    res.end()
})

app.listen(80)