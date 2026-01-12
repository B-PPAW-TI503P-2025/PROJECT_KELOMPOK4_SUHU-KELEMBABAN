const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Fungsi pembantu untuk mencatat riwayat ke tabel logs
const createLog = async (userId, action, duration = 0) => {
  try {
    await db.query(
      "INSERT INTO logs (user_id, action, duration) VALUES (?, ?, ?)",
      [userId, action, duration]
    );
  } catch (err) {
    console.error("Gagal mencatat log:", err.message);
  }
};

