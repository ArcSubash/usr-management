const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (v) => {
                    if (!validator.isEmail(v)) return false;
                    const [localPart, domainPart] = v.split("@");
                    if (localPart.length < 3) return false;
                    const domainName = domainPart.split(".")[0];
                    if (domainName.length < 2) return false;
                    return true;
                },
                message: "Please enter a valid email address (username ≥3 chars, domain ≥2 chars)",
            },
        },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["admin", "user"], default: "user" },
        deactivated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);