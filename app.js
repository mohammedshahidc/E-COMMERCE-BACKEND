require('dotenv').config()
const express=require("express")
const mongoose=require("mongoose")
const user_router=require("./routes/user_routes")
const admin_routes=require("./routes/admin_routes")
const  errorManager = require('./midleware/error_handler')
const customeError = require('./utils/customError')
const app=express()

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("connected successfully");    
})
.catch((Error)=>{
    console.log("failed to connect",Error);
})
app.use(express.json())
app.use("/api",user_router)
app.use("/api",admin_routes)
app.all("*",(req,res,next)=>{
    const err = new customeError(`Cannot ${req.method} ${req.originalUrl}`, 404);
     next(err);
})
app.use(errorManager)





app.listen(process.env.PORT,()=>{
    console.log(`server run on ${process.env.PORT}`);
})