const express = require("express");

const {
    createExpenseCategory,
    getExpenseCategories,
    getExpenseCategoryById,
    updateExpenseCategory,
    deleteExpenseCategory,
} = require("../controllers/expenseCategoryController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// AUTHENTICATION
// ======================================================

router.use(protect);

// ======================================================
// EXPENSE CATEGORY ROUTES
// ======================================================

// Create
router.post(
    "/",
    authorizeRoles("SUPER_ADMIN"),
    createExpenseCategory
);

// Get all
router.get(
    "/",
    authorizeRoles("SUPER_ADMIN"),
    getExpenseCategories
);

// Get by ID
router.get(
    "/:id",
    authorizeRoles("SUPER_ADMIN"),
    getExpenseCategoryById
);

// Update
router.put(
    "/:id",
    authorizeRoles("SUPER_ADMIN"),
    updateExpenseCategory
);

// Soft delete
router.delete(
    "/:id",
    authorizeRoles("SUPER_ADMIN"),
    deleteExpenseCategory
);

module.exports = router;