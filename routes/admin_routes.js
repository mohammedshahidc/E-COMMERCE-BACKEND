const express=require("express")
const admin_controler=require("../controller/admin controler/admin_controler")
const Router=express.Router()


Router
.get("/admin/getusers",admin_controler.get_allUsers)
.delete("/admin/deleteuser/:id",admin_controler.delete_user)
.get("/admin/userbyid/:id",admin_controler.getUser_byId)
.put("/admin/blockuser/:id",admin_controler.blockUser)


module.exports=Router