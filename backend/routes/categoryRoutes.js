const express = require("express");

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require("../controllers/categoryController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All category routes require authentication
router.use(protect);

// Currently category management is SUPER_ADMIN only
router.use(authorizeRoles("SUPER_ADMIN"));

// Create Category
router.post("/", createCategory);

// Get All Categories
router.get("/", getCategories);

// Get Single Category
router.get("/:id", getCategoryById);

// Update Category
router.put("/:id", updateCategory);

// Delete Category
router.delete("/:id", deleteCategory);

module.exports = router;