const express=require("express")
const User=require("../model/user_model")
const jwt=require("jsonwebtoken")
const user_joiSchema=require("../model/validation")


const user_registarion=async(req,res)=>{
   try {
    const {name,email,password,cpassword}=req.body
    const new_user=new User(req.body)
   await new_user.save()
    res.status(201).json({errorcode:0,status:true,msg:"user created successfully",data:new_user})
   } catch (error) {
    res.status(404).json({error:error.message})
   }
}
const get_users=async(req,res)=>{
try {
    const {name,email,password,cpassword}=req.body
    const users=await User.find()
    res.status(201).json(users)
} catch (error) {
    res.status(401).json({error:error.message})
}  
}
const user_login=async(req,res)=>{
   try {
    const {name,password}=req.body
    const user=await User.findOne({name:name})
    if(!user){return res.status(200).json({errorcode:1,status:true,msg:"user not found",data:null})}
    if(user.password !==password){return res.status(200).json({errorcode:2,status:true,msg:"password is incorrect",data:null})}
    const token=jwt.sign({id:user._id,username:user.username,email:user.email},process.env.JWT_KEY,{expiresIn:"1d"})
    res.cookie('token', token, {
        httpOnly: true,  // Prevents client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        maxAge: 24 * 60 * 60 * 1000,  // Cookie will expire in 1 day
        sameSite: 'strict'  // Helps prevent CSRF attacks
      });
    res.status(200).json({errorcode:0,status:true,msg:"login successfully",data:token})
   } catch (error) {
    res.status(401).json({error:error.message})
   }
}

module.exports={
    user_registarion,get_users,user_login
}