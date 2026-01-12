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

// Update pengaturan
exports.updateSettings = async (req, res) => {
  // 1. Ambil data dari body request (max_temp sudah dihapus)
  const { min_humidity, mode, pump_status } = req.body;

  // Ambil ID user dari token
  const userId = req.user ? req.user.id : null;

  try {
    // 2. Ambil data lama untuk perbandingan
    const [oldRows] = await db.query("SELECT * FROM settings WHERE id = 1");
    if (oldRows.length === 0) {
      return res.status(404).json({ error: "Settings tidak ditemukan" });
    }
    const oldData = oldRows[0];

    // 3. Tentukan nilai akhir (gunakan nilai lama jika input kosong)
    const finalHumidity =
      min_humidity !== undefined
        ? parseFloat(min_humidity)
        : oldData.min_humidity;
    const finalMode = mode || oldData.mode;
    const finalPumpStatus =
      pump_status !== undefined ? pump_status : oldData.pump_status;

    // 4. Jalankan Update ke Database (Query tanpa kolom max_temp)
    await db.query(
      "UPDATE settings SET min_humidity = ?, mode = ?, pump_status = ? WHERE id = 1",
      [finalHumidity, finalMode, finalPumpStatus]
    );

    // 5. Logika Pencatatan Log
    if (pump_status !== undefined && pump_status !== oldData.pump_status) {
      const aksi =
        pump_status === 1
          ? "Menyalakan Pompa (Manual via Dashboard)"
          : "Mematikan Pompa (Manual via Dashboard)";
      await createLog(userId, aksi);
    } else if (min_humidity !== undefined || mode !== undefined) {
      await createLog(
        userId,
        `Mengubah Konfigurasi: Mode ${finalMode}, Hum ${finalHumidity}%`
      );
    }

    res.json({
      message: "Konfigurasi berhasil diperbarui",
      data: {
        min_humidity: finalHumidity,
        mode: finalMode,
        pump_status: finalPumpStatus,
      },
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Gagal memperbarui data di database" });
  }
};
