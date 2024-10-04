const express=require("express")
const user_controller=require("../controller/user_controler")
const routes=express.Router()

routes
.post("/user/register",user_controller.user_registarion)
.get("/user/getusers",user_controller.get_users)
.post("/user/login",user_controller.user_login)

module.exports=routes