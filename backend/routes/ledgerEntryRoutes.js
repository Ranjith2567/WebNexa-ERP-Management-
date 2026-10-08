const express = require("express");

const {
    getAccountLedger,
    getLedgerByAccount,
    getLedgerEntryById,
    getTransactionHistory,
} = require("../controllers/ledgerEntryController");

const { protect } = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(protect);

router.use(authorizeRoles("SUPER_ADMIN"));

// =====================================================
// TRANSACTION HISTORY
// =====================================================

// All transaction history
// IMPORTANT: Keep this BEFORE /:id

router.get(
    "/history",
    getTransactionHistory
);

// =====================================================
// COMPANY / BRANCH / ACCOUNT FILTERED LEDGER
// =====================================================

router.get(
    "/",
    getAccountLedger
);

// =====================================================
// PARTICULAR ACCOUNT LEDGER
// =====================================================

router.get(
    "/account/:accountId",
    getLedgerByAccount
);

// =====================================================
// INDIVIDUAL LEDGER ENTRY
// =====================================================

router.get(
    "/:id",
    getLedgerEntryById
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;