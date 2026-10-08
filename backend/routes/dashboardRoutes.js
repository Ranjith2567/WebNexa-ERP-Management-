const express = require("express");

const {
    getDashboardSummary,
} = require("../controllers/dashboardController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// Authentication
// ===============================

router.use(protect);

// ===============================
// Authorization
// ===============================

router.use(
    authorizeRoles("SUPER_ADMIN")
);

// ===============================
// Dashboard Summary
// ===============================

router.get(
    "/summary",
    getDashboardSummary
);

module.exports = router;