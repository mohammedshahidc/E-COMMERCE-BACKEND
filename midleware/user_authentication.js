

const jwt = require("jsonwebtoken");
const customeError = require("../utils/customError");

const user_auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Authorization Header:', authHeader);

    if (!token) {
        const refreshmentToken = req.cookies?.refreshmentToken;
        
        // Check if refreshment token exists
        if (!refreshmentToken) {
            return res.status(403).json({ message: 'No access or refreshment token' });
        }

        try {
            
            const decoded = jwt.verify(refreshmentToken, process.env.JWT_KEY);
            
           
            const newToken = jwt.sign(
                { id: decoded.id, username: decoded.username, email: decoded.email },
                process.env.JWT_KEY,
                { expiresIn: "1d" }
            );

           
            res.cookie('token', newToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000, 
                sameSite: 'none'
            });

            
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(400).json({ message: 'Refreshment token invalid or expired' });
        }
    }

    try {
       
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid access token' });
    }
};

const admin_auth = (req, res, next) => {
    console.log('Admin Auth Middleware');
    
    user_auth(req, res, () => {
        if (req.user && req.user.id === 'admin') {
            return next();
        } else {
            return res.status(401).json({ message: "You are not authorized" });
        }
    });
};

module.exports = { user_auth, admin_auth };

