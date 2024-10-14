const express=require("express")
const user_controller=require("../controller/user controler/user_controler")
const { user_auth} = require("../midleware/user_authentication")
const routes=express.Router()

routes

.post("/user/register",user_controller.user_registarion)
.post("/user/login",user_controller.user_login)
//products routes
//-----------------------------------------------------------------------------
.get("/user/products",user_controller.getall_products)
.get("/user/productsby/:type",user_controller.getproducts_bycatogory)
.get("/user/productsById/:id",user_controller.getProduct_ById)

//cart routes
//-----------------------------------------------------------------------------

.post("/user/addtocart",user_auth,user_controller.add_toCart)
.get("/user/getcart",user_auth,user_controller.get_cartItems)
.put("/user/updatecart",user_auth,user_controller.updateCart)
.delete("/user/deletecart/:productId",user_auth,user_controller.removeFrom_cart)
.delete("/user/clearecart",user_auth,user_controller.clearCart)

//wishlist routes
//-----------------------------------------------------------------------------

.post("/user/addtowishlist",user_auth,user_controller.addto_wishlist)
.delete("/user/removewishlist",user_auth,user_controller.remove_itemFromwishlist)
.get("/user/getwishlist",user_auth,user_controller.get_wishlist)

//order routes
//-----------------------------------------------------------------------------

.post("/user/createorder",user_auth,user_controller.createOrder)
.post("/user/verifyorder",user_controller.verify_order)
.get("/user/getallorders",user_auth,user_controller.getAll_orders)
.delete("/user/ordercanceleation/:id",user_auth,user_controller.order_cancelation)
.post("/user/logOut",user_auth,user_controller.userlog_out)



module.exports=routes