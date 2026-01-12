const db = require("../config/db");

// Fungsi pembantu untuk mencatat log aktivitas
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

// Ambil pengaturan saat ini
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM settings WHERE id = 1");
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pengaturan tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};