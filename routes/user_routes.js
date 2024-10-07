const express=require("express")
const user_controller=require("../controller/user controler/user_controler")
const user_auth = require("../midleware/user_authentication")
const routes=express.Router()

routes
.post("/user/register",user_controller.user_registarion)
.get("/user/getusers",user_controller.get_users)
.post("/user/login",user_controller.user_login)
.get("/user/products",user_controller.getall_products)
.get("/user/productsby/:type",user_controller.getproducts_bycatogory)
.get("/user/productsById/:id",user_controller.getProduct_ById)
.post("/user/addtocart",user_controller.add_toCart)
.get("/user/getcart/:id",user_controller.get_cartItems)
.put("/user/updatecart/:id",user_controller.updateCart)
.delete("/user/deletecart/:userId/:productId",user_controller.removeFrom_cart)
.delete("/user/clearecart/:id",user_controller.clearCart)
.post("/user/addtowishlist",user_controller.addto_wishlist)
module.exports=routes