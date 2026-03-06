const express = require("express");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");

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

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
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

// User: update own profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, currentPassword, password } = req.body;

    // Find user by id (from auth middleware)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

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

    res.json({
      message: "Profile updated successfully ✅",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;