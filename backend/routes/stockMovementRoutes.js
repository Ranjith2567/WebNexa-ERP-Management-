const express = require("express");

const {
    createStockMovement,
    getStockMovements,
    getStockMovementById,
    getProductStockLedger,
    deleteStockMovement,
} = require("../controllers/stockMovementController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// Authentication & Authorization
// ==========================================

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

// ==========================================
// Stock Movement Routes
// ==========================================

// Create stock movement
router.post(
    "/",
    createStockMovement
);

// Get all stock movements
router.get(
    "/",
    getStockMovements
);

// Get product stock ledger
// Keep this BEFORE /:id
router.get(
    "/product/:productId",
    getProductStockLedger
);

// Get stock movement by ID
router.get(
    "/:id",
    getStockMovementById
);

// Delete stock movement
// Deletion is blocked inside controller
router.delete(
    "/:id",
    deleteStockMovement
);

module.exports = router;