const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        email: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ["open", "resolved"], default: "open" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
