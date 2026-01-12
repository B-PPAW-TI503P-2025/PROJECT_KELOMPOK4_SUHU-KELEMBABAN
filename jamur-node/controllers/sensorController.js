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

// 3. Simpan data (Input dari ESP32 atau Postman) + Logika Otomatis
exports.sendData = async (req, res) => {
  const { temperature, humidity } = req.body;

  // Validasi input
  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ message: "Data tidak lengkap!" });
  }

  try {
    // A. Simpan data sensor ke database
    await db.query(
      "INSERT INTO sensor_data (temperature, humidity) VALUES (?, ?)",
      [temperature, humidity]
    );

    // --- LOG TERMINAL BARU ---
    console.log(
      `[${new Date().toLocaleTimeString()}] 📥 Data Masuk: Temp: ${temperature}°C, Hum: ${humidity}% ✅ Tersimpan di Database`
    );

    // B. LOGIKA OTOMATISASI SIMULASI
    const [settings] = await db.query("SELECT * FROM settings WHERE id = 1");

    if (settings.length > 0) {
      const { min_humidity, mode, pump_status } = settings[0];

      if (mode === "otomatis") {
        let newPumpStatus = pump_status;

        if (humidity < min_humidity) {
          newPumpStatus = 1;
        } else {
          newPumpStatus = 0;
        }

        if (newPumpStatus !== pump_status) {
          await db.query("UPDATE settings SET pump_status = ? WHERE id = 1", [
            newPumpStatus,
          ]);

          const actionMsg =
            newPumpStatus === 1
              ? `Sistem Otomatis: Menyalakan Pompa (Lembap: ${humidity}%)`
              : `Sistem Otomatis: Mematikan Pompa (Lembap: ${humidity}%)`;

          await db.query("INSERT INTO logs (action) VALUES (?)", [actionMsg]);

          // --- LOG TERMINAL UNTUK AKSI POMPA ---
          console.log(`[SYSTEM] ⚙️  ${actionMsg}`);
        }
      }
    }

    res
      .status(201)
      .json({ message: "Data sensor tersimpan dan logika diproses" });
  } catch (err) {
    console.error("❌ Error sendData:", err.message);
    res.status(500).json({ error: err.message });
  }
};
