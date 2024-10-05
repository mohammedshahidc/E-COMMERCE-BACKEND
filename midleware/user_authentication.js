const jwt=require("jsonwebtoken")

const user_auth=(req,res,next)=>{
    const token=req.cookies.token
    if(!token){
        res.status(404).json({message:"no token"})
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_KEY)
        req.user=decoded
        if(req.user.admin){
            res.status(404).json({message:"No role assigned, access denied"})
        }
        next()
    } catch (error) {
        res.status(400).json({message:"Invalid token"})
    }
}
module.exports=user_auth