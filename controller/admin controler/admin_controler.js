const express = require("express")
const User = require("../../model/user_model")
const Products = require("../../model/product_model")
const { product_joiSchema } = require("../../model/validation")
const Joi = require('@hapi/joi');
const Orders = require("../../model/order_schem");
const customeError = require("../../utils/customError");




//admin users controler
// -------------------------------------------
const get_allUsers = async (req, res, next) => {


    const users = await User.find({ block: false })
    if (!users) {
        return next(new customeError("user not found", 404))
    }
    res.status(201).json(users)

}





const delete_user = async (req, res, next) => {

    const userId = req.params.id
    const deleteUser = await User.findByIdAndDelete(userId)
    if (!deleteUser) {
        return next(new customeError("user not found", 404))
    }
    res.status(200).json({ errorCode: 0, status: true, data: deleteUser })

}


const getUser_byId = async (req, res, next) => {

    const userId = req.params.id
    const userbyId = await User.findById(userId)
    if (!userbyId) {
        return next(new customeError("user not founed", 404))
    }
    res.status(200).json({ errorCode: 0, data: userbyId })

}

const blockUser = async (req, res, next) => {

    const userId = req.params.id
    const user = await User.findByIdAndUpdate(userId)
    if (!user) {
        return next(new customeError("user not found", 404))
    }
    if (user.block === false) {
        user.block = true
        await user.save()
        res.status(200).json({ errorCode: 0, status: true, message: "succesfully blocked user", data: user })
    } else {
        user.block = false
        await user.save()
        res.status(200).json({ errorCode: 0, status: true, message: "succesfully unblocked user", data: user })
    }
}




//admin products controler
//----------------------------------------------------



const getAll_products = async (req, res, next) => {

    const allProducts = await Products.find()
    if (!allProducts) {
        return next(new customeError("product not found", 404))
    }
    res.status(200).json({ errorCode: 0, status: true, data: allProducts })

}



const getProducts_byId = async (req, res, next) => {

    const producById = await Products.findById(req.params.id)
    if (!producById) {
        return next(new customeError("product not found", 404))
    }
    res.status(200).json({ errorCode: 0, status: true, data: producById })

}




const addProduct = async (req, res, next) => {
    const { error, value } = product_joiSchema.validate(req.body);
    const image = req.file.path
    if (error) {
        return next(new customeError(error.message))
    }

    const { name, type, price, description, brand, rating, reviews } = value
    const newProduct = await new Products({ image, name, type, price, description, brand, rating, reviews })
    await newProduct.save()
    res.status(200).json({ errorCode: 0, message: "product added successfully", data: newProduct })

}





const editProduct = async (req, res, next) => {

    const { _id, __v, ...productData } = req.body;

    const { error, value } = product_joiSchema.validate(productData);
    console.log("Validation Result:", value);
         if (error) {
        return next(new customeError(error));
    }
        if (req?.file) {
        value.image = req.file.path;
    }
        const updatedProduct = await Products.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!updatedProduct) {
        return next(new customeError("Product not found"));
    }
     res.status(200).json({ errorCode: 0, message: "Product updated successfully", data: updatedProduct });
};






const deleteProduct = async (req, res, next) => {

    const deletedProduct = await Products.findByIdAndDelete(req.params.id)
    if (!deleteProduct) {
        return next(new customeError("product not found"))
    }
    res.status(200).json({ errorCode: 0, message: "product deleted successfully", data: deleteProduct })

}




//order controler
//-----------------------------------------------------------------------



const getAll_orders = async (req, res, next) => {
    try {
        const all_orders = await Orders.find().populate('products.productId', 'name price image');

        if (!all_orders) {
            return next(new customeError("No orders found", 404));
        }

        res.status(200).json({ errorCode: 0, data: all_orders });
    } catch (error) {
        return next(new customeError(error.message, 500)); // Handle any potential errors
    }
};



const getOrder_byuserId = async (req, res, next) => {

    const userId = req.params.id
    const order = await Orders.findOne({ userId: userId }).populate("products.productId", "name price")
    console.log(order);
    if (!order) {
        return next(new customeError("order not found", 404))
    }
    res.status(200).json({ errorCode: 0, data: order })

}


const cancel_orderByID = async (req, res, next) => {

    const order = await Orders.findById(req.params.id)
    if (!order) {
        return next(new customeError("order not found", 404))
    }
    if (order.paymentStatus === "completed") {
        return next(new customeError("cannot cancel this order, all ready paid", 404))

    }
    order.paymentStatus = "cancelled"
    order.shoppingStatus = "cancelled"
    await order.save()
    res.status(200).json({ errorCode: 0, data: order })


}



const totalRevanue = async (req, res) => {
    try {
        const total_revanue = await Orders.aggregate([
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: "$amount" }
                }
            }
        ])
        if (total_revanue.length > 0) {
            //   return  console.log("total revanue:",total_revanue[0].totalIncome);
            return res.status(200).json({ errorCode: 0, toalRevanue: total_revanue[0].totalIncome })
        }
        res.status(200).json(total_revanue[0].totalIncome)
    } catch (error) {
        res.status(400).json({ errorCode: 3, message: error.message })

    }
}

const totalProduct = async (req, res) => {

    const products = Products.find()
    if (!products) {
        return next(new customeError("products not found"))
    }
    res.status(200).json((await products).length)
}


module.exports = {
    get_allUsers,
    delete_user,
    getUser_byId,
    blockUser,
    getAll_products,
    getProducts_byId,
    addProduct,
    editProduct,
    deleteProduct,
    getAll_orders,
    getOrder_byuserId,
    cancel_orderByID,
    totalRevanue,
    totalProduct
}