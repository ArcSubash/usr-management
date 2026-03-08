const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const seedAdmin = require("./seedAdmin");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const notificationRoutes = require("./routes/notifications");
const activityRoutes = require("./routes/activities");
const supportRoutes = require("./routes/support");



const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API running ✅"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/support", supportRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected ✅");

        await seedAdmin(); // ✅ create admin if not exists

        app.listen(process.env.PORT || 5000, () =>
            console.log("Server running ✅")
        );
    })
    .catch((err) => console.log("DB error:", err));

