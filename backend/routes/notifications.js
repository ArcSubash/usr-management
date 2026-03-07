const express = require("express");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get all notifications for current user
router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            read: false,
        });

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.log("FETCH NOTIFICATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Mark a single notification as read
router.put("/:id/read", auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Marked as read", notification });
    } catch (err) {
        console.log("MARK READ ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Mark all notifications as read
router.put("/read-all", auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { read: true }
        );

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.log("MARK ALL READ ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete a single notification
router.delete("/:id", auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification deleted" });
    } catch (err) {
        console.log("DELETE NOTIFICATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Clear all notifications
router.delete("/", auth, async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });
        res.json({ message: "All notifications cleared" });
    } catch (err) {
        console.log("CLEAR NOTIFICATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
