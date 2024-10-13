const express=require("express")
const admin_controler=require("../controller/admin controler/admin_controler")
const { getAll_orders } = require("../controller/user controler/user_controler")
const Router=express.Router()


Router

//user routes
//-----------------------
.get("/admin/getusers",admin_controler.get_allUsers)
.delete("/admin/deleteuser/:id",admin_controler.delete_user)
.get("/admin/userbyid/:id",admin_controler.getUser_byId)
.put("/admin/blockuser/:id",admin_controler.blockUser)

//products routes
//------------------------
.get("/admin/getallproducts",admin_controler.getAll_products)
.get("/admin/getproductbyid/:id",admin_controler.getProducts_byId)
.post("/admin/addproduct",admin_controler.addProduct)
.put("/admin/editproduct/:id",admin_controler.editProduct)
.delete("/admin/deleteproduct/:id",admin_controler.deleteProduct)


//order routes
//--------------------

.get("/admin/getallorders",admin_controler.getAll_orders)
.get("/admin/getorderbyid/:id",admin_controler.getOrder_byuserId)
.delete("/admin/cancelorder/:id",admin_controler.cancel_orderByID)
.get("/admin/calculateincome",admin_controler.totalRevanue)



module.exports=Router