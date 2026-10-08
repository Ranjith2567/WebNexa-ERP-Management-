import React, { useEffect, useMemo, useState } from "react";
import {
    FiBell,
    FiCheck,
    FiCheckCircle,
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiSearch,
    FiAlertTriangle,
    FiInfo,
    FiXCircle,
    FiPackage,
    FiShoppingCart,
    FiDollarSign,
    FiCreditCard,
    FiSettings,
    FiUser,
} from "react-icons/fi";
import api from "../../services/api";
import "../../styles/notifications.css";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [readFilter, setReadFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
    });

    const [unreadCount, setUnreadCount] = useState(0);

    // ---------------------------------------------------------
    // GET COMPANY ID
    // ---------------------------------------------------------
    const getCompanyId = () => {
        try {
            const storedUser =
                localStorage.getItem("user") ||
                localStorage.getItem("authUser");

            if (!storedUser) return null;

            const user = JSON.parse(storedUser);

            if (typeof user.company === "string") {
                return user.company;
            }

            if (user.company?._id) {
                return user.company._id;
            }

            if (user.company?.id) {
                return user.company.id;
            }

            if (user.data?.company?._id) {
                return user.data.company._id;
            }

            if (user.data?.company?.id) {
                return user.data.company.id;
            }

            return null;
        } catch (err) {
            console.error("Unable to read company from localStorage:", err);
            return null;
        }
    };

    // ---------------------------------------------------------
    // GET NOTIFICATIONS
    // ---------------------------------------------------------
    const fetchNotifications = async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            const companyId = getCompanyId();

            if (!companyId) {
                throw new Error("Company information not found.");
            }

            const params = {
                company: companyId,
                page: pagination.page,
                limit: pagination.limit,
            };

            if (readFilter === "read") {
                params.isRead = "true";
            }

            if (readFilter === "unread") {
                params.isRead = "false";
            }

            if (priorityFilter !== "all") {
                params.priority = priorityFilter;
            }

            if (typeFilter !== "all") {
                params.type = typeFilter;
            }

            const response = await api.get("/notifications", { params });

            const responseData = response?.data;

            if (responseData?.success) {
                setNotifications(responseData.data || []);

                if (responseData.pagination) {
                    setPagination((prev) => ({
                        ...prev,
                        ...responseData.pagination,
                    }));
                }
            } else {
                setNotifications([]);
            }
        } catch (err) {
            console.error("Fetch notifications error:", err);

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load notifications."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ---------------------------------------------------------
    // GET UNREAD COUNT
    // ---------------------------------------------------------
    const fetchUnreadCount = async () => {
        try {
            const companyId = getCompanyId();

            if (!companyId) return;

            const response = await api.get("/notifications/unread-count", {
                params: {
                    company: companyId,
                },
            });

            if (response?.data?.success) {
                setUnreadCount(response.data.data?.unreadCount || 0);
            }
        } catch (err) {
            console.error("Unread count error:", err);
        }
    };

    // ---------------------------------------------------------
    // INITIAL LOAD
    // ---------------------------------------------------------
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [
        pagination.page,
        readFilter,
        priorityFilter,
        typeFilter,
    ]);

    // ---------------------------------------------------------
    // MARK AS READ
    // ---------------------------------------------------------
    const handleMarkAsRead = async (notificationId) => {
        try {
            const companyId = getCompanyId();

            if (!companyId) return;

            await api.patch(
                `/notifications/${notificationId}/read`,
                {
                    company: companyId,
                }
            );

            setNotifications((prev) =>
                prev.map((notification) =>
                    notification._id === notificationId
                        ? {
                              ...notification,
                              isRead: true,
                              readAt: new Date().toISOString(),
                          }
                        : notification
                )
            );

            setUnreadCount((prev) => Math.max(prev - 1, 0));

            if (
                selectedNotification &&
                selectedNotification._id === notificationId
            ) {
                setSelectedNotification((prev) => ({
                    ...prev,
                    isRead: true,
                    readAt: new Date().toISOString(),
                }));
            }
        } catch (err) {
            console.error("Mark as read error:", err);

            setError(
                err?.response?.data?.message ||
                    "Failed to mark notification as read."
            );
        }
    };

    // ---------------------------------------------------------
    // MARK ALL AS READ
    // ---------------------------------------------------------
    const handleMarkAllAsRead = async () => {
        try {
            const companyId = getCompanyId();

            if (!companyId) return;

            if (unreadCount === 0) return;

            await api.patch("/notifications/read-all", {
                company: companyId,
            });

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    isRead: true,
                    readAt: notification.readAt || new Date().toISOString(),
                }))
            );

            setUnreadCount(0);
        } catch (err) {
            console.error("Mark all as read error:", err);

            setError(
                err?.response?.data?.message ||
                    "Failed to mark all notifications as read."
            );
        }
    };

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------
    const handleDelete = async (notificationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this notification?"
        );

        if (!confirmed) return;

        try {
            const companyId = getCompanyId();

            if (!companyId) return;

            await api.delete(`/notifications/${notificationId}`, {
                params: {
                    company: companyId,
                },
            });

            const deletedNotification = notifications.find(
                (item) => item._id === notificationId
            );

            setNotifications((prev) =>
                prev.filter((item) => item._id !== notificationId)
            );

            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount((prev) => Math.max(prev - 1, 0));
            }

            if (
                selectedNotification &&
                selectedNotification._id === notificationId
            ) {
                setSelectedNotification(null);
                setShowViewModal(false);
            }

            setPagination((prev) => ({
                ...prev,
                total: Math.max(prev.total - 1, 0),
            }));
        } catch (err) {
            console.error("Delete notification error:", err);

            setError(
                err?.response?.data?.message ||
                    "Failed to delete notification."
            );
        }
    };

    // ---------------------------------------------------------
    // VIEW NOTIFICATION
    // ---------------------------------------------------------
    const handleView = async (notification) => {
        setSelectedNotification(notification);
        setShowViewModal(true);

        if (!notification.isRead) {
            await handleMarkAsRead(notification._id);
        }
    };

    // ---------------------------------------------------------
    // REFRESH
    // ---------------------------------------------------------
    const handleRefresh = async () => {
        await Promise.all([
            fetchNotifications(false),
            fetchUnreadCount(),
        ]);
    };

    // ---------------------------------------------------------
    // PAGINATION
    // ---------------------------------------------------------
    const handlePrevious = () => {
        if (pagination.page > 1) {
            setPagination((prev) => ({
                ...prev,
                page: prev.page - 1,
            }));
        }
    };

    const handleNext = () => {
        if (pagination.page < pagination.totalPages) {
            setPagination((prev) => ({
                ...prev,
                page: prev.page + 1,
            }));
        }
    };

    // ---------------------------------------------------------
    // SEARCH
    // ---------------------------------------------------------
    const filteredNotifications = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return notifications;
        }

        return notifications.filter((notification) => {
            const title = notification.title || "";
            const message = notification.message || "";
            const type = notification.type || "";
            const priority = notification.priority || "";

            return (
                title.toLowerCase().includes(value) ||
                message.toLowerCase().includes(value) ||
                type.toLowerCase().includes(value) ||
                priority.toLowerCase().includes(value)
            );
        });
    }, [notifications, search]);

    // ---------------------------------------------------------
    // TYPE ICON
    // ---------------------------------------------------------
    const getNotificationIcon = (type) => {
        if (!type) return <FiBell />;

        if (
            type.includes("LOW_STOCK") ||
            type.includes("OUT_OF_STOCK") ||
            type.includes("OVER_STOCK") ||
            type.includes("STOCK")
        ) {
            return <FiPackage />;
        }

        if (
            type.includes("SALES") ||
            type.includes("PURCHASE") ||
            type.includes("ORDER") ||
            type.includes("INVOICE")
        ) {
            return <FiShoppingCart />;
        }

        if (
            type.includes("PAYMENT") ||
            type.includes("EXPENSE") ||
            type.includes("CREDIT") ||
            type.includes("JOURNAL")
        ) {
            return <FiDollarSign />;
        }

        if (type.includes("USER")) {
            return <FiUser />;
        }

        if (type === "SYSTEM") {
            return <FiSettings />;
        }

        return <FiBell />;
    };

    // ---------------------------------------------------------
    // PRIORITY CLASS
    // ---------------------------------------------------------
    const getPriorityClass = (priority) => {
        switch (priority) {
            case "CRITICAL":
                return "notification-priority-critical";

            case "HIGH":
                return "notification-priority-high";

            case "LOW":
                return "notification-priority-low";

            default:
                return "notification-priority-medium";
        }
    };

    // ---------------------------------------------------------
    // PRIORITY ICON
    // ---------------------------------------------------------
    const getPriorityIcon = (priority) => {
        switch (priority) {
            case "CRITICAL":
                return <FiXCircle />;

            case "HIGH":
                return <FiAlertTriangle />;

            case "LOW":
                return <FiInfo />;

            default:
                return <FiInfo />;
        }
    };

    // ---------------------------------------------------------
    // DATE FORMAT
    // ---------------------------------------------------------
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // ---------------------------------------------------------
    // EMPTY
    // ---------------------------------------------------------
    const renderEmptyState = () => (
        <div className="notifications-empty">
            <div className="notifications-empty-icon">
                <FiBell />
            </div>

            <h3>No notifications found</h3>

            <p>
                {search
                    ? "No notifications match your search."
                    : "You're all caught up. New notifications will appear here."}
            </p>
        </div>
    );

    return (
        <div className="notifications-page">
            {/* HEADER */}
            <div className="notifications-header">
                <div>
                    <div className="notifications-title-row">
                        <div className="notifications-title-icon">
                            <FiBell />
                        </div>

                        <div>
                            <h1>Notifications</h1>
                            <p>
                                Stay updated with important ERP activities
                            </p>
                        </div>
                    </div>
                </div>

                <div className="notifications-header-actions">
                    <button
                        className="notification-action-btn"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh"
                    >
                        <FiRefreshCw
                            className={refreshing ? "spin-icon" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        className="notification-action-btn primary"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                    >
                        <FiCheckCircle />
                        Mark All Read
                    </button>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="notifications-summary">
                <div className="notification-summary-card">
                    <div className="summary-icon">
                        <FiBell />
                    </div>

                    <div>
                        <span>Total Notifications</span>
                        <strong>{pagination.total}</strong>
                    </div>
                </div>

                <div className="notification-summary-card unread">
                    <div className="summary-icon">
                        <FiInfo />
                    </div>

                    <div>
                        <span>Unread</span>
                        <strong>{unreadCount}</strong>
                    </div>
                </div>

                <div className="notification-summary-card critical">
                    <div className="summary-icon">
                        <FiAlertTriangle />
                    </div>

                    <div>
                        <span>Critical</span>
                        <strong>
                            {
                                notifications.filter(
                                    (item) =>
                                        item.priority === "CRITICAL"
                                ).length
                            }
                        </strong>
                    </div>
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <div className="notifications-error">
                    <FiAlertTriangle />
                    <span>{error}</span>

                    <button onClick={() => setError("")}>
                        <FiXCircle />
                    </button>
                </div>
            )}

            {/* FILTERS */}
            <div className="notifications-toolbar">
                <div className="notification-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={readFilter}
                    onChange={(e) => {
                        setPagination((prev) => ({
                            ...prev,
                            page: 1,
                        }));

                        setReadFilter(e.target.value);
                    }}
                >
                    <option value="all">All Status</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                </select>

                <select
                    value={priorityFilter}
                    onChange={(e) => {
                        setPagination((prev) => ({
                            ...prev,
                            page: 1,
                        }));

                        setPriorityFilter(e.target.value);
                    }}
                >
                    <option value="all">All Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setPagination((prev) => ({
                            ...prev,
                            page: 1,
                        }));

                        setTypeFilter(e.target.value);
                    }}
                >
                    <option value="all">All Types</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="OVER_STOCK">Over Stock</option>
                    <option value="SALES_ORDER">Sales Order</option>
                    <option value="SALES_INVOICE">Sales Invoice</option>
                    <option value="SALES_PAYMENT">Sales Payment</option>
                    <option value="SALES_RETURN">Sales Return</option>
                    <option value="PURCHASE_ORDER">Purchase Order</option>
                    <option value="GOODS_RECEIPT">Goods Receipt</option>
                    <option value="PURCHASE_INVOICE">
                        Purchase Invoice
                    </option>
                    <option value="PURCHASE_PAYMENT">
                        Purchase Payment
                    </option>
                    <option value="PURCHASE_RETURN">
                        Purchase Return
                    </option>
                    <option value="EXPENSE_CREATED">
                        Expense Created
                    </option>
                    <option value="EXPENSE_APPROVED">
                        Expense Approved
                    </option>
                    <option value="EXPENSE_REJECTED">
                        Expense Rejected
                    </option>
                    <option value="EXPENSE_PAID">Expense Paid</option>
                    <option value="CUSTOMER_PAYMENT_DUE">
                        Customer Payment Due
                    </option>
                    <option value="SUPPLIER_PAYMENT_DUE">
                        Supplier Payment Due
                    </option>
                    <option value="STOCK_TRANSFER">
                        Stock Transfer
                    </option>
                    <option value="STOCK_ADJUSTMENT">
                        Stock Adjustment
                    </option>
                    <option value="JOURNAL_POSTED">
                        Journal Posted
                    </option>
                    <option value="USER_CREATED">User Created</option>
                    <option value="SYSTEM">System</option>
                </select>
            </div>

            {/* CONTENT */}
            <div className="notifications-card">
                {loading ? (
                    <div className="notifications-loading">
                        <FiRefreshCw className="spin-icon" />
                        <span>Loading notifications...</span>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <div className="notifications-list">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`notification-item ${
                                    !notification.isRead
                                        ? "unread"
                                        : ""
                                }`}
                            >
                                <div
                                    className={`notification-icon ${getPriorityClass(
                                        notification.priority
                                    )}`}
                                >
                                    {getNotificationIcon(
                                        notification.type
                                    )}
                                </div>

                                <div className="notification-content">
                                    <div className="notification-top">
                                        <div>
                                            <h3>
                                                {notification.title ||
                                                    "Notification"}

                                                {!notification.isRead && (
                                                    <span className="unread-dot" />
                                                )}
                                            </h3>
                                        </div>

                                        <span
                                            className={`priority-badge ${getPriorityClass(
                                                notification.priority
                                            )}`}
                                        >
                                            {getPriorityIcon(
                                                notification.priority
                                            )}

                                            {notification.priority}
                                        </span>
                                    </div>

                                    <p>{notification.message}</p>

                                    <div className="notification-meta">
                                        <span>
                                            {notification.type?.replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </span>

                                        <span>•</span>

                                        <span>
                                            {formatDate(
                                                notification.createdAt
                                            )}
                                        </span>

                                        {notification.branch?.name && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    {
                                                        notification.branch
                                                            .name
                                                    }
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="notification-actions">
                                    <button
                                        onClick={() =>
                                            handleView(notification)
                                        }
                                        title="View"
                                    >
                                        <FiEye />
                                    </button>

                                    {!notification.isRead && (
                                        <button
                                            onClick={() =>
                                                handleMarkAsRead(
                                                    notification._id
                                                )
                                            }
                                            title="Mark as read"
                                        >
                                            <FiCheck />
                                        </button>
                                    )}

                                    <button
                                        className="danger"
                                        onClick={() =>
                                            handleDelete(
                                                notification._id
                                            )
                                        }
                                        title="Delete"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {!loading && pagination.totalPages > 0 && (
                <div className="notifications-pagination">
                    <span>
                        Showing{" "}
                        <strong>
                            {pagination.total === 0
                                ? 0
                                : (pagination.page - 1) *
                                      pagination.limit +
                                  1}
                        </strong>{" "}
                        -{" "}
                        <strong>
                            {Math.min(
                                pagination.page * pagination.limit,
                                pagination.total
                            )}
                        </strong>{" "}
                        of <strong>{pagination.total}</strong>
                    </span>

                    <div className="pagination-buttons">
                        <button
                            onClick={handlePrevious}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </button>

                        <span className="page-number">
                            {pagination.page} /{" "}
                            {pagination.totalPages}
                        </span>

                        <button
                            onClick={handleNext}
                            disabled={
                                pagination.page >=
                                pagination.totalPages
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {showViewModal && selectedNotification && (
                <div
                    className="notification-modal-overlay"
                    onClick={() => setShowViewModal(false)}
                >
                    <div
                        className="notification-view-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="notification-modal-header">
                            <div>
                                <div className="modal-title-icon">
                                    {getNotificationIcon(
                                        selectedNotification.type
                                    )}
                                </div>

                                <div>
                                    <h2>
                                        {selectedNotification.title}
                                    </h2>

                                    <span>
                                        {selectedNotification.type?.replaceAll(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    setShowViewModal(false)
                                }
                            >
                                <FiXCircle />
                            </button>
                        </div>

                        <div className="notification-modal-body">
                            <div className="notification-detail-message">
                                <label>Message</label>
                                <p>
                                    {
                                        selectedNotification.message
                                    }
                                </p>
                            </div>

                            <div className="notification-detail-grid">
                                <div>
                                    <label>Priority</label>

                                    <span
                                        className={`priority-badge ${getPriorityClass(
                                            selectedNotification.priority
                                        )}`}
                                    >
                                        {getPriorityIcon(
                                            selectedNotification.priority
                                        )}

                                        {
                                            selectedNotification.priority
                                        }
                                    </span>
                                </div>

                                <div>
                                    <label>Status</label>

                                    <span
                                        className={`read-status ${
                                            selectedNotification.isRead
                                                ? "read"
                                                : "unread"
                                        }`}
                                    >
                                        {selectedNotification.isRead
                                            ? "Read"
                                            : "Unread"}
                                    </span>
                                </div>

                                <div>
                                    <label>Created At</label>
                                    <p>
                                        {formatDate(
                                            selectedNotification.createdAt
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <label>Read At</label>
                                    <p>
                                        {selectedNotification.readAt
                                            ? formatDate(
                                                  selectedNotification.readAt
                                              )
                                            : "Not read yet"}
                                    </p>
                                </div>

                                {selectedNotification.branch && (
                                    <div>
                                        <label>Branch</label>
                                        <p>
                                            {
                                                selectedNotification
                                                    .branch.name
                                            }
                                        </p>
                                    </div>
                                )}

                                {selectedNotification.createdBy && (
                                    <div>
                                        <label>Created By</label>
                                        <p>
                                            {
                                                selectedNotification
                                                    .createdBy.name
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedNotification.referenceType &&
                                selectedNotification.referenceType !==
                                    "OTHER" && (
                                    <div className="notification-reference">
                                        <label>Reference</label>

                                        <div>
                                            <span>
                                                {
                                                    selectedNotification.referenceType
                                                }
                                            </span>

                                            {selectedNotification.referenceId && (
                                                <code>
                                                    {
                                                        selectedNotification.referenceId
                                                    }
                                                </code>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="notification-modal-footer">
                            {!selectedNotification.isRead && (
                                <button
                                    className="modal-primary-btn"
                                    onClick={() =>
                                        handleMarkAsRead(
                                            selectedNotification._id
                                        )
                                    }
                                >
                                    <FiCheck />
                                    Mark as Read
                                </button>
                            )}

                            <button
                                className="modal-secondary-btn"
                                onClick={() =>
                                    setShowViewModal(false)
                                }
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;