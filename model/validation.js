const Joi = require('joi');

const user_joiSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string()
        .email()
        .required(),
    password: Joi.string()
        .min(4)
        .required(),
    cpassword: Joi.string()
        .min(4),

});

module.exports = user_joiSchema;
