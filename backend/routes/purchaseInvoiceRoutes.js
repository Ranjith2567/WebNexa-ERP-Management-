const express = require("express");

const {
    createPurchaseInvoice,
    getPurchaseInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
} = require("../controllers/purchaseInvoiceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ============================================================
// Authentication & Authorization
// ============================================================

router.use(protect);

router.use(authorizeRoles("SUPER_ADMIN"));

// ============================================================
// Purchase Invoice Routes
// ============================================================

// Create Purchase Invoice
router.post("/", createPurchaseInvoice);

// Get All Purchase Invoices
router.get("/", getPurchaseInvoices);

// Get Purchase Invoice By ID
router.get("/:id", getPurchaseInvoiceById);

// Update Purchase Invoice
router.put("/:id", updatePurchaseInvoice);

// Delete Purchase Invoice
router.delete("/:id", deletePurchaseInvoice);

module.exports = router;