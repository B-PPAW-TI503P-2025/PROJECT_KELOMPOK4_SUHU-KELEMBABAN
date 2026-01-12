const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController");

// Rute untuk dashboard (ambil 1 data terbaru)
router.get("/latest", sensorController.getLatestData); // <--- Tambahkan ini

// Rute lainnya
router.get("/", sensorController.getAllData);
router.post("/", sensorController.sendData);

// Tambahkan '/all' agar sesuai dengan fetch di frontend
router.get("/all", sensorController.getAllData);

module.exports = router;
