const express = require("express");

const {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    approvePurchaseOrder,
} = require("../controllers/purchaseOrderController");

const { protect } = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ============================================================
// Authentication & Authorization
// ============================================================

router.use(protect);

router.use(authorizeRoles("SUPER_ADMIN"));

// ============================================================
// Purchase Order Routes
// ============================================================

// Create Purchase Order
router.post("/", createPurchaseOrder);

// Get All Purchase Orders
router.get("/", getPurchaseOrders);

// Get Purchase Order By ID
router.get("/:id", getPurchaseOrderById);

// Update Purchase Order
router.put("/:id", updatePurchaseOrder);

// Approve Purchase Order
router.patch(
    "/:id/approve",
    approvePurchaseOrder
);

// Delete Purchase Order
router.delete("/:id", deletePurchaseOrder);

module.exports = router;