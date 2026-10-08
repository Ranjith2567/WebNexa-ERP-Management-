const express = require("express");

const {
    createSalesPayment,
    getSalesPayments,
    getSalesPaymentById,
    cancelSalesPayment,
    deleteSalesPayment,
} = require("../controllers/salesPaymentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// Authentication
// ===============================
router.use(protect);

// ===============================
// Sales Payment Access
// ===============================
router.use(authorizeRoles("SUPER_ADMIN"));

// ===============================
// Create Sales Payment
// POST /api/sales-payments
// ===============================
router.post("/", createSalesPayment);

// ===============================
// Get All Sales Payments
// GET /api/sales-payments
// ===============================
router.get("/", getSalesPayments);

// ===============================
// Get Sales Payment By ID
// GET /api/sales-payments/:id
// ===============================
router.get("/:id", getSalesPaymentById);

// ===============================
// Cancel Sales Payment
// PATCH /api/sales-payments/:id/cancel
// ===============================
router.patch(
    "/:id/cancel",
    cancelSalesPayment
);

// ===============================
// Delete Sales Payment
// ===============================
router.delete(
    "/:id",
    deleteSalesPayment
);

module.exports = router;