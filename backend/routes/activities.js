const express = require("express");
const Activity = require("../models/Activity");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get activity history for current user
router.get("/", auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const activities = await Activity.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Activity.countDocuments({ userId: req.user.id });

        res.json({
            activities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.log("FETCH ACTIVITIES ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
