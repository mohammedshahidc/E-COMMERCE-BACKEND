const tryCatch = (controller) => async (req, res, next) => {
    try {
        console.log('res');
        console.log('Inside tryCatch');
        await controller(req, res, next);
    } catch (error) {
        console.log('err');
        console.error("Error in controller:", error); 
        return next(error); 
    }
};

module.exports = tryCatch;
