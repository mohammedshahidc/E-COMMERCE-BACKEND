const express=require("express")
const admin_controler=require("../controller/admin controler/admin_controler")
const { getAll_orders } = require("../controller/user controler/user_controler")
const {admin_auth}=require("../midleware/user_authentication")
const Router=express.Router()


Router

//user routes
//-----------------------
.get("/admin/getusers",admin_auth,admin_controler.get_allUsers)
.delete("/admin/deleteuser/:id",admin_auth,admin_controler.delete_user)
.get("/admin/userbyid/:id",admin_auth,admin_controler.getUser_byId)
.put("/admin/blockuser/:id",admin_auth,admin_controler.blockUser)

//products routes
//------------------------
.get("/admin/getallproducts",admin_auth,admin_controler.getAll_products)
.get("/admin/getproductbyid/:id",admin_auth,admin_controler.getProducts_byId)
.post("/admin/addproduct",admin_auth,admin_controler.addProduct)
.put("/admin/editproduct/:id",admin_auth,admin_controler.editProduct)
.delete("/admin/deleteproduct/:id",admin_auth,admin_controler.deleteProduct)


//order routes
//--------------------

.get("/admin/getallorders",admin_auth,admin_controler.getAll_orders)
.get("/admin/getorderbyid/:id",admin_auth,admin_controler.getOrder_byuserId)
.delete("/admin/cancelorder/:id",admin_auth,admin_controler.cancel_orderByID)
.get("/admin/calculateincome",admin_auth,admin_controler.totalRevanue)



module.exports=Router