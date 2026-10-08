const express = require("express");

const {
    createPurchasePayment,
    getPurchasePayments,
    getPurchasePaymentById,
    deletePurchasePayment,
} = require("../controllers/purchasePaymentController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

// Create payment
router.post(
    "/",
    createPurchasePayment
);

// Get all payments
router.get(
    "/",
    getPurchasePayments
);

// Get payment by ID
router.get(
    "/:id",
    getPurchasePaymentById
);

// Delete payment
router.delete(
    "/:id",
    deletePurchasePayment
);

module.exports = router;