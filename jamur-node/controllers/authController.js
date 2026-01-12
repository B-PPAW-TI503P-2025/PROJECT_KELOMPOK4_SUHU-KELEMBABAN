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

// 1. Fungsi Registrasi (Sekaligus mencatat ke Logs)
exports.register = async (req, res) => {
  const { username, password, full_name, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Data tidak lengkap!" });
  }

  try {
    // Cek username duplikat
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username sudah digunakan!" });
    }

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    // Simpan User Baru
    const [result] = await db.query(
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, full_name, role]
    );

    // --- FITUR HISTORY LOG ---
    // Mencatat bahwa admin melakukan registrasi user baru
    // Catatan: req.user.id berasal dari middleware verifyToken (jika sudah dipasang)
    const adminId = req.user ? req.user.id : null;
    await createLog(adminId, `Mendaftarkan ${role} baru: ${username}`);

    res.status(201).json({ message: "User berhasil didaftarkan!" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Gagal mendaftarkan user" });
  }
};


