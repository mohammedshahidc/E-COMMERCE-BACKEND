

const jwt = require("jsonwebtoken");

const user_auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No Token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ message: 'Invalid Token' });
    }

};

module.exports = user_auth;
