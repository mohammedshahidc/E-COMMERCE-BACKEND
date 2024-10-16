
const tryCatch=(controler)=>async(req,res,next)=>{
    try {
        await controler(req,res,next)
    } catch (error) {
        return next(error)
    }
}
module.exports=tryCatch