const express = require("express");

const {
    getStockSummary,
} = require("../controllers/stockSummaryController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(protect);


// =====================================================
// AUTHORIZATION
// =====================================================

router.use(
    authorizeRoles("SUPER_ADMIN")
);


// =====================================================
// INVENTORY STOCK SUMMARY
// =====================================================

router.get(
    "/",
    getStockSummary
);


module.exports = router;