const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

// Import Middleware untuk proteksi
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * Endpoint: GET /api/settings
 * Akses: Admin & Petani
 */
router.get("/", verifyToken, settingsController.getSettings);

/**
 * Endpoint: PUT /api/settings
 * Akses: HANYA Admin
 * Perbaikan: Menggunakan array middleware yang bersih
 */
router.put("/", verifyToken, settingsController.updateSettings);

module.exports = router;
