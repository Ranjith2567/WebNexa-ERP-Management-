const express = require("express");
const multer = require("multer");

const profileImageUpload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPG, PNG and WEBP images are allowed"
                )
            );
        }

        cb(null, true);
    },
});
const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    uploadMyProfileImage,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// =====================================
// MY PROFILE
// Any authenticated user
// =====================================
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.put("/change-password", changeMyPassword);
router.post("/profile-image", profileImageUpload.single("profileImage"), uploadMyProfileImage
);
// =====================================
// EMPLOYEE MANAGEMENT
// SUPER ADMIN ONLY
// =====================================
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createEmployee);

router.get("/", getEmployees);

router.get("/:id", getEmployeeById);

router.put("/:id", updateEmployee);

router.delete("/:id", deleteEmployee);

module.exports = router;