const express = require("express");

const {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,

    submitExpenseForApproval,
    approveExpense,
    rejectExpense,
    markExpenseAsPaid,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// Authentication
// ======================================================

router.use(protect);

// ======================================================
// Basic Expense CRUD
// ======================================================

// Create Expense
router.post(
    "/",
    authorizeRoles("SUPER_ADMIN"),
    createExpense
);

// Get All Expenses
router.get(
    "/",
    authorizeRoles("SUPER_ADMIN"),
    getExpenses
);

// Get Single Expense
router.get(
    "/:id",
    authorizeRoles("SUPER_ADMIN"),
    getExpenseById
);

// Update Expense
router.put(
    "/:id",
    authorizeRoles("SUPER_ADMIN"),
    updateExpense
);

// Delete Expense
router.delete(
    "/:id",
    authorizeRoles("SUPER_ADMIN"),
    deleteExpense
);

// ======================================================
// Expense Approval Workflow
// ======================================================

// Submit Expense for Approval
router.patch(
    "/:id/submit",
    authorizeRoles("SUPER_ADMIN"),
    submitExpenseForApproval
);

// Approve Expense
router.patch(
    "/:id/approve",
    authorizeRoles("SUPER_ADMIN"),
    approveExpense
);

// Reject Expense
router.patch(
    "/:id/reject",
    authorizeRoles("SUPER_ADMIN"),
    rejectExpense
);

// Mark Expense as Paid
router.patch(
    "/:id/pay",
    authorizeRoles("SUPER_ADMIN"),
    markExpenseAsPaid
);

// ======================================================
// Export Router
// ======================================================

module.exports = router;