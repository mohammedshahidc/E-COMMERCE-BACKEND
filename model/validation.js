const Joi = require('joi');

const user_joiSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string()
        .email(),

    password: Joi.string()
        .min(4)
        .required(),
    cpassword: Joi.string()
        .min(4),
    admin: Joi.boolean().optional(), 
    block: Joi.boolean().optional() 

});


const product_joiSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().required(),
    brand: Joi.string().required(),
    rating: Joi.number().min(0).max(5),
    reviews: Joi.string()
});




module.exports = {
    user_joiSchema,
    product_joiSchema
};
