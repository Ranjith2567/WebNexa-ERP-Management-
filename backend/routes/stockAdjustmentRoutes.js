const express = require("express");

const {
    createStockAdjustment,
    getStockAdjustments,
    getStockAdjustmentById,
    deleteStockAdjustment,
} = require("../controllers/stockAdjustmentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// Authentication
// ===============================
router.use(protect);

// ===============================
// Authorization
// ===============================
router.use(authorizeRoles("SUPER_ADMIN"));

// ===============================
// Stock Adjustment Routes
// ===============================

// Create Stock Adjustment
router.post("/", createStockAdjustment);

// Get All Stock Adjustments
router.get("/", getStockAdjustments);

// Get Stock Adjustment By ID
router.get("/:id", getStockAdjustmentById);

// Delete Stock Adjustment
router.delete("/:id", deleteStockAdjustment);

module.exports = router;