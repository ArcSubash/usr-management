const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API running ✅"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected ✅");
        app.listen(process.env.PORT || 5000, () =>
            console.log("Server running ✅")
        );
    })
    .catch((err) => console.log("DB error:", err));