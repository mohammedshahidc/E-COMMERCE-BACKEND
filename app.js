require('dotenv').config()
const express=require("express")
const mongoose=require("mongoose")
const user_router=require("./routes/user_routes")
const app=express()

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true
  })
.then(()=>{
    console.log("connected successfully");    
})
.catch((Error)=>{
    console.log("failed to connect",Error);
})
app.use(express.json())
app.use("/api",user_router)








app.listen(process.env.PORT,()=>{
    console.log(`server run on ${process.env.PORT}`);
})