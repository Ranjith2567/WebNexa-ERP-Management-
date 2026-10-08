const express = require("express");

const {
    requirePermission,
} = require("../middleware/permissionMiddleware");

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// REGISTER
// =====================================================

router.post(
    "/register",
    registerUser
);

// =====================================================
// LOGIN
// =====================================================

router.post(
    "/login",
    loginUser
);

// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
    "/forgot-password",
    forgotPassword
);

// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
    "/reset-password/:token",
    resetPassword
);

// =====================================================
// CURRENT USER
// Any logged-in user
// =====================================================

router.get(
    "/me",
    protect,
    (req, res) => {
        res.status(200).json({
            success: true,
            message:
                "Authenticated user details",
            user: req.user,
        });
    }
);

// =====================================================
// PERMISSION TEST
// =====================================================

router.get(
    "/permission-test",
    protect,
    requirePermission(
        "reports.view"
    ),
    (req, res) => {
        res.status(200).json({
            success: true,
            message:
                "Permission verified successfully! 🔐",
            permission:
                "reports.view",
            user: {
                name:
                    req.user.name,
                role:
                    req.user.role,
            },
        });
    }
);

// =====================================================
// ADMIN TEST
// Only Admin / Super Admin
// =====================================================

router.get(
    "/admin-test",
    protect,
    authorizeRoles(
        "ADMIN",
        "SUPER_ADMIN"
    ),
    (req, res) => {
        res.status(200).json({
            success: true,
            message:
                "Welcome Admin! 🔐",
            user: req.user,
        });
    }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;