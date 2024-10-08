const { required } = require("joi")
const mongoose=require("mongoose")
const orderSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    products:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"product",
                required:true,
            },
            quantity:{type:Number,required:true,default:1},
        },
    ],
    sessionId:{type:String},
    purchaseDate:{type:Date,default:Date.now},
    amount:{type:Number,required:true},
    address:{type:Object,required:true},
    paymentStatus:{type:String,default:"pending"},
    shoppingStatus:{type:String,default:"pending"},
    info:String,

},
{timestamps:true}
);

module.exports= mongoose.model("Order",orderSchema)