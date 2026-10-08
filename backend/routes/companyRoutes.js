const express = require("express");

const {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
} = require("../controllers/companyController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();


// All company routes require login
router.use(protect);


// Only Super Admin can manage companies
router.use(authorizeRoles("SUPER_ADMIN"));


// Create company
router.post("/", createCompany);

// Get all companies
router.get("/", getCompanies);

// Get single company
router.get("/:id", getCompanyById);

// Update company
router.put("/:id", updateCompany);

// Delete company
router.delete("/:id", deleteCompany);


module.exports = router;