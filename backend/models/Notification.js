const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: {
            type: String,
            enum: ["welcome", "profile_update", "password_change", "login", "role_change", "account_created", "system"],
            default: "system",
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        icon: { type: String, default: "🔔" },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Auto-expire notifications after 5 minutes
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
