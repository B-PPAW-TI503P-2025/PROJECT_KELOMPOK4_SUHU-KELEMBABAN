const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // Tambahkan baris ini
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
