
// =====================================================
// CREATE SINGLE NOTIFICATION
// =====================================================

const createNotification = async ({
    company,
    branch = null,
    recipient,
    type,
    title,
    message,
    priority = "MEDIUM",
    referenceType = "OTHER",
    referenceId = null,
    metadata = {},
    createdBy = null,
    session = null,
}) => {
    try {
        if (!company) {
            throw new Error("Company is required");
        }

        if (!recipient) {
            throw new Error(
                "Notification recipient is required"
            );
        }

        if (!type) {
            throw new Error(
                "Notification type is required"
            );
        }

        if (!title) {
            throw new Error(
                "Notification title is required"
            );
        }

        if (!message) {
            throw new Error(
                "Notification message is required"
            );
        }

        const notificationData = {
            company,
            branch,
            recipient,
            type,
            title,
            message,
            priority,
            referenceType,
            referenceId,
            metadata,
            createdBy,
        };

        // =================================================
        // CREATE WITH TRANSACTION
        // =================================================

        if (session) {
            const result =
                await Notification.create(
                    [notificationData],
                    { session }
                );

            return result[0];
        }

        // =================================================
        // NORMAL CREATE
        // =================================================

        const notification =
            await Notification.create(
                notificationData
            );

        return notification;
    } catch (error) {
        console.error(
            "Create Notification Error:",
            error.message
        );

        throw error;
    }
};


// =====================================================
// CREATE BULK NOTIFICATIONS
// =====================================================

const createBulkNotifications = async (
    notifications = [],
    session = null
) => {
    try {
        if (
            !Array.isArray(notifications) ||
            notifications.length === 0
        ) {
            return [];
        }

        // =================================================
        // CREATE BULK WITH TRANSACTION
        // =================================================

        const options = session
            ? { session }
            : {};

        const createdNotifications =
            await Notification.insertMany(
                notifications,
                options
            );

        return createdNotifications;
    } catch (error) {
        console.error(
            "Create Bulk Notifications Error:",
            error.message
        );

        throw error;
    }
};


// =====================================================
// STOCK NOTIFICATION
// =====================================================

const createStockNotification = async ({
    company,
    branch = null,
    recipient,
    stock,
    product,
    warehouse,
    createdBy = null,
    session = null,
}) => {
    try {
        if (!company) {
            throw new Error(
                "Company is required"
            );
        }

        if (!recipient) {
            throw new Error(
                "Notification recipient is required"
            );
        }

        if (!stock) {
            throw new Error(
                "Stock is required"
            );
        }

        if (!product) {
            throw new Error(
                "Product is required"
            );
        }

        // =================================================
        // STOCK VALUES
        // =================================================

        const quantity =
            Number(stock.quantity) || 0;

        const reservedQuantity =
            Number(
                stock.reservedQuantity
            ) || 0;

        const minimumStock =
            Number(
                stock.minimumStock
            ) || 0;

        const maximumStock =
            Number(
                stock.maximumStock
            ) || 0;

        const availableQuantity =
            quantity -
            reservedQuantity;

        // =================================================
        // DETERMINE STOCK STATUS
        // =================================================

        let type = null;
        let title = "";
        let message = "";
        let priority = "MEDIUM";

        // =================================================
        // OUT OF STOCK
        // =================================================

        if (
            availableQuantity <= 0
        ) {
            type =
                "OUT_OF_STOCK";

            title =
                "Product Out of Stock";

            message =
                `${product.name} is out of stock`;

            priority =
                "CRITICAL";
        }

        // =================================================
        // LOW STOCK
        // =================================================

        else if (
            minimumStock > 0 &&
            availableQuantity <=
                minimumStock
        ) {
            type =
                "LOW_STOCK";

            title =
                "Low Stock Alert";

            message =
                `${product.name} stock is low. Available quantity: ${availableQuantity}, minimum stock: ${minimumStock}.`;

            priority =
                "HIGH";
        }

        // =================================================
        // OVER STOCK
        // =================================================

        else if (
            maximumStock > 0 &&
            quantity > maximumStock
        ) {
            type =
                "OVER_STOCK";

            title =
                "Over Stock Alert";

            message =
                `${product.name} stock is above the maximum stock level. Current quantity: ${quantity}, maximum stock: ${maximumStock}.`;

            priority =
                "MEDIUM";
        }

        // =================================================
        // NORMAL STOCK
        // =================================================

        else {
            return null;
        }

        // =================================================
        // DUPLICATE NOTIFICATION PREVENTION
        // =================================================

        const duplicateQuery =
            Notification.findOne({
                company,
                recipient,
                type,
                referenceType:
                    "STOCK",
                referenceId:
                    stock._id,
                isRead: false,
            }).lean();

        if (session) {
            duplicateQuery.session(
                session
            );
        }

        const existingNotification =
            await duplicateQuery;

        // =================================================
        // DUPLICATE FOUND
        // =================================================

        if (
            existingNotification
        ) {
            console.log(
                `Duplicate Stock Notification Skipped: ${type} - ${product.name}`
            );

            return null;
        }

        // =================================================
        // CREATE NOTIFICATION
        // =================================================

        return await createNotification({
            company,
            branch,
            recipient,

            type,

            title,

            message,

            priority,

            referenceType:
                "STOCK",

            referenceId:
                stock._id,

            metadata: {
                productId:
                    product._id,

                productName:
                    product.name,

                sku:
                    product.sku ||
                    "",

                warehouseId:
                    warehouse?._id ||
                    null,

                warehouseName:
                    warehouse?.name ||
                    "",

                quantity,

                reservedQuantity,

                availableQuantity,

                minimumStock,

                maximumStock,
            },

            createdBy,

            session,
        });
    } catch (error) {
        console.error(
            "Create Stock Notification Error:",
            error.message
        );

        throw error;
    }
};


// =====================================================
// MARK NOTIFICATION AS READ
// =====================================================

const markNotificationAsRead =
    async (
        notificationId,
        userId
    ) => {
        try {
            const notification =
                await Notification.findOneAndUpdate(
                    {
                        _id:
                            notificationId,

                        recipient:
                            userId,
                    },
                    {
                        $set: {
                            isRead: true,
                            readAt:
                                new Date(),
                        },
                    },
                    {
                        new: true,
                    }
                );

            return notification;
        } catch (error) {
            console.error(
                "Mark Notification Read Error:",
                error.message
            );

            throw error;
        }
    };


// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

const markAllNotificationsAsRead =
    async ({
        company,
        recipient,
    }) => {
        try {
            const result =
                await Notification.updateMany(
                    {
                        company,
                        recipient,
                        isRead: false,
                    },
                    {
                        $set: {
                            isRead: true,
                            readAt:
                                new Date(),
                        },
                    }
                );

            return result;
        } catch (error) {
            console.error(
                "Mark All Notifications Read Error:",
                error.message
            );

            throw error;
        }
    };


// =====================================================
// GET UNREAD NOTIFICATION COUNT
// =====================================================

const getUnreadNotificationCount =
    async ({
        company,
        recipient,
    }) => {
        try {
            const count =
                await Notification.countDocuments(
                    {
                        company,
                        recipient,
                        isRead: false,
                    }
                );

            return count;
        } catch (error) {
            console.error(
                "Unread Notification Count Error:",
                error.message
            );

            throw error;
        }
    };


// =====================================================
// DELETE NOTIFICATION
// =====================================================

const deleteNotification =
    async (
        notificationId,
        userId
    ) => {
        try {
            const notification =
                await Notification.findOneAndDelete(
                    {
                        _id:
                            notificationId,

                        recipient:
                            userId,
                    }
                );

            return notification;
        } catch (error) {
            console.error(
                "Delete Notification Error:",
                error.message
            );

            throw error;
        }
    };


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createNotification,
    createBulkNotifications,

    // Stock notifications
    createStockNotification,

    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    deleteNotification,
};
