const express=require("express")
const User=require("../../model/user_model")
const Products=require("../../model/product_model")
const {product_joiSchema}=require("../../model/validation")
const Joi = require('@hapi/joi');
const Orders=require("../../model/order_schem")
//admin users controler
//-------------------------------------------
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




//admin products controler
//----------------------------------------------------



const getAll_products=async(req,res)=>{
    try {
        const allProducts=await Products.find()
        if(!allProducts){
            return res.status(401).json("porducts not found")
        }
        res.status(200).json({errorCode:0,status:true,data:allProducts})
    } catch (error) {
        res.status(400).josn({error:error.message})
    }
}



const getProducts_byId=async(req,res)=>{
    try {
        const producById=await Products.findById(req.params.id)
        if(!producById){
           return res.status(401).json({errorCode:1,message:"porduct not found"})
        }
        res.status(200).json({errorCode:0,status:true,data:producById})
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}




const addProduct=async(req,res)=>{
    try {
        const { error, value } = product_joiSchema.validate(req.body);
        if(error){
         return   res.status(401).json({errorCode:1,message:error})
        }
        const {name,type,image,price,description,brand,rating,reviews}=value
        const newProduct= new Products(value)
        await newProduct.save()
        res.status(200).json({errorCode:0,message:"product added successfully",data:newProduct})

    } catch (error) {
        res.status(400).json({errorCode:2,message:error.message})
    }
}



const editProduct=async(req,res)=>{
    try {
        const {error,value}=product_joiSchema.validate(req.body)
        const updatedproduct=await Products.findByIdAndUpdate(req.params.id,value,{new:true})
        if(!updatedproduct){
            res.status(401).json({errorCode:1,message:error})
        }
        res.status(200).json({errorCode:0,message:"product updated successfully",data:updatedproduct})
        
    } catch (error) {
        res.status(400).json({errorCode:2,message:error.message})
    }
}



const deleteProduct=async (req,res)=>{
    try {
       const deletedProduct=await Products.findByIdAndDelete(req.params.id)
       if(!deleteProduct){
        res.status(401).json({errorCode:1,message:"product not found"})
       } 
       res.status(200).json({errorCode:0,message:"product deleted successfully",data:deleteProduct})
    } catch (error) {
        res.status(400).json({errorCode:2,message:error.message})
    }
}




//order controler
//-----------------------------------------------------------------------



const getAll_orders=async(req,res)=>{
    try {
        const all_orders=await Orders.find()
        if(!all_orders){
            return  res.status(401).json({errorCode:1,message:"orders not found"})
        }
        res.status(200).json({errorCode:0,data:all_orders})
    } catch (error) {
        res.status(400).json({errorCode:2,message:error.message})
    }
}

const getOrder_byuserId=async(req,res)=>{
    try {
        const userId=req.params.id
        const order=await Orders.findOne({userId:userId}).populate("products.productId","name price")
        console.log(order);
        if(!order){
            return  res.status(401).json({errorCode:1,message:"order not found"})
        }
        res.status(200).json({errorCode:0,data:order})
    } catch (error) {
        res.status(400).json({errorCode:2,message:error.message})  
    }
}


const cancel_orderByID=async(req,res)=>{
    try {
        const order=await Orders.findById(req.params.id)
        if(!order){
            return res.status(401).json({errorCode:1,message:"order not found"})
        }
        if(order.paymentStatus==="completed"){
            return res.status(401).json({errorCode:2,message:"cannot cancel this order, all ready paid"})

        }
        order.paymentStatus="cancelled"
        order.shoppingStatus="cancelled"
        await order.save()
        res.status(200).json({errorCode:0,data:order})

    } catch (error) {
        res.status(400).json({errorCode:3,message:error.message})  
 
    }
}



const totalRevanue=async(req,res)=>{
    try {
        const total_revanue=await Orders.aggregate([
            {$group:{
                _id:null,
                totalIncome:{$sum:"$amount"}
            }}
        ])
        if(total_revanue.length>0){
          return  console.log("total revanue:",total_revanue[0].totalIncome);
        }
        res.status(200).json({errorCode:0,data:total_revanue})
    } catch (error) {
        res.status(400).json({errorCode:3,message:error.message})  

    }
}


module.exports={
    get_allUsers,
    delete_user,
    getUser_byId,
    blockUser,
    getAll_products,
    getProducts_byId,
    addProduct,
    editProduct,
    deleteProduct,
    getAll_orders,
    getOrder_byuserId,
    cancel_orderByID,
    totalRevanue
}