const db = require("../config/db");

// 1. Ambil HANYA 1 data terbaru (Untuk Dashboard Real-time)
exports.getLatestData = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT temperature, humidity, created_at FROM sensor_data ORDER BY created_at DESC LIMIT 1"
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "Data sensor masih kosong" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ganti fungsi getAllData Anda dengan ini
exports.getAllData = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 20"
    );
    res.json(rows); // Mengirimkan Array secara transparan
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
