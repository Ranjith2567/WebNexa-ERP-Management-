const express = require("express");

const {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
} = require("../controllers/warehouseController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Authentication
router.use(protect);

// Only Super Admin
router.use(authorizeRoles("SUPER_ADMIN"));

// Create
router.post("/", createWarehouse);

// Get all
router.get("/", getWarehouses);

// Get by ID
router.get("/:id", getWarehouseById);

// Update
router.put("/:id", updateWarehouse);

// Delete
router.delete("/:id", deleteWarehouse);

module.exports = router;