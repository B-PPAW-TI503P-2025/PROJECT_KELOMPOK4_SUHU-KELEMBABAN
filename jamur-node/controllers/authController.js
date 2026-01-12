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

// 2. Fungsi Login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username dan password wajib diisi!" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = rows[0];
    const inputPass = String(password).trim();
    const dbHash = String(user.password).trim();

    const isMatch = await bcrypt.compare(inputPass, dbHash);

    console.log(`[AUTH] Login attempt: ${username} | Result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ message: "Password salah!" });
    }

    // Buat JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "KUNCI_RAHASIA_YANG_SAMA",
      { expiresIn: "24h" }
    );

    // --- FITUR HISTORY LOG ---
    // Mencatat aktivitas login sukses
    await createLog(user.id, `User login ke sistem`);

    res.json({
      message: "Login Berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

