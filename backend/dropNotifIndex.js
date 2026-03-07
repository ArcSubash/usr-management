const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        try {
            // Drop old index
            await mongoose.connection.collection("notifications").dropIndex("createdAt_1");
            console.log("Old Notification TTL index dropped successfully.");
        } catch (e) {
            console.log("Could not drop index (it may not exist or the name differs):", e.message);
        }

        // Re-sync indexes from model definitions so the new 5-minute index is built
        const Notification = require("./models/Notification");
        await Notification.syncIndexes();
        console.log("New Notification TTL index for 5 minutes created successfully!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
