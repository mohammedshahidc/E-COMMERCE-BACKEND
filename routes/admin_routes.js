const express=require("express")
const admin_controler=require("../controller/admin controler/admin_controler")
const Router=express.Router()


Router

//user routes
.get("/admin/getusers",admin_controler.get_allUsers)
.delete("/admin/deleteuser/:id",admin_controler.delete_user)
.get("/admin/userbyid/:id",admin_controler.getUser_byId)
.put("/admin/blockuser/:id",admin_controler.blockUser)

//products routes
.get("/admin/getallproducts",admin_controler.getAll_products)
.get("/admin/getproductbyid/:id",admin_controler.getProducts_byId)
.post("/admin/addproduct",admin_controler.addProduct)
.put("/admin/editproduct/:id",admin_controler.editProduct)
.delete("/admin/deleteproduct/:id",admin_controler.deleteProduct)
module.exports=Router