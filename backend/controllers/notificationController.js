const mongoose = require("mongoose");

const Notification = require("../models/Notification");

// =====================================================
// GET NOTIFICATIONS
// =====================================================

const getNotifications = async (req, res) => {
    try {
        const {
            company,
            branch,
            type,
            priority,
            isRead,
            page = 1,
            limit = 20,
        } = req.query;

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // PAGINATION
        // =================================================

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(parseInt(limit, 10) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * currentLimit;

        // =================================================
        // BUILD FILTER
        // =================================================

        const filter = {
            company,
            recipient: req.user._id,
        };

        // =================================================
        // BRANCH FILTER
        // =================================================

        if (branch) {
            if (!mongoose.Types.ObjectId.isValid(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        // =================================================
        // TYPE FILTER
        // =================================================

        if (type) {
            filter.type = type.toUpperCase();
        }

        // =================================================
        // PRIORITY FILTER
        // =================================================

        if (priority) {
            filter.priority = priority.toUpperCase();
        }

        // =================================================
        // READ / UNREAD FILTER
        // =================================================

        if (typeof isRead !== "undefined") {
            if (
                isRead !== "true" &&
                isRead !== "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "isRead must be either true or false.",
                });
            }

            filter.isRead = isRead === "true";
        }

        // =================================================
        // GET TOTAL
        // =================================================

        const total =
            await Notification.countDocuments(filter);

        // =================================================
        // GET NOTIFICATIONS
        // =================================================

        const notifications =
            await Notification.find(filter)
                .populate(
                    "branch",
                    "name code"
                )
                .populate(
                    "recipient",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(currentLimit)
                .lean();

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: currentPage,
                limit: currentLimit,
                totalPages:
                    Math.ceil(total / currentLimit),
            },
        });
    } catch (error) {
        console.error(
            "Get Notifications Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch notifications.",
            error: error.message,
        });
    }
};


// =====================================================
// GET UNREAD NOTIFICATIONS
// =====================================================

const getUnreadNotifications = async (
    req,
    res
) => {
    try {
        const { company } = req.query;

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // GET UNREAD
        // =================================================

        const notifications =
            await Notification.find({
                company,
                recipient: req.user._id,
                isRead: false,
            })
                .populate(
                    "branch",
                    "name code"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    createdAt: -1,
                })
                .lean();

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length,
        });
    } catch (error) {
        console.error(
            "Get Unread Notifications Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch unread notifications.",
            error: error.message,
        });
    }
};


// =====================================================
// GET UNREAD COUNT
// =====================================================

const getUnreadNotificationCount = async (
    req,
    res
) => {
    try {
        const { company } = req.query;

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // COUNT
        // =================================================

        const count =
            await Notification.countDocuments({
                company,
                recipient: req.user._id,
                isRead: false,
            });

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            data: {
                unreadCount: count,
            },
        });
    } catch (error) {
        console.error(
            "Get Unread Notification Count Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch unread notification count.",
            error: error.message,
        });
    }
};


// =====================================================
// GET SINGLE NOTIFICATION
// =====================================================

const getNotificationById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { company } = req.query;

        // =================================================
        // VALIDATE IDs
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID.",
            });
        }

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // FIND NOTIFICATION
        // =================================================

        const notification =
            await Notification.findOne({
                _id: id,
                company,
                recipient: req.user._id,
            })
                .populate(
                    "branch",
                    "name code"
                )
                .populate(
                    "recipient",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .lean();

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found.",
            });
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error(
            "Get Notification Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch notification.",
            error: error.message,
        });
    }
};


// =====================================================
// MARK NOTIFICATION AS READ
// =====================================================

const markAsRead = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { company } = req.body;

        // =================================================
        // VALIDATE ID
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID.",
            });
        }

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // UPDATE
        // =================================================

        const notification =
            await Notification.findOneAndUpdate(
                {
                    _id: id,
                    company,
                    recipient: req.user._id,
                },
                {
                    $set: {
                        isRead: true,
                        readAt: new Date(),
                    },
                },
                {
                    new: true,
                }
            )
                .populate(
                    "branch",
                    "name code"
                )
                .lean();

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found.",
            });
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "Notification marked as read.",
            data: notification,
        });
    } catch (error) {
        console.error(
            "Mark Notification Read Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to mark notification as read.",
            error: error.message,
        });
    }
};


// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

const markAllAsRead = async (
    req,
    res
) => {
    try {
        const { company } = req.body;

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // UPDATE
        // =================================================

        const result =
            await Notification.updateMany(
                {
                    company,
                    recipient: req.user._id,
                    isRead: false,
                },
                {
                    $set: {
                        isRead: true,
                        readAt: new Date(),
                    },
                }
            );

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "All notifications marked as read.",
            data: {
                modifiedCount:
                    result.modifiedCount,
            },
        });
    } catch (error) {
        console.error(
            "Mark All Notifications Read Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to mark all notifications as read.",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE NOTIFICATION
// =====================================================

const deleteNotification = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { company } = req.query;

        // =================================================
        // VALIDATE ID
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID.",
            });
        }

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // DELETE
        // =================================================

        const notification =
            await Notification.findOneAndDelete({
                _id: id,
                company,
                recipient: req.user._id,
            });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found.",
            });
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "Notification deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Notification Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete notification.",
            error: error.message,
        });
    }
};


// =====================================================
// TEMPORARY TEST NOTIFICATION
// REMOVE AFTER TESTING
// =====================================================

const createTestNotification = async (
    req,
    res
) => {
    try {
        const {
            createNotification,
        } = require("../services/notificationService");

        const {
            company,
            branch,
        } = req.body;

        // =================================================
        // VALIDATE COMPANY
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        // =================================================
        // VALIDATE BRANCH IF PROVIDED
        // =================================================

        if (
            branch &&
            !mongoose.Types.ObjectId.isValid(branch)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID.",
            });
        }

        // =================================================
        // CREATE NOTIFICATION
        // =================================================

        const notification =
            await createNotification({
                company,
                branch: branch || null,
                recipient: req.user._id,

                type: "SYSTEM",

                title: "Test Notification",

                message:
                    "WebNexa ERP notification system is working successfully.",

                priority: "MEDIUM",

                referenceType: "OTHER",

                referenceId: null,

                metadata: {
                    test: true,
                    source: "notification-test",
                },

                createdBy: req.user._id,
            });

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({
            success: true,
            message:
                "Test notification created successfully.",
            data: notification,
        });
    } catch (error) {
        console.error(
            "Create Test Notification Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create test notification.",
            error: error.message,
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getNotifications,
    getUnreadNotifications,
    getUnreadNotificationCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // TEMPORARY
    createTestNotification,
};