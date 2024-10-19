const express=require("express")
const user_controller=require("../controller/user controler/user_controler")
const { user_auth} = require("../midleware/user_authentication")
const tryCatch=require("../utils/tryCatch")
const routes=express.Router()

routes

.post("/user/register",tryCatch(user_controller.user_registarion))
.post("/user/login",tryCatch(user_controller.user_login))
//products routes
//-----------------------------------------------------------------------------
.get("/user/products",tryCatch(user_controller.getall_products))
.get("/user/productsby/:type",tryCatch(user_controller.getproducts_bycatogory))
.get("/user/productsById/:id",tryCatch(user_controller.getProduct_ById))

//cart routes
//-----------------------------------------------------------------------------

.post("/user/addtocart",user_auth,tryCatch(user_controller.add_toCart))
.get("/user/getcart",user_auth,tryCatch(user_controller.get_cartItems))
.put("/user/updatecart",user_auth,tryCatch(user_controller.updateCart))
.delete("/user/deletecart/:productId",user_auth,tryCatch(user_controller.removeFrom_cart))
.delete("/user/clearecart",user_auth,tryCatch(user_controller.clearCart))

//wishlist routes
//-----------------------------------------------------------------------------

.post("/user/addtowishlist",user_auth,tryCatch(user_controller.addto_wishlist))
.delete("/user/removewishlist",user_auth,tryCatch(user_controller.remove_itemFromwishlist))
.get("/user/getwishlist",user_auth,tryCatch(user_controller.get_wishlist))

//order routes
//-----------------------------------------------------------------------------

.post("/user/createorder",user_auth,tryCatch(user_controller.createOrder))
.post("/user/verifyorder",user_auth,tryCatch(user_controller.verify_order))
.get("/user/getallorders",user_auth,tryCatch(user_controller.getAll_orders))
.delete("/user/ordercanceleation/:id",user_auth,tryCatch(user_controller.order_cancelation))
.post("/user/logOut",user_auth,tryCatch(user_controller.userlog_out))



module.exports=routes