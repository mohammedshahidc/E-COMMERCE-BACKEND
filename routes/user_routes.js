const express=require("express")
const user_controller=require("../controller/user controler/user_controler")
const routes=express.Router()

routes
.post("/user/register",user_controller.user_registarion)
.get("/user/getusers",user_controller.get_users)
.post("/user/login",user_controller.user_login)
.get("/user/products",user_controller.getall_products)
.get("/user/productsby/:type",user_controller.getproducts_bycatogory)
.get("/user/productsById/:id",user_controller.getProduct_ById)
.post("/user/addtocart",user_controller.add_toCart)

module.exports=routes