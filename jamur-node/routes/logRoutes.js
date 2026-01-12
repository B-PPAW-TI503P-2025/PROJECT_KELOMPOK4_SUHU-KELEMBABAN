const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    // Join dengan tabel users untuk mengambil nama yang melakukan aksi
    const [rows] = await db.query(`
      SELECT logs.*, users.full_name 
      FROM logs 
      LEFT JOIN users ON logs.user_id = users.id 
      ORDER BY logs.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
