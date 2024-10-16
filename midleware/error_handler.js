const errorManager=(err,req,res,next)=>{

        const statusCode= err.statusCode || 500
        const message= err || "internal server error"
       
        const status=err.status || "error"
        

        return res.status(statusCode).json({
            statusCode,
            status,
            message
        })


}
module.exports=errorManager