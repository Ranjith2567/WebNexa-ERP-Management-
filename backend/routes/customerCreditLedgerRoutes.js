const express = require("express");

const {
    createCreditNoteLedgerEntry,
    getCustomerCreditBalanceController,
    getCustomerCreditLedger,
    applyCustomerCredit,
    reverseCustomerCredit,
    deleteCustomerCreditLedger,
} = require("../controllers/customerCreditLedgerController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// Authentication
// =====================================================

router.use(protect);

// =====================================================
// Authorization
// =====================================================

router.use(authorizeRoles("SUPER_ADMIN"));

// =====================================================
// Customer Credit Ledger
// =====================================================

// Add Credit Note amount to customer credit
router.post(
    "/from-credit-note",
    createCreditNoteLedgerEntry
);

// Get customer credit balance
router.get(
    "/balance/:customerId",
    getCustomerCreditBalanceController
);

// Get credit ledger
router.get(
    "/",
    getCustomerCreditLedger
);

// Apply customer credit to invoice
router.post(
    "/apply",
    applyCustomerCredit
);

// Reverse applied customer credit
router.post(
    "/reverse",
    reverseCustomerCredit
);

// Accounting delete protection
router.delete(
    "/:id",
    deleteCustomerCreditLedger
);

module.exports = router;