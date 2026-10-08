const express = require("express");

const {
    getAuditLogs,
    getAuditLogById,
    getAuditLogCount,
} = require("../controllers/auditLogController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// AUDIT LOG ROUTES
// ========================================

// Get audit logs
router.get("/", protect, getAuditLogs);

// Get audit log count
router.get("/count", protect, getAuditLogCount);

// Get single audit log
router.get("/:id", protect, getAuditLogById);


module.exports = router;