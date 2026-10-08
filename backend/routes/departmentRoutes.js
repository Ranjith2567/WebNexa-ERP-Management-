const express = require("express");

const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
} = require("../controllers/departmentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.use(
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "HR",
        "MANAGER"
    )
);

router.post("/", createDepartment);

router.get("/", getDepartments);

router.get(
    "/:id",
    getDepartmentById
);

router.put(
    "/:id",
    updateDepartment
);

router.delete(
    "/:id",
    deleteDepartment
);

module.exports = router;