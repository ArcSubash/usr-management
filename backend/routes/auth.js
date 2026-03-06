const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// SEND OTP
router.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ message: "Email is required" });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already exists" });

        // Generate 6 digit random number
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create or update existing OTP token record for user
        await OTP.findOneAndDelete({ email });
        await OTP.create({ email, otp: otpCode });

        // Try sending
        const sent = await sendEmail(email, otpCode);
        if (!sent) {
            return res.status(500).json({ message: "Could not send OTP Email, check server logs." });
        }

        return res.json({ message: "Verification OTP has been sent ✅" });
    } catch (err) {
        console.log("OTP ERROR:", err);
        return res.status(500).json({ message: "Server error generating OTP" });
    }
});

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        if (!name || !email || !password || !otp) {
            return res.status(400).json({ message: "All fields including OTP are required" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already exists" });

        // Verify OTP
        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: "OTP has expired or not found. Please request a new one." });
        }
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP provided" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: "user",
        });

        // Clean up OTP record post-success
        await OTP.findByIdAndDelete(otpRecord._id);

        return res.json({ message: "User created ✅", userId: user._id });
    } catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
        });
    } catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;