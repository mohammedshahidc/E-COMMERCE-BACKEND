const mongoose = require('mongoose');

const product_Schema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, 
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
    },
    reviews: {
        type: String,
       
    },
});

const Product = mongoose.model('Product', product_Schema);

module.exports = Product;
