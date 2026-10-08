const express = require("express");

const {
    createDesignation,
    getDesignations,
    getDesignationById,
    updateDesignation,
    deleteDesignation,
} = require("../controllers/designationController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createDesignation);
router.get("/", getDesignations);
router.get("/:id", getDesignationById);
router.put("/:id", updateDesignation);
router.delete("/:id", deleteDesignation);

module.exports = router;