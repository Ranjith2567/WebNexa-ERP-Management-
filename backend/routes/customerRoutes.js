const express = require("express");

const {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
} = require("../controllers/customerController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// All Customer Routes
// ======================================================
router.use(protect);

// For now Customer management is SUPER_ADMIN only.
// Later we can change this to permission-based access.
router.use(authorizeRoles("SUPER_ADMIN"));

// ======================================================
// CREATE CUSTOMER
// POST /api/customers
// ======================================================
router.post("/", createCustomer);

// ======================================================
// GET ALL CUSTOMERS
// GET /api/customers
//
// Supports:
// ?search=arun
// ?customerType=BUSINESS
// ?isActive=true
// ?branch=BRANCH_ID
// ?company=COMPANY_ID
// ?page=1
// ?limit=10
// ?sortBy=name
// ?sortOrder=asc
// ======================================================
router.get("/", getCustomers);

// ======================================================
// GET SINGLE CUSTOMER
// GET /api/customers/:id
// ======================================================
router.get("/:id", getCustomerById);

// ======================================================
// UPDATE CUSTOMER
// PATCH /api/customers/:id
// ======================================================
router.patch("/:id", updateCustomer);

// ======================================================
// RESTORE CUSTOMER
// PATCH /api/customers/:id/restore
// ======================================================
router.patch("/:id/restore", restoreCustomer);

// ======================================================
// DELETE / DEACTIVATE CUSTOMER
// DELETE /api/customers/:id
// ======================================================
router.delete("/:id", deleteCustomer);

module.exports = router;