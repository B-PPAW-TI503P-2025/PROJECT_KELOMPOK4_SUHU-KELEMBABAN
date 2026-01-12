const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process"); // TAMBAHKAN INI untuk buka browser
require("dotenv").config();

const db = require("./config/db");
const app = express();

// --- 1. Middleware ---
app.use(cors());
app.use(express.json());

// --- 2. Sajikan File Statis ---
app.use(express.static(path.join(__dirname, "frontend")));

// --- 3. Import & Gunakan Routes API ---
const sensorRoutes = require("./routes/sensorRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/sensor", sensorRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", userRoutes);