const express = require("express");

const {
    createStockTransfer,
    getStockTransfers,
    getStockTransferById,
    updateStockTransferStatus,
    deleteStockTransfer,
} = require("../controllers/stockTransferController");

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
// Stock Transfer Routes
// ===============================

// Create Stock Transfer
router.post("/", createStockTransfer);

// Get All Stock Transfers
router.get("/", getStockTransfers);

// Get Stock Transfer By ID
router.get("/:id", getStockTransferById);

// Update Transfer Status
router.put("/:id/status", updateStockTransferStatus);

// Delete Stock Transfer
router.delete("/:id", deleteStockTransfer);

module.exports = router;