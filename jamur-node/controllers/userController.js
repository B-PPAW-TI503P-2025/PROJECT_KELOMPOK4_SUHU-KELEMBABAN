const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Ambil semua pengguna
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, username, role FROM users"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update pengguna & password
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, username, password } = req.body;

  try {
    // Cek duplikasi username
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET full_name = ?, username = ?, password = ? WHERE id = ?",
        [full_name, username, hashedPassword, id]
      );
    } else {
      await db.query(
        "UPDATE users SET full_name = ?, username = ? WHERE id = ?",
        [full_name, username, id]
      );
    }
    res.json({ message: "Data berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hapus pengguna
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user && req.user.id == id) {
      return res
        .status(400)
        .json({ message: "Tidak bisa menghapus akun sendiri" });
    }
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};