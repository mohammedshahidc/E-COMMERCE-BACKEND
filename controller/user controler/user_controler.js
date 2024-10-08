const express = require("express")
const User = require("../../model/user_model")
const jwt = require("jsonwebtoken")
const { user_joiSchema } = require("../../model/validation");
const Products = require("../../model/product_model")
const Cart = require("../../model/cart_schema")
const Wishlist=require("../../model/wishlist_model")
const stripe=require("stripe")
const Order=require("../../model/order_schem")
const user_registarion = async (req, res) => {
    const { value, error } = user_joiSchema.validate(req.body);

    const { username, email, password, cpassword } = value
    if (error) {
        throw error
    }
    try {

        const new_user = new User({ username, email, password, cpassword })
        await new_user.save()
        res.status(201).json({ errorcode: 0, status: true, msg: "user created successfully", data: new_user })
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
}
const get_users = async (req, res) => {
    try {

        const users = await User.find()
        res.status(201).json(users)
    } catch (error) {
        res.status(401).json({ error: error.message })
    }
}
const user_login = async (req, res, next) => {
    const { value, error } = user_joiSchema.validate(req.body)
    const { username, password } = value
    if (error) {
        throw error
    }
    const ADMIN_NAME = process.env.ADMIN_NAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    try {
        if (username === ADMIN_NAME && password === ADMIN_PASSWORD) {
            console.log("admin loged in");
            const token = jwt.sign({
                id: "admin",
                isAdmin: true
            },
                process.env.JWT_KEY,
                {
                    expiresIn: "1d"
                }

            )
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({ token, isAdmin: true });
        }
        const user = await User.findOne({ username: username })

        if (!user) { return res.status(200).json({ errorcode: 1, status: true, msg: "user not found", data: null }) }
        if (user.password !== password) { return res.status(200).json({ errorcode: 2, status: true, msg: "password is incorrect", data: null }) }
        const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, process.env.JWT_KEY, { expiresIn: "1d" })
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });
        console.log("user login");
        res.status(200).json({ errorcode: 0, status: true, msg: "login successfully", data: token })
    } catch (error) {
        res.status(401).json({ error: error.message })
    }
}
const getall_products = async (req, res) => {
    try {
        const products = await Products.find(req.body)
        res.status(200).json(products)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}
const getproducts_bycatogory = async (req, res) => {
    try {
        const products_bycatogory = await Products.find({ type: req.params.type })
        res.status(200).json(products_bycatogory)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }

}
const getProduct_ById = async (req, res) => {
    try {
        const productsById = await Products.find({ _id: req.params.id })
        if (!productsById) {
            res.status(404).json("product not found")

        }
        res.status(200).json(productsById)
    } catch (error) {
        res.status(400).json({ error: error.message })
        console.log(error)
    }
}
const add_toCart = async (req, res) => {
    try {
        const { userId, productId } = req.body
        const cart = await Cart.findOne({ user: userId })
        if (cart) {
            const existing_prooduct = cart.products.find((p) => p._id.equals(productId))
            if (existing_prooduct) {
                existing_prooduct.quantity += 1
            } else {
                cart.products.push({ productId, quantity: 1 })
            }
            await cart.save()
        } else {
            const newCart = new Cart({
                user: userId,
                products: [{ productId, quantity: 1 }]
            })
            await newCart.save()
        }
        res.status(200).json({ message: "products added to cart" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}

//get cart items
const get_cartItems=async(req,res)=>{
    console.log(req.body);
try {
    const userCart=await Cart.findOne({user:req.params.id}).populate("products.product")
    console.log(req.user);
    console.log(userCart);
    if(!userCart){
        res.status(401).json("cart items not found")
    }
    res.status(200).json(userCart)
} catch (error) {
   res.status(400).json({error:error.message}) 
}


}

//uodate cart
const updateCart=async(req,res)=>{
    try {
        
        const{productId,action}=req.body
        const cartData=await Cart.findOne({user:req.user.id}).populate("products.product")
        if(!cartData){
         return   res.status(401).json("cart data not found")
        }
        const productData=cartData.products.find(prod=>prod.product._id.toString()===productId)
        if(!productData){
          return  res.status(401).json("product not found in user cart")
        }
        if(action==="increment"){
            productData.quantity+=1
        }else if(action==="decrement"){
            if(productData.quantity >1){
                productData.quantity-=1
            }
        }else{
            res.status(404).json("Invalid action for updating quantity")
        }
        await cartData.save()
        const updatedCart=await Cart.findOne({user:req.user.id}).populate("products.product")
        res.status(200).json({products:updatedCart.products ||[]})
        
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

const removeFrom_cart=async (req,res)=>{
    
    try {
        const {userId,productId}=req.params
        
        const datas=await Cart.findOne({user:userId}).populate("products.product")
        if(!datas){
            return res.status(401).json("cart not found");

        }
        const productIndex=datas.products.findIndex(pro=>pro.productid===productId)
        datas.products.splice(productIndex,1)
        await datas.save()
        res.status(200).json({ message: "Product removed from cart", products: datas.products || [] });


    } catch (error) {
        res.status(400).json({ error: error.message });

    }
}
const clearCart=async (req,res)=>{
    try {
        const{userId}=req.params
        const cart=await Cart.findOne({userId})
        if(!cart){
            return res.status(404).json({message:"cart not found"})
        }
        cart.products=[]
        await cart.save()
        res.status(200).json({message:"cart clear successfully"})
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}



const addto_wishlist=async(req,res)=>{
    try {
        const{userId,productId}=req.body
        const wishlist=await Wishlist.findOne({user:userId})
        if(!wishlist){
            const newWish=new Wishlist({
                user:userId,
                products:[productId]
            })
            await newWish.save()
            return res.status(200).json(newWish)
        }
        if(!wishlist.products.includes(productId)){
            wishlist.products.push(productId)
            await wishlist.save()
            return res.status(200).json({errorCode:0,message:"item added to wishlist",data:wishlist})
        }
        res.status(200).json("product already added")
    } catch (error) {
        res.status(200).json({error:error.message})
    }
}
const remove_itemFromwishlist=async(req,res)=>{
    try {
        const{userId,productId}=req.body
        const wishlistData=await Wishlist.findOne({user:userId}).populate("products")
        if(!wishlistData){
            return res.status(404).josn("wishlist items not found")
        }
        const productIndex=wishlistData.products.find(prod=>prod._id===productId)
        wishlistData.products.splice(productIndex,1)
        await wishlistData.save()
        return res.status(200).json({errorCode:0,message:"item removed from wishlist",data:wishlistData ||[]})

    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

const get_wishlist=async (req,res)=>{
    try {
        const {userId}=req.body
        const wishlist=await Wishlist.findOne({user:userId}).populate("products")
        if(!wishlist){
          return  res.status(401).json("user wishlist not found")
        }
      return  res.status(200).json({erroCode:0,status:true,data:wishlist})

    } catch (error) {
        res.status(400).json({error:error.message})
    }
}
const createOrder = async (req, res) => {
    const { products, userId } = req.body;
    if (!products || products.length === 0) {
        return res.status(400).json({ message: "No products found in order" });
    }

    try {
        const newOrder = new Order({
            ...req.body,
            userId: userId,
        });

        await newOrder.populate("products.productId", "name price image").execPopulate();

        const hasUnAvailable_products = newOrder.products.some(
            product => !product.productId || !product.productId.name || !product.productId.price
        );

        if (hasUnAvailable_products) {
            return res.status(400).json({ message: "Some products are unavailable" });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const lineData = newOrder.products.map((product) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: product.productId.name,
                    images: [product.productId.image],
                },
                unit_amount: product.productId.price * 100, // amount in smallest currency unit
            },
            quantity: product.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineData,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/checkout/success/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        });

        newOrder.sessionId = session.id;
        await newOrder.save();

        res.status(200).json({ newOrder, id: session.id, client_secret: session.client_secret });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    user_registarion,
    get_users,
    user_login,
    getall_products,
    getproducts_bycatogory,
    getProduct_ById,
    add_toCart,
    get_cartItems,
    updateCart,
    removeFrom_cart,
    clearCart,
    addto_wishlist,
    remove_itemFromwishlist,
    get_wishlist,
    createOrder
}