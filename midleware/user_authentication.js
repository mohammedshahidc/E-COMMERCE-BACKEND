
const jwt = require("jsonwebtoken");
const customeError = require("../utils/customError");

const user_auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Authorization Header:', authHeader);
    if (!token) {
        const refreshmentToken=req.cookies?.refreshmentToken
        if(!refreshmentToken){
            return res.status(403).json({ message: 'No Token or refreshment token' });
        }
       
       try {
        const decodded=jwt.verify(refreshmentToken,process.env.JWT_KEY)
       const newToken=jwt.sign( { id: decodded.id, username: decodded.username, email: decodded.email },process.env.JWT_KEY,{ expiresIn: "30m" })
       

       res.cookie('token', newToken, {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 60 * 1000,
        sameSite: 'none'
    });
       req.user=decodded
            return next()

       } catch (error) {
        res.status(400).json({message:error.message})
       }
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded;
        next();
        // console.log("jwt decodded:", decoded);
    } catch (error) {
        return next(new customeError("invalid token"))
    }

};


const admin_auth = async (req, res, next) => {
    console.log('Admin Auth Middleware');
    try {
        user_auth(req, res, () => {

            if (req.user && req.user.id === 'admin') {
                next()
            } else {
                return res.status(401).json({ message: "you are not authorised" })
            }
        })
    } catch (error) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
}

module.exports = { user_auth, admin_auth };
