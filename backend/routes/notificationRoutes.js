const express = require("express");

const {
    getNotifications,
    getUnreadNotifications,
    getUnreadNotificationCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createTestNotification,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(protect);

// =====================================================
// NOTIFICATION LIST
// =====================================================

// GET /api/notifications

router.get(
    "/",
    getNotifications
);

// =====================================================
// UNREAD NOTIFICATIONS
// =====================================================

// GET /api/notifications/unread

router.get(
    "/unread",
    getUnreadNotifications
);

// =====================================================
// UNREAD COUNT
// =====================================================

// GET /api/notifications/unread-count

router.get(
    "/unread-count",
    getUnreadNotificationCount
);

// =====================================================
// MARK ALL AS READ
// =====================================================

// PATCH /api/notifications/read-all

router.patch(
    "/read-all",
    markAllAsRead
);

// =====================================================
// TEMPORARY TEST NOTIFICATION
// REMOVE AFTER TESTING
// =====================================================

// POST /api/notifications/test

router.post(
    "/test",
    createTestNotification
);

// =====================================================
// SINGLE NOTIFICATION
// =====================================================

// GET /api/notifications/:id

router.get(
    "/:id",
    getNotificationById
);

// =====================================================
// MARK SINGLE AS READ
// =====================================================

// PATCH /api/notifications/:id/read

router.patch(
    "/:id/read",
    markAsRead
);

// =====================================================
// DELETE NOTIFICATION
// =====================================================

// DELETE /api/notifications/:id

router.delete(
    "/:id",
    deleteNotification
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;