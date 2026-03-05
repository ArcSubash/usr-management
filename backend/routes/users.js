const express = require("express");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

// test route (optional)
router.get("/test", (req, res) => res.send("users route ok ✅"));

router.get("/", auth, adminOnly, async (req, res) => {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json(users);
});

module.exports = router; // ✅ MUST BE HERE