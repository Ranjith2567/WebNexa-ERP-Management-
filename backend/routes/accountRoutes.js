const express = require("express");

const {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deactivateAccount,
    deleteAccount,
} = require("../controllers/accountController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createAccount);

router.get("/", getAccounts);

router.get("/:id", getAccountById);

router.patch("/:id", updateAccount);

router.patch(
    "/:id/deactivate",
    deactivateAccount
);

router.delete("/:id", deleteAccount);

module.exports = router;