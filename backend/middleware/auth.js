const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "No token" });

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Bad token format" });

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