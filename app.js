require('dotenv').config()
const express=require("express")
const mongoose=require("mongoose")
const user_router=require("./routes/user_routes")
const admin_routes=require("./routes/admin_routes")
const  errorManager = require('./midleware/error_handler')
const customeError = require('./utils/customError')
const cookieParser=require("cookie-parser")
const cors=require("cors")

const app=express()
app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: "https://shoe-e-commerce-web-application.vercel.app",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  }));

app.use("/api",user_router)
app.use("/api",admin_routes)
app.use(errorManager)

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("connected successfully");    
})
.catch((Error)=>{
    console.log("failed to connect",Error);
})


app.all("*",(req,res,next)=>{
    const err = new customeError(`Cannot ${req.method} ${req.originalUrl}`, 404);
     next(err);
})






app.listen(process.env.PORT,()=>{
    console.log(`server run on ${process.env.PORT}`);
})