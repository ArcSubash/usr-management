const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        action: {
            type: String,
            enum: ["login", "profile_update", "password_change", "name_change", "logout", "account_created"],
            required: true,
        },
        description: { type: String, required: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        ipAddress: { type: String },
    },
    { timestamps: true }
);

// Auto-expire activity logs after 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Activity", activitySchema);
