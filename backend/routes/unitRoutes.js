const express = require("express");

const {
    createUnit,
    getUnits,
    getUnitById,
    updateUnit,
    deleteUnit,
} = require("../controllers/unitController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createUnit);

router.get("/", getUnits);

router.get("/:id", getUnitById);

router.put("/:id", updateUnit);

router.delete("/:id", deleteUnit);

module.exports = router;