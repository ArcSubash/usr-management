const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    let token;
    if (req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
}

// ✅ THIS LINE MUST BE EXACTLY LIKE THIS:
module.exports = { auth, adminOnly };