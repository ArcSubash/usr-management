const express = require("express");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");

const router = express.Router();

router.get("/", auth, adminOnly, async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

const bcrypt = require("bcryptjs");

// Admin: create a new user
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Name validation
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    if (trimmedName.length > 50) {
      return res.status(400).json({ message: "Name must be under 50 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Password validation: min 6 chars, alphanumeric (at least one letter + one number)
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one letter" });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one number" });
    }

    // Role validation
    const validRoles = ["admin", "user"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Role must be 'admin' or 'user'" });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: trimmedName,
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role || "user",
    });

    res.json({ message: "User created ✅", userId: user._id });
  } catch (err) {
    console.log("CREATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted ✅" });
  } catch (err) {
    console.log("DELETE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// User: update own profile (MUST be before /:id to avoid matching "profile" as an id)
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, currentPassword, password } = req.body;

    // Find user by id (from auth middleware)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.deactivated) {
      return res.status(403).json({ message: "Your account is deactivated. You cannot modify your profile." });
    }

    const oldName = user.name;

    // Update fields if provided
    if (name) user.name = name;

    // If attempting to update password, check current password first
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }

      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return res.status(400).json({ message: "Invalid current password" });
      }

      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Track what was updated
    if (name && name !== oldName) {
      await Notification.create({
        userId: req.user.id,
        type: "profile_update",
        title: "Profile Updated",
        message: "Your display name was updated successfully.",
        icon: "✏️",
      });
      await Activity.create({
        userId: req.user.id,
        action: "name_change",
        description: `Display name updated to "${name}"`,
        ipAddress: req.ip,
      });
    }

    if (password) {
      await Notification.create({
        userId: req.user.id,
        type: "password_change",
        title: "Password Changed 🔒",
        message: "Your password was changed successfully. If this wasn't you, contact support immediately.",
        icon: "🔒",
      });
      await Activity.create({
        userId: req.user.id,
        action: "password_change",
        description: "Password was changed",
        ipAddress: req.ip,
      });
    }

    res.json({
      message: "Profile updated successfully ✅",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: update a user
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { name, password, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent admin from changing their own role
    if (role && req.user.id === req.params.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    if (name) user.name = name;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role && ["admin", "user"].includes(role)) {
      user.role = role;
    }

    if (req.body.deactivated !== undefined) {
      const previouslyDeactivated = user.deactivated;
      user.deactivated = req.body.deactivated;

      if (!previouslyDeactivated && user.deactivated) {
        // Send a notification when they are deactivated
        await Notification.create({
          userId: user._id,
          title: "Account Deactivated 🚫",
          message: "Your account has been deactivated by an administrator. You can no longer modify your profile settings. Contact support for more information.",
          type: "system",
          icon: "🚫",
        });
      } else if (previouslyDeactivated && !user.deactivated) {
        // Send a notification when they are reactivated
        await Notification.create({
          userId: user._id,
          title: "Account Reactivated ✅",
          message: "Great news! Your account has been reactivated by an administrator. You can now access all features and modify your profile again.",
          type: "system",
          icon: "✅",
        });
      }
    }

    await user.save();

    // Do not send passwordHash back
    res.json({
      message: "User updated ✅",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.log("UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;