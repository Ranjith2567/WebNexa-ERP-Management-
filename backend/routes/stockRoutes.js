const express = require("express");

const {
    createStock,
    getStocks,
    getStockById,
    updateStock,
    deleteStock,
} = require("../controllers/stockController");

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
// Stock Routes
// ===============================

// Create Stock
router.post("/", createStock);

// Get All Stocks
router.get("/", getStocks);

// Get Stock By ID
router.get("/:id", getStockById);

// Update Stock
router.put("/:id", updateStock);

// Delete Stock
router.delete("/:id", deleteStock);

module.exports = router;