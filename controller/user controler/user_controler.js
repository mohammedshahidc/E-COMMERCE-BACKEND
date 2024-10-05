const express = require("express")
const User = require("../../model/user_model")
const jwt = require("jsonwebtoken")
const { user_joiSchema } = require("../../model/validation");
const Products = require("../../model/product_model")
const Cart = require("../../model/cart_schema")

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
            const existing_prooduct = cart.products.find((p) => p.id.equals(productId))
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

module.exports = {
    user_registarion,
    get_users,
    user_login,
    getall_products,
    getproducts_bycatogory,
    getProduct_ById,
    add_toCart
}