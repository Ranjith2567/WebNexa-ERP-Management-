const express = require("express");

const {
    createSalesReturn,
    getSalesReturns,
    getSalesReturnById,
    deleteSalesReturn,
} = require("../controllers/salesReturnController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// Authentication
// ===============================
router.use(protect);

// ===============================
// Sales Return Authorization
// ===============================
router.use(authorizeRoles("SUPER_ADMIN"));

// ===============================
// Create Sales Return
// ===============================
router.post(
    "/",
    createSalesReturn
);

// ===============================
// Get All Sales Returns
// ===============================
router.get(
    "/",
    getSalesReturns
);

// ===============================
// Get Sales Return By ID
// ===============================
router.get(
    "/:id",
    getSalesReturnById
);

// ===============================
// Delete Sales Return
// ===============================
router.delete(
    "/:id",
    deleteSalesReturn
);

module.exports = router;