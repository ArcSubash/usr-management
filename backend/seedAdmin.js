const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedAdmin() {
    const adminEmail = "admin@test.com";
    const adminPassword = "admin123";

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
        console.log("Admin already exists ✅");
        return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
    });

    console.log("Default admin created ✅ (admin@test.com / admin123)");
}

module.exports = seedAdmin;