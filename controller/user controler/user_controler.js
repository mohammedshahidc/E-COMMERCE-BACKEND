const express = require("express")
const User = require("../../model/user_model")
const jwt = require("jsonwebtoken")
const { user_joiSchema } = require("../../model/validation");
const Products = require("../../model/product_model")
const Cart = require("../../model/cart_schema")
const Wishlist = require("../../model/wishlist_model")
const stripe = require("stripe")
const Order = require("../../model/order_schem")
const mongoose=require("mongoose")
const bcrypt=require("bcrypt")

const user_registarion = async (req, res) => {
    const { value, error } = user_joiSchema.validate(req.body);

    const { username, email, password, cpassword } = value
    if (error) {
        throw error
    }
    if(password !==cpassword){
        return res.status(400).json("invalid password")
    }
    try {
        const hashPassword=await bcrypt.hash(password,6)
        const new_user = new User({ username, email, password:hashPassword, cpassword:hashPassword })
        await new_user.save()
        res.status(201).json({ errorcode: 0, status: true, msg: "user created successfully", data: new_user })
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
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

            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.status(200).json({ token, isAdmin: true });
        }

        
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ errorcode: 1, status: true, msg: "User not found", data: null });
        }

        const matching = await bcrypt.compare(password, user.password);
        if (!matching) {
            return res.status(400).json({ errorcode: 2, status: false, msg: "Password is incorrect", data: null });
        }

       
        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email
        }, process.env.JWT_KEY, { expiresIn: "1d" });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        console.log("User logged in");
        return res.status(200).json({ errorcode: 0, status: true, msg: "Login successful", data: token });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


//user product controlers
//-------------------------------------------------------------------------------------
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
const get_cartItems = async (req, res) => {

    try {
        const userId = req.user.id
        const userCart = await Cart.findOne({ user: userId }).populate("products.product")

        if (!userCart) {
            res.status(401).json("cart items not found")
        }
        res.status(200).json(userCart)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }


}

//update cart
const updateCart = async (req, res) => {
    try {
        const userId = req.user.id
        const { productId, action } = req.body
        const cartData = await Cart.findOne({ user: userId })
        console.log(cartData.products

        );
        if (!cartData) {
            return res.status(401).json("cart data not found")
        }
        const productData = cartData.products.find(prod => prod._id == productId)
        console.log(productData);
        if (!productData) {
            return res.status(401).json("product not found in user cart")
        }
        if (action === "increment") {
            productData.quantity += 1
        } else if (action === "decrement") {
            if (productData.quantity > 1) {
                productData.quantity -= 1
            }
        } else {
            res.status(404).json("Invalid action for updating quantity")
        }
        await cartData.save()
        const updatedCart = await Cart.findOne({ user: userId }).populate("products.product")
        res.status(200).json({ products: updatedCart.products || [] })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}



const removeFrom_cart = async (req, res) => {

    try {
        const userId = req.user.id
        const { productId } = req.params

        const datas = await Cart.findOne({ user: userId }).populate("products.product")
        if (!datas) {
            return res.status(401).json("cart not found");

        }
        const productIndex = datas.products.findIndex(pro => pro.productid === productId)
        datas.products.splice(productIndex, 1)
        await datas.save()
        res.status(200).json({ message: "Product removed from cart", products: datas.products || [] });


    } catch (error) {
        res.status(400).json({ error: error.message });

    }
}




const clearCart = async (req, res) => {
    try {
        const userId = req.user.id
        const cart = await Cart.findOne({ user: userId })
        if (!cart) {
            return res.status(404).json({ message: "cart not found" })
        }
        cart.products = []
        await cart.save()
        res.status(200).json({ message: "cart clear successfully" })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


//users wishlist controlers
//-------------------------------------------------------------------------------


const addto_wishlist = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(200).json({ error: error.message })
    }
}



const remove_itemFromwishlist = async (req, res) => {
    try {
        const userId = req.user.id
        const { productId } = req.body
        const wishlistData = await Wishlist.findOne({ user: userId }).populate("products")
        if (!wishlistData) {
            return res.status(404).josn("wishlist items not found")
        }
        const productIndex = wishlistData.products.find(prod => prod._id === productId)
        wishlistData.products.splice(productIndex, 1)
        await wishlistData.save()
        return res.status(200).json({ errorCode: 0, message: "item removed from wishlist", data: wishlistData || [] })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}




const get_wishlist = async (req, res) => {
    try {
        const userId = req.user.id
        const wishlist = await Wishlist.findOne({ user: userId }).populate("products")
        if (!wishlist) {
            return res.status(401).json("user wishlist not found")
        }
        return res.status(200).json({ erroCode: 0, status: true, data: wishlist })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}



const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);

        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        console.log("iiii", cart.products.map(i => i));

        if (!cart) {
            return res.status(400).json({ message: "Cart not found" });
        }


        console.log('Populated Cart:', JSON.stringify(cart, null, 2));

        const totalPrice = Math.round(
            cart.products.reduce((total, item) => {
                console.log(item);

                if (!item.product) {
                    console.log('Product is undefined for item:', item);
                    throw new Error('Product data not available for one or more items in the cart');
                }


                const price = parseFloat(item.product.price);
                const quantity = parseInt(item.quantity);

                console.log('Product ID:', item.product._id);
                console.log('Price:', price);
                console.log('Quantity:', quantity);

                if (isNaN(price) || isNaN(quantity)) {
                    throw new Error('Invalid product price or quantity');
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
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

//users order cotrolers
//-------------------------------------------------------------------------------------------
// order validatiion

const verify_order = async (req, res) => {
    try {
        const { sessionId } = req.body
        const order = await Order.findOne({ sessionId: sessionId })
        if (!order) {
            res.status(401).json({ message: "order not found" })
        }
        if (order.paymentStatus === "completed") {
            return res.status(400).json({ message: "product already ordered" })
        }
        order.paymentStatus = "completed"
        order.shoppingStatus = "proccessing"
        const updatedOrder = await order.save()
        res.status(200).json({ errorcode: 0, status: true, message: "order verified successfully", data: updatedOrder })
    } catch (error) {
        console.log(error);
        res.status(400).josn({ error: error.message })
    }
}

// get all orders

const getAll_orders = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        const usersOrder = await Order.find({ userId: userId }).populate("products.productId")
        if (!usersOrder || usersOrder.length === 0) {
          return  res.status(404).json({ errorCode: 1, message: "orders not found" })

        }
        res.status(200).json({ errorcode: 0, status: true, data: usersOrder })


    } catch (error) {
        console.log(error);
        res.status(400).json({ erroCode: 2, status: true, message: error })
    }

}

//ordder cancelation

const order_cancelation=async(req,res)=>{
try {
    
        const Id=req.params.id
        const orders=await Order.findOne({orderId:Id})
        if(!orders){
          return  res.status(404).json({errorCode:1,message:"orders not found"})
        }
        if(orders.paymentStatus==="completed"){
           return res.status(401).json({errorCode:2,message:"can not cancel this order,already paid"})
        }
            orders.paymentStatus="cancelled"
            orders.shoppingStatus="cancelled"
           await orders.save()
           res.status(200).json({errorCode:0,status:true,data:orders})
} catch (error) {
    console.log(error);
    res.status(400).json({error:error.message})
}

}

//user logout

const userlog_out=async(req,res)=>{
   try {
    
    res.clearCookie("token")
    res.status(200).json("successfully logout")
   } catch (error) {
    res.status(400).json(error)
   }
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