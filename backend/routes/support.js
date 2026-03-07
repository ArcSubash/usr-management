const express = require("express");
const { auth, adminOnly } = require("../middleware/auth");
const SupportTicket = require("../models/SupportTicket");
const Notification = require("../models/Notification");
const User = require("../models/User");

const router = express.Router();

// User: Create a support ticket
router.post("/", auth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: "Message is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create the ticket
        const ticket = await SupportTicket.create({
            user: user._id,
            email: user.email,
            message: message.trim(),
        });

        // Notify admins asynchronously (optional but good practice)
        const admins = await User.find({ role: "admin" });
        const adminNotifications = admins.map((admin) => ({
            userId: admin._id,
            type: "system",
            title: "New Support Request",
            message: `${user.name} (${user.email}) needs help: "${message.substring(0, 30)}..."`,
            icon: "✉️",
        }));

        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }

        res.status(201).json({ message: "Help request sent successfully", ticket });
    } catch (err) {
        console.error("CREATE SUPPORT TICKET ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// User: Get their own support tickets
router.get("/my-tickets", auth, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error("GET MY TICKETS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Get all support tickets
router.get("/", auth, adminOnly, async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 }).populate("user", "name email");
        res.json(tickets);
    } catch (err) {
        console.error("GET SUPPORT TICKETS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Resolve a ticket
router.put("/:id/resolve", auth, adminOnly, async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        ticket.status = "resolved";
        await ticket.save();

        // Notify the user that their query was resolved
        await Notification.create({
            userId: ticket.user,
            type: "system",
            title: "Support Request Resolved",
            message: `Your recent help request regarding "${ticket.message.substring(0, 20)}..." has been marked as resolved by an admin.`,
            icon: "✅",
        });

        res.json({ message: "Ticket resolved successfully", ticket });
    } catch (err) {
        console.error("RESOLVE TICKET ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin: Delete a ticket
router.delete("/:id", auth, adminOnly, async (req, res) => {
    try {
        await SupportTicket.findByIdAndDelete(req.params.id);
        res.json({ message: "Ticket deleted successfully" });
    } catch (err) {
        console.error("DELETE TICKET ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
