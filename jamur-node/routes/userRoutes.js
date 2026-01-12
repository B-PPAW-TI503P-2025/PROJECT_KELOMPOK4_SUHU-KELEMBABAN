const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Pastikan fungsi ini ada di userController
router.get("/users", verifyToken, isAdmin, userController.getAllUsers);
router.put("/users/:id", verifyToken, isAdmin, userController.updateUser);
router.delete("/users/:id", verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
