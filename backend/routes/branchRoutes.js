const express = require("express");

const {
    createBranch,
    getBranches,
    getBranchById,
    updateBranch,
    deleteBranch,
} = require("../controllers/branchController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All branch routes require authentication
router.use(protect);

// Only SUPER_ADMIN can manage branches for now
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createBranch);

router.get("/", getBranches);

router.get("/:id", getBranchById);

router.put("/:id", updateBranch);

router.delete("/:id", deleteBranch);

module.exports = router;