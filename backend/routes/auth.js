const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const OTP = require("../models/OTP");
const sendEmail = require("../utils/sendEmail");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");

const router = express.Router();

// Reusable email validation chain
const emailValidation = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please enter a valid email address")
        .custom((email) => {
            const [localPart, domainPart] = email.split("@");
            if (localPart.length < 3) {
                throw new Error("Email username must be at least 3 characters");
            }
            const domainName = domainPart.split(".")[0];
            if (domainName.length < 2) {
                throw new Error("Email domain name is too short");
            }
            return true;
        })
        .normalizeEmail(),
];

// Middleware to check validation results
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array(),
        });
    }
    next();
}

// SEND OTP
router.post("/send-otp", emailValidation, handleValidationErrors, async (req, res) => {
    try {
        const { email } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: "Email already registered" });

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
router.post("/register", emailValidation, handleValidationErrors, async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        if (!name || !password || !otp) {
            return res.status(400).json({ message: "All fields including OTP are required" });
        }

        // Password validation: min 6 chars, alphanumeric
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (!/[a-zA-Z]/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one letter" });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one number" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: "Email already registered" });

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
            name: name.trim(),
            email,
            passwordHash,
            role: "user",
        });

        // Clean up OTP record post-success
        await OTP.findByIdAndDelete(otpRecord._id);

        // Create welcome notification
        await Notification.create({
            userId: user._id,
            type: "welcome",
            title: "Welcome to the platform! 🎉",
            message: `Hi ${user.name}, your account has been created successfully. Explore your settings and personalize your profile.`,
            icon: "🎉",
        });

        // Log activity
        await Activity.create({
            userId: user._id,
            action: "account_created",
            description: "Account was created via registration",
            ipAddress: req.ip,
        });

        return res.json({ message: "User created ✅", userId: user._id });
    } catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
});

// LOGIN
router.post("/login", emailValidation, handleValidationErrors, async (req, res) => {
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

        // Create login notification
        await Notification.create({
            userId: user._id,
            type: "login",
            title: "New Login Detected",
            message: `You logged in on ${new Date().toLocaleString()}`,
            icon: "🔐",
        });

        // Log activity
        await Activity.create({
            userId: user._id,
            action: "login",
            description: "Logged in successfully",
            ipAddress: req.ip,
        });

        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                deactivated: user.deactivated || false,
                createdAt: user.createdAt
            },
        });
    } catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
});

// GET CURRENT USER
const { auth } = require("../middleware/auth");
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                deactivated: user.deactivated || false,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;