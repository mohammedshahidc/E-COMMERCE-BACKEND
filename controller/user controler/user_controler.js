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

const user_registarion = async (req, res, next) => {
    const { value, error } = user_joiSchema.validate(req.body);

    const { username, email, password, cpassword } = value
    if (error) {
        throw error
    }
    if (password !== cpassword) {
        return next(new customeError("invalid password", 404))
    }

    const hashPassword = await bcrypt.hash(password, 6)
    const new_user = new User({ username, email, password: hashPassword, cpassword: hashPassword })
    await new_user.save()
    res.status(201).json({ errorcode: 0, status: true, msg: "user created successfully", data: new_user })

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
                { expiresIn: "30m" }
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
                maxAge: 30 * 60 * 1000
            });
            res.cookie("refreshmentToken", refreshmentToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            return res.status(200).json({ token, isAdmin: true });
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
        }, process.env.JWT_KEY, { expiresIn: "30m" });

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
             maxAge: 30 * 60 * 1000,
            sameSite: 'strict'
        });
        res.cookie('refreshmentToken', refreshmentToken, {
            httpOnly: true,
            secure: true,
            maxAge:7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        })


        console.log("User logged in");
        return res.status(200).json({ errorcode: 0, status: true, msg: "Login successful", data: {token:token,refreshmentToken:refreshmentToken }});

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
                return p.product == productId
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
  
        const userId = req.user.id
        const wishlist = await Wishlist.findOne({ user: userId }).populate("products")
        if (!wishlist) {
            return next(new customeError("user wishlist not found",404))
        }
        return res.status(200).json({ erroCode: 0, status: true, data: wishlist })

   
}


//users order cotrolers
//-------------------------------------------------------------------------------------------



const createOrder = async (req, res,next) => {
   
        const userId = req.user.id;
        console.log(userId);

        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        console.log("iiii", cart.products.map(i => i));

        if (!cart) {
            return next(new customeError("cart data not found",404))
        }


        console.log('Populated Cart:', JSON.stringify(cart, null, 2));

        const totalPrice = Math.round(
            cart.products.reduce((total, item) => {
                console.log(item);

                if (!item.product) {
                    console.log('Product is undefined for item:', item);
                    throw next (new customeError('Product data not available for one or more items in the cart',404));
                }


                const price = parseFloat(item.product.price);
                const quantity = parseInt(item.quantity);

                console.log('Product ID:', item.product._id);
                console.log('Price:', price);
                console.log('Quantity:', quantity);

                if (isNaN(price) || isNaN(quantity)) {
                    throw next(new customeError('Invalid product price or quantity',404));
                }

                return total + price * quantity;
            }, 0)
        );

        console.log('Total Price:', totalPrice);

        const orderId = new mongoose.Types.ObjectId()
        const newOrder = new Order({
            userId,
            products: cart.products.map((item) => ({
                productId: item.product._id,
                quantity: item.quantity
            })),
            orderId,
            amount: totalPrice,
            paymentStatus: "pending"
        });

        const savedOrder = await newOrder.save();


        await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

        return res.status(200).json({
            errorcode: 0,
            status: true,
            message: "Order created successfully",
            data: savedOrder
        });
    
};


// order validatiion

const verify_order = async (req, res,next) => {
   
        const { orderId } = req.body
        const order = await Order.findOne({ orderId: orderId })
        if (!order) {
            return next(new customeError("order not found",404))
        }
        if (order.paymentStatus === "completed") {
            return next(new customeError("product already ordered",404))
        }
        order.paymentStatus = "completed"
        order.shoppingStatus = "proccessing"
        const updatedOrder = await order.save()
        res.status(200).json({ errorcode: 0, status: true, message: "order verified successfully", data: updatedOrder })
   
}

// get all orders

const getAll_orders = async (req, res,next) => {
   
        const userId = req.user.id;
        console.log(userId);
        const usersOrder = await Order.find({ userId: userId }).populate("products.productId")
        if (!usersOrder || usersOrder.length === 0) {
            return next(new customeError("orders not found"))
        }
        res.status(200).json({ errorcode: 0, status: true, data: usersOrder })


    

}

//ordder cancelation

const order_cancelation = async (req, res,next) => {
    

        const Id = req.params.id
        const orders = await Order.findOne({ orderId: Id })
        if (!orders) {
            return next(new customeError("orders not found",404))
        }
        if (orders.paymentStatus === "completed") {
            return next(new customeError("can not cancel this order,already paid",404))
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