const express = require("express");

const {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    updateQuotationStatus,
    deleteQuotation,
} = require("../controllers/quotationController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createQuotation);

router.get("/", getQuotations);

router.get("/:id", getQuotationById);

router.patch("/:id/status", updateQuotationStatus);

router.patch("/:id", updateQuotation);

router.delete("/:id", deleteQuotation);

module.exports = router;