const mongoose=require("mongoose")

const userschema=new mongoose.Schema({
    
      username: {
        type: String,
        required: true,
        
      },
      email: {
        type: String,
        required: true,
       
      },
      password: {
        type: String,
        required: true,
      },
      cpassword: {
        type: String,
        required: true,
      },
      admin: {
        type: Boolean,
        default: false,
      },
      block: {
        type: Boolean,
        default: false,
      },
     
})
const User=mongoose.model("User",userschema)
module.exports=User