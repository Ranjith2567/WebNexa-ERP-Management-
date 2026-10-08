const express = require("express");

const {
    createGoodsReceipt,
    getGoodsReceipts,
    getGoodsReceiptById,
} = require("../controllers/goodsReceiptController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// Authentication
// ==========================================

router.use(protect);

// ==========================================
// Authorization
// ==========================================

router.use(authorizeRoles("SUPER_ADMIN"));

// ==========================================
// Goods Receipt Routes
// ==========================================

// Create GRN
router.post("/", createGoodsReceipt);

// Get all GRNs
router.get("/", getGoodsReceipts);

// Get GRN by ID
router.get("/:id", getGoodsReceiptById);

module.exports = router;