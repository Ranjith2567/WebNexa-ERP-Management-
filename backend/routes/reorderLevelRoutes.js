const express = require("express");

const {
    createReorderLevel,
    getReorderLevels,
    getLowStockAlerts,
    getReorderLevelById,
    updateReorderLevel,
    deleteReorderLevel,
} = require("../controllers/reorderLevelController");

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
// Reorder Level Routes
// =====================================================

// -----------------------------------------------------
// Create Reorder Configuration
// POST /api/reorder-levels
// -----------------------------------------------------

router.post("/", createReorderLevel);

// -----------------------------------------------------
// Get All Reorder Configurations
// GET /api/reorder-levels
// -----------------------------------------------------

router.get("/", getReorderLevels);

// -----------------------------------------------------
// Get Low Stock Alerts
// GET /api/reorder-levels/alerts
//
// IMPORTANT:
// This route must come BEFORE /:id
// -----------------------------------------------------

router.get("/alerts", getLowStockAlerts);

// -----------------------------------------------------
// Get Reorder Configuration By ID
// GET /api/reorder-levels/:id
// -----------------------------------------------------

router.get("/:id", getReorderLevelById);

// -----------------------------------------------------
// Update Reorder Configuration
// PUT /api/reorder-levels/:id
// -----------------------------------------------------

router.put("/:id", updateReorderLevel);

// -----------------------------------------------------
// Delete Reorder Configuration
// DELETE /api/reorder-levels/:id
// -----------------------------------------------------

router.delete("/:id", deleteReorderLevel);

// =====================================================
// Export Router
// =====================================================

module.exports = router;