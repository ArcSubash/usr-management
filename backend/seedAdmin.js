const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
        console.log("Default admin already exists ✅");
        return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
    });

    console.log(`Default admin created ✅ (${adminEmail} / ${adminPassword})`);
}

module.exports = seedAdmin;