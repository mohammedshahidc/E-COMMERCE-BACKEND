const express = require("express")
const User = require("../../model/user_model")
const jwt = require("jsonwebtoken")
const { user_joiSchema } = require("../../model/validation");
const Products = require("../../model/product_model")
const Cart = require("../../model/cart_schema")
const Wishlist = require("../../model/wishlist_model")
const stripe = require("stripe")
const Order = require("../../model/order_schem")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const customeError = require("../../utils/customError");
const { id } = require("@hapi/joi/lib/base");
const {Stripe} = require('stripe')


const user_registarion = async (req, res, next) => {
    const { value, error } = user_joiSchema.validate(req.body);

    const { username, email, password, cpassword } = value
    if (error) {
        console.error("Validation error:", error);
        throw error
    }
    console.log("Passwords:", password, cpassword);
    if (password !== cpassword) {
        return next(new customeError("invalid password", 404))
    }

    const hashPassword = await bcrypt.hash(password, 6)
    const new_user = new User({ username, email, password: hashPassword, cpassword: hashPassword })
    await new_user.save()
    res.status(201).json({ errorcode: 0, status: true, msg: "user created successfully", new_user })

}



const user_login = async (req, res, next) => {
    const { value, error } = user_joiSchema.validate(req.body);
    const { username, password } = value;

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const ADMIN_NAME = process.env.ADMIN_NAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    try {

        if (username === ADMIN_NAME && password === ADMIN_PASSWORD) {
            console.log("Admin logged in");
            const token = jwt.sign({
                id: "admin",
                isAdmin: true
            },
                process.env.JWT_KEY,
                { expiresIn: "1d" }
            );
            const refreshmentToken=jwt.sign({
                id:"admin",
                isAdmin:true
            },
        process.env.JWT_KEY,
        {expiresIn:"7d"})

            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 24*30 * 60 * 1000
            });
            res.cookie("refreshmentToken", refreshmentToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            return res.status(200).json({ errorcode: 0, status: true, msg: "admin Login successfully",data:{token:token,name:ADMIN_NAME,isAdmin:true}});
        }


        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ errorcode: 1, status: true, msg: "User not found", data: null });
        }
        console.log(user);
        const matching = await bcrypt.compare(password, user.password);
        if (!matching) {
            return res.status(400).json({ errorcode: 2, status: false, msg: "Password is incorrect", data: null });
        }


        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email
        }, process.env.JWT_KEY, { expiresIn: "1d" });

        const refreshmentToken=jwt.sign({
            id:user._id,
            username:user.username,
            email:user.email
        },
        process.env.JWT_KEY,{expiresIn:"7d"}
    )

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
             maxAge: 24 * 30 * 60 * 1000,
            sameSite: 'strict'
        });
        res.cookie('refreshmentToken', refreshmentToken, {
            httpOnly: true,
            secure: true,
            maxAge:7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        })


        console.log("User logged in");
        return res.status(200).json({ errorcode: 0, status: true, msg: "Login successful",data:{token:token,name:user.username}});

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


//user product controlers
//-------------------------------------------------------------------------------------
const getall_products = async (req, res) => {

    const products = await Products.find()
    res.status(200).json(products)

}



const getproducts_bycatogory = async (req, res) => {
  
        const products_bycatogory = await Products.find({ type: req.params.type })
        res.status(200).json(products_bycatogory)
   

}



const getProduct_ById = async (req, res,next) => {
    
        const productsById = await Products.find({ _id: req.params.id })
        if (!productsById) {
            return next(new customeError("product not found"))
        }
        res.status(200).json(productsById)
   
}


//users cart cantrolers
//-----------------------------------------------------------------------------------

const add_toCart = async (req, res) => {

    try {
        const userId = req.user.id
        const { productId } = req.body
        const cart = await Cart.findOne({ user: userId })
        if (cart) {
            const existing_prooduct = cart.products.find((p) => {
                return p.product == productId._id
              
            })
            if (existing_prooduct) {
                existing_prooduct.quantity += 1
            } else {
                cart.products.push({ product: productId, quantity: 1 })
            }
            await cart.save()
        } else {
            const newCart = new Cart({
                user: userId,
                products: [{ product: productId, quantity: 1 }]
            })
            await newCart.save()
        }
        res.status(200).json({ message: "products added to cart" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}

//get cart items
const get_cartItems = async (req, res,next) => {

   
        const userId = req.user.id
        console.log('user id=',userId);
        const userCart = await Cart.findOne({ user: userId }).populate("products.product")

        if (!userCart) {
           return next(new customeError("cart items not found",404))
        }
        res.status(200).json(userCart)
   


}

//update cart
const updateCart = async (req, res,next) => {
  
        const userId = req.user.id
        const { productId, action } = req.body
        const cartData = await Cart.findOne({ user: userId })
        
        if (!cartData) {
            return next(new customeError("cart data not found",404))
        }
        const productData = cartData.products.find(prod => prod.product._id == productId)
        if (!productData) {
            return next(new customeError("product not found in user cart",404))
        }
        if (action === "increment") {
            productData.quantity += 1
        } else if (action === "decrement") {
            if (productData.quantity > 1) {
                productData.quantity -= 1
            }
        } else {
            return next(new customeError("Invalid action for updating quantity",404))
        }
        await cartData.save()
        const updatedCart = await Cart.findOne({ user: userId }).populate("products.product")
        res.status(200).json({ products: updatedCart.products || [] })

    
}



const removeFrom_cart = async (req, res,next) => {

 
        const userId = req.user.id
        const { productId } = req.params

        const datas = await Cart.findOne({ user: userId }).populate("products.product")
        if (!datas) {
            return next(new customeError("cart not found",404))

        }
        const productIndex = datas.products.findIndex(pro => pro.product._id == productId)
        datas.products.splice(productIndex, 1)
        await datas.save()
        res.status(200).json({ message: "Product removed from cart", products: datas.products || [] });


   
}




const clearCart = async (req, res,next) => {
   
        const userId = req.user.id
        const cart = await Cart.findOne({ user: userId })
        if (!cart) {
            return next(new customeError("cart data not found"))
        }
        cart.products = []
        await cart.save()
        res.status(200).json({ message: "cart clear successfully" })
    
}


//users wishlist controlers
//-------------------------------------------------------------------------------


const addto_wishlist = async (req, res,next) => {
    
        const userId = req.user.id
        const { productId } = req.body
        const wishlist = await Wishlist.findOne({ user: userId })
        if (!wishlist) {
            const newWish = new Wishlist({
                user: userId,
                products: [productId]
            })
            await newWish.save()
            return res.status(200).json(newWish)
        }
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId)
            await wishlist.save()
            return res.status(200).json({ errorCode: 0, message: "item added to wishlist", data: wishlist })
        }
        res.status(200).json("product already added")
   
}



const remove_itemFromwishlist = async (req, res,next) => {
   
        const userId = req.user.id
        const { productId } = req.body
        const wishlistData = await Wishlist.findOne({ user: userId }).populate("products")
        if (!wishlistData) {
            return next(new customeError("items not found",404))
        }
        const productIndex = wishlistData.products.find(prod => prod._id === productId)
        wishlistData.products.splice(productIndex, 1)
        await wishlistData.save()
        return res.status(200).json({ errorCode: 0, message: "item removed from wishlist", data: wishlistData || [] })

}




const get_wishlist = async (req, res,next) => {
  
        const userId = req.user?.id
        const wishlist = await Wishlist.findOne({ user: userId }).populate("products")
        if (!wishlist) {
            return next(new customeError("user wishlist not found",404))
        }
        return res.status(200).json({ erroCode: 0, status: true, data: wishlist })

   
}


//users order cotrolers
//-------------------------------------------------------------------------------------------



const createOrder = async (req, res, next) => {
    try {
        console.log('User:', req.user);
        const userId = req.user.id;

        if (!userId) {
            return next(new customeError("User not authenticated", 401));
        }

        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        console.log('Cart:', cart);

        if (!cart) {
            return next(new customeError("Cart data not found", 404));
        }

        const totalPrice = cart.products.reduce((total, item) => {
            const price = parseFloat(item.product.price);
            const quantity = parseInt(item.quantity);
            return total + (price * quantity);
        }, 0);

        const line_items = cart.products.map((item) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.product.name, 
                    images: [item.product.image], 
                },
                unit_amount: Math.round(item.product.price * 100), 
            },
            quantity: item.quantity,
        }));

        console.log("line_items:", line_items);

        // Create a session Stripe 
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)

        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            ui_mode:"embedded",
            return_url: `${process.env.FRONT_END_URL}/CheckoutSuccess/{CHECKOUT_SESSION_ID}`,
          
        });

        // Create a new order
        const newOrder = new Order({
            userId,
            products: cart.products.map((item) => ({
                productId: item.product._id,
                quantity: item.quantity,
            })),
            sessionId: session.id, // Use the session ID created from Stripe
            amount: totalPrice,
            paymentStatus: "pending",
            // paymentIntentId is no longer needed since session handles payment
        });

        const savedOrder = await newOrder.save();
        console.log('Saved Order:', savedOrder);

        // Clear the user's cart after successful order creation
        await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

        return res.status(200).json({
            errorcode: 0,
            status: true,
            message: "Order created successfully",
            data: {
                session:session,
                order: savedOrder,
                clientSecret: session.client_secret, // Now you can send client_secret if needed
                lineData: line_items,
            },
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return next(new customeError(error.message || "An error occurred while creating the order", 500));
    }
};


// order validatiion



const verify_order = async (req, res, next) => {
    try {
        const { sessionId } = req.body;

        // Check if orderId is provided
        if (!sessionId) {
            return next(new customeError("Order ID is required", 400));
        }

        // Find the order by orderId
        const order = await Order.findOne({ sessionId });
        if (!order) {
            return next(new customeError("Order not found", 404));
        }

        // Check payment status
        if (order.paymentStatus === "completed") {
            return next(new customeError("Product already ordered", 400));
        }

        // Update payment and shipping status
        order.paymentStatus = "completed";
        order.shoppingStatus = "processing";
        const updatedOrder = await order.save();

        // Send response back to the frontend
        res.status(200).json({
            errorcode: 0,
            status: true,
            message: "Order verified successfully",
            data: updatedOrder
        });
    } catch (error) {
        next(new customeError(error.message || "An error occurred during order verification", 500));
    }
};

// get all orders

const getAll_orders = async (req, res,next) => {
   
        const userId = req.user.id;
        console.log(userId);
        const usersOrder = await Order.find({ userId: userId }).populate({
            path: 'products.productId',
            model: 'Product', 
        });
        if (!usersOrder || usersOrder.length === 0) {
            return next(new customeError("orders not found"))
        }
        res.status(200).json({ errorcode: 0, status: true, data: usersOrder })


    

}

//ordder cancelation

const order_cancelation = async (req, res,next) => {
    

        const {id} = req.params
       
        const orders = await Order.findOne({ _id: id })
        
        if (!orders) {
            return next(new customeError("orders not found",404))
        }
    
        
        orders.paymentStatus = "cancelled"
        orders.shoppingStatus = "cancelled"
        await orders.save()
        res.status(200).json({ errorCode: 0, status: true, data: orders })
    

}

//user logout

const userlog_out = async (req, res,next) => {
  
         res.clearCookie("token")
        res.status(200).json("successfully logout")
   
}



module.exports = {
    user_registarion,
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
    createOrder,
    verify_order,
    getAll_orders,
    order_cancelation,
    userlog_out
}