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

// --- 4. Fallback Manual ---
app.use((req, res, next) => {
  if (!req.url.startsWith("/api")) {
    return res.sendFile(path.join(__dirname, "frontend", "index.html"));
  }
  res.status(404).json({ message: "API tidak ditemukan" });
});

// --- 5. Jalankan Server ---
const PORT = process.env.PORT || 3001;
const url = `http://localhost:${PORT}`; // Simpan URL dalam variabel

app.listen(PORT, async () => {
  console.log(`================================================`);
  console.log(`🚀 Server Berhasil Jalan!`);
  // Menampilkan URL agar bisa diklik (Ctrl + Klik di terminal)
  console.log(`🔗 Klik di sini: ${url}`);

  try {
    await db.query("SELECT 1");
    console.log(`✅ Database Terhubung`);

    // FUNGSI OTOMATIS BUKA BROWSER
    const start =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? "start"
        : "xdg-open";
    exec(`${start} ${url}`);
  } catch (err) {
    console.error(`❌ Gagal DB:`, err.message);
  }
  console.log(`================================================`);
});