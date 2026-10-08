const express = require("express");

const {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
} = require("../controllers/brandController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// Authentication
// ===============================
router.use(protect);

// ===============================
// SUPER ADMIN Authorization
// ===============================
router.use(authorizeRoles("SUPER_ADMIN"));

// ===============================
// Brand Routes
// ===============================

router.post("/", createBrand);

router.get("/", getBrands);

router.get("/:id", getBrandById);

router.put("/:id", updateBrand);

router.delete("/:id", deleteBrand);

module.exports = router;