const express = require("express");

const {
    getTrialBalance,
} = require("../controllers/trialBalanceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

router.get("/", getTrialBalance);

module.exports = router;