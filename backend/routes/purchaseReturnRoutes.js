const express = require("express");

const {
    createPurchaseReturn,
    getPurchaseReturns,
    getPurchaseReturnById,
    approvePurchaseReturn,
    rejectPurchaseReturn,
    deletePurchaseReturn,
} = require("../controllers/purchaseReturnController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================
// Authentication & Authorization
// ======================================

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

// ======================================
// Purchase Return Routes
// ======================================

// Create purchase return
router.post(
    "/",
    createPurchaseReturn
);

// Get all purchase returns
router.get(
    "/",
    getPurchaseReturns
);

// Get purchase return by ID
router.get(
    "/:id",
    getPurchaseReturnById
);

// Approve purchase return
router.patch(
    "/:id/approve",
    approvePurchaseReturn
);

// Reject purchase return
router.patch(
    "/:id/reject",
    rejectPurchaseReturn
);

// Delete draft/rejected return
router.delete(
    "/:id",
    deletePurchaseReturn
);

module.exports = router;