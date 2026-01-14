const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root", // <--- Pastikan ini DB_USER
  password: process.env.DB_PASSWORD || "", // <--- Pastikan ini DB_PASSWORD
  database: process.env.DB_NAME || "db_kumbung_jamur",
  port: process.env.DB_PORT || 3309, // <--- Pastikan port 3306
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Tes koneksi saat pertama kali dijalankan
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Koneksi database gagal (Port 3309):", err.message);
  } else {
    console.log("Koneksi database MySQL di port 3309 BERHASIL!");
    connection.release();
  }
});

module.exports = pool.promise();
