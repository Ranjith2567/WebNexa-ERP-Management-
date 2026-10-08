const express = require("express");

const {
    createSalesOrder,
    getSalesOrders,
    getSalesOrderById,
    updateSalesOrder,
    updateSalesOrderStatus,
    deleteSalesOrder,
} = require("../controllers/salesOrderController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// Authentication
// ======================================================

router.use(protect);

// ======================================================
// Authorization
// ======================================================

router.use(
    authorizeRoles("SUPER_ADMIN")
);

// ======================================================
// Sales Order Routes
// ======================================================

// Create Sales Order
router.post(
    "/",
    createSalesOrder
);

// Get All Sales Orders
router.get(
    "/",
    getSalesOrders
);

// Get Sales Order By ID
router.get(
    "/:id",
    getSalesOrderById
);

// Update Sales Order Status
router.patch(
    "/:id/status",
    updateSalesOrderStatus
);

// Update Sales Order
router.patch(
    "/:id",
    updateSalesOrder
);

// Delete Sales Order
router.delete(
    "/:id",
    deleteSalesOrder
);

module.exports = router;