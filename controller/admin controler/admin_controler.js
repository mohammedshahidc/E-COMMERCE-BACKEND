const express=require("express")
const User=require("../../model/user_model")

const get_allUsers = async (req, res) => {
    try {

        const users = await User.find({block:false})
        res.status(201).json(users)
    } catch (error) {
        res.status(401).json({ error: error.message })
    }
}



const delete_user=async(req,res)=>{
    try {
        const userId=req.params.id
        const deleteUser=await User.findByIdAndDelete(userId)
        if(!deleteUser){
            return res.status(401).json("user not found")
        }
        res.status(200).json({errorCode:0,status:true,data:deleteUser})
    } catch (error) {
       res.status(400).json({error:error.message}) 
    }
}


const getUser_byId=async(req,res)=>{
    try {
        const userId=req.params.id
        const userbyId=await User.findById(userId)
        if(!userbyId){
          return  res.status(401).json("user not found")
        }
        res.status(200).json({errorCode:0,data:userbyId})
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}



const blockUser=async(req,res)=>{
    try {
        const userId=req.params.id
        const user=await User.findByIdAndUpdate(userId)
        if(!user){
            res.status(404).json("user not found")
        }
        if(user.block===false){
            user.block=true
            await user.save()
            res.status(200).json({errorCode:0,status:true,message:"succesfully blocked user",data:user})
        }else{
            user.block=false
           await user.save()
            res.status(200).json({errorCode:0,status:true,message:"succesfully unblocked user",data:user})
        }
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}
module.exports={
    get_allUsers,
    delete_user,
    getUser_byId,
    blockUser
}