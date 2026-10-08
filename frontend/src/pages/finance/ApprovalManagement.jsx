import React, { useCallback, useEffect, useState } from "react";
import {
    FiCheck,
    FiClock,
    FiEye,
    FiFilter,
    FiRefreshCw,
    FiSearch,
    FiX,
    FiAlertCircle,
    FiUser,
    FiLayers,
    FiFileText,
    FiCalendar,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/approvalManagement.css";

const MODULE_OPTIONS = [
    "PURCHASE_ORDER",
    "PURCHASE_RETURN",
    "EXPENSE",
    "STOCK_ADJUSTMENT",
    "SALES_RETURN",
    "QUOTATION",
    "SALES_ORDER",
    "PURCHASE_INVOICE",
    "SALES_INVOICE",
    "OTHER",
];

const STATUS_OPTIONS = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
];

const formatModule = (value = "") =>
    value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getUserName = (user) => {
    if (!user) return "-";

    if (typeof user === "string") {
        return user;
    }

    return user.name || user.email || "-";
};

const getStepApprover = (step) => {
    if (!step) return "-";

    if (step.approverType === "USER") {
        return (
            step.approverUser?.name ||
            step.approverUser?.email ||
            "Specific User"
        );
    }

    return step.approverRole || "Role";
};

const getStatusClass = (status = "") =>
    status.toLowerCase().replace(/_/g, "-");

const getStepStatusIcon = (status) => {
    switch (status) {
        case "APPROVED":
            return <FiCheck />;

        case "REJECTED":
            return <FiX />;

        case "SKIPPED":
            return <FiX />;

        default:
            return <FiClock />;
    }
};

const ApprovalManagement = () => {
    const [approvals, setApprovals] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [moduleFilter, setModuleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [referenceTypeFilter, setReferenceTypeFilter] = useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [showFilters, setShowFilters] = useState(false);

    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState(null);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [approvalComments, setApprovalComments] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");

    const fetchApprovals = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (moduleFilter) {
                params.module = moduleFilter;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            if (referenceTypeFilter.trim()) {
                params.referenceType =
                    referenceTypeFilter.trim();
            }

            const response = await api.get("/approvals", {
                params,
            });
           
            const responseData = response?.data || {};

            setApprovals(
                Array.isArray(responseData.data)
                    ? responseData.data
                    : []
            );

            setPagination({
                total: Number(responseData.total) || 0,
                page: Number(responseData.page) || 1,
                limit: Number(responseData.limit) || limit,
                totalPages:
                    Number(responseData.totalPages) || 0,
            });
        } catch (err) {
            console.error(
                "Fetch Approval Requests Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to fetch approval requests."
            );

            setApprovals([]);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        limit,
        search,
        moduleFilter,
        statusFilter,
        referenceTypeFilter,
    ]);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    useEffect(() => {
        setPage(1);
    }, [
        search,
        moduleFilter,
        statusFilter,
        referenceTypeFilter,
    ]);

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [success]);

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleRefresh = () => {
        clearMessages();
        fetchApprovals();
    };

    const handleClearFilters = () => {
        setSearch("");
        setModuleFilter("");
        setStatusFilter("PENDING");
        setReferenceTypeFilter("");
        setPage(1);
    };

    const handleView = async (approval) => {
        try {
            setError("");

            const response = await api.get(
                `/approvals/${approval._id}`
            );

            const data = response?.data?.data;

            setSelectedApproval(data || approval);
            setShowViewModal(true);
        } catch (err) {
            console.error(
                "Get Approval Request Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load approval request."
            );
        }
    };

    const openApproveModal = (approval) => {
        clearMessages();
        setSelectedApproval(approval);
        setApprovalComments("");
        setShowApproveModal(true);
    };

    const openRejectModal = (approval) => {
        clearMessages();
        setSelectedApproval(approval);
        setRejectionReason("");
        setShowRejectModal(true);
    };

    const openCancelModal = (approval) => {
        clearMessages();
        setSelectedApproval(approval);
        setCancellationReason("");
        setShowCancelModal(true);
    };

    const closeActionModals = () => {
        if (actionLoading) return;

        setShowApproveModal(false);
        setShowRejectModal(false);
        setShowCancelModal(false);

        setApprovalComments("");
        setRejectionReason("");
        setCancellationReason("");
    };

    const handleApprove = async () => {
        if (!selectedApproval?._id) return;

        try {
            setActionLoading(true);
            setError("");

            const response = await api.post(
                `/approvals/${selectedApproval._id}/approve`,
                {
                    comments:
                        approvalComments.trim(),
                }
            );

            setSuccess(
                response?.data?.message ||
                    "Approval processed successfully."
            );

            closeActionModals();

            setShowViewModal(false);

            await fetchApprovals();
        } catch (err) {
            console.error(
                "Approve Approval Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to approve approval request."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApproval?._id) return;

        if (!rejectionReason.trim()) {
            setError("Rejection reason is required.");
            return;
        }

        try {
            setActionLoading(true);
            setError("");

            const response = await api.post(
                `/approvals/${selectedApproval._id}/reject`,
                {
                    reason:
                        rejectionReason.trim(),
                }
            );

            setSuccess(
                response?.data?.message ||
                    "Approval request rejected successfully."
            );

            closeActionModals();

            setShowViewModal(false);

            await fetchApprovals();
        } catch (err) {
            console.error(
                "Reject Approval Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to reject approval request."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!selectedApproval?._id) return;

        try {
            setActionLoading(true);
            setError("");

            const response = await api.post(
                `/approvals/${selectedApproval._id}/cancel`,
                {
                    reason:
                        cancellationReason.trim(),
                }
            );

            setSuccess(
                response?.data?.message ||
                    "Approval request cancelled successfully."
            );

            closeActionModals();

            setShowViewModal(false);

            await fetchApprovals();
        } catch (err) {
            console.error(
                "Cancel Approval Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to cancel approval request."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const canCancel =
        selectedApproval?.status === "PENDING";

    const getCurrentStep = (approval) => {
        if (!approval?.steps?.length) {
            return null;
        }

        return (
            approval.steps.find(
                (step) =>
                    step.level ===
                    approval.currentLevel
            ) || null
        );
    };

    const currentStep =
        getCurrentStep(selectedApproval);

    return (
        <div className="approval-management-page">
            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="approval-management-header">
                <div>
                    <div className="approval-title-row">
                        <div className="approval-title-icon">
                            <FiCheck />
                        </div>

                        <div>
                            <h1>
                                Approval Management
                            </h1>

                            <p>
                                Review and manage
                                approval requests
                            </p>
                        </div>
                    </div>
                </div>

                <div className="approval-header-actions">
                    <button
                        type="button"
                        className="approval-btn approval-btn-secondary"
                        onClick={() =>
                            setShowFilters(
                                (prev) => !prev
                            )
                        }
                    >
                        <FiFilter />
                        Filters
                    </button>

                    <button
                        type="button"
                        className="approval-btn approval-btn-primary"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "approval-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {/* =====================================================
                ALERTS
            ===================================================== */}

            {success && (
                <div className="approval-alert approval-alert-success">
                    <FiCheck />
                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {error && (
                <div className="approval-alert approval-alert-error">
                    <FiAlertCircle />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* =====================================================
                SUMMARY CARDS
            ===================================================== */}

            <div className="approval-summary-grid">
                <div className="approval-summary-card">
                    <div className="approval-summary-icon pending">
                        <FiClock />
                    </div>

                    <div>
                        <span>Current Page</span>
                        <strong>
                            {approvals.length}
                        </strong>
                    </div>
                </div>

                <div className="approval-summary-card">
                    <div className="approval-summary-icon total">
                        <FiLayers />
                    </div>

                    <div>
                        <span>Total Requests</span>
                        <strong>
                            {pagination.total}
                        </strong>
                    </div>
                </div>

                <div className="approval-summary-card">
                    <div className="approval-summary-icon levels">
                        <FiCheck />
                    </div>

                    <div>
                        <span>Current Page</span>
                        <strong>
                            {pagination.page} /{" "}
                            {pagination.totalPages ||
                                1}
                        </strong>
                    </div>
                </div>
            </div>

            {/* =====================================================
                FILTERS
            ===================================================== */}

            <div className="approval-filter-card">
                <div className="approval-search-box">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search title, reference number or description..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />
                </div>

                {showFilters && (
                    <div className="approval-filter-row">
                        <div className="approval-filter-field">
                            <label>
                                Module
                            </label>

                            <select
                                value={
                                    moduleFilter
                                }
                                onChange={(e) =>
                                    setModuleFilter(
                                        e.target
                                            .value
                                    )
                                }
                            >
                                <option value="">
                                    All Modules
                                </option>

                                {MODULE_OPTIONS.map(
                                    (module) => (
                                        <option
                                            key={
                                                module
                                            }
                                            value={
                                                module
                                            }
                                        >
                                            {formatModule(
                                                module
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="approval-filter-field">
                            <label>
                                Status
                            </label>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target
                                            .value
                                    )
                                }
                            >
                                <option value="">
                                    All Status
                                </option>

                                {STATUS_OPTIONS.map(
                                    (status) => (
                                        <option
                                            key={
                                                status
                                            }
                                            value={
                                                status
                                            }
                                        >
                                            {formatModule(
                                                status
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="approval-filter-field">
                            <label>
                                Reference Type
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. PurchaseReturn"
                                value={
                                    referenceTypeFilter
                                }
                                onChange={(e) =>
                                    setReferenceTypeFilter(
                                        e.target
                                            .value
                                    )
                                }
                            />
                        </div>

                        <div className="approval-filter-action">
                            <button
                                type="button"
                                className="approval-clear-btn"
                                onClick={
                                    handleClearFilters
                                }
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* =====================================================
                TABLE
            ===================================================== */}

            <div className="approval-table-card">
                <div className="approval-table-header">
                    <div>
                        <h2>
                            Approval Requests
                        </h2>

                        <span>
                            {pagination.total}{" "}
                            request
                            {pagination.total !==
                            1
                                ? "s"
                                : ""}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="approval-loading">
                        <div className="approval-spinner" />
                        <p>
                            Loading approval
                            requests...
                        </p>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="approval-empty">
                        <div className="approval-empty-icon">
                            <FiFileText />
                        </div>

                        <h3>
                            No approval requests
                        </h3>

                        <p>
                            No approval requests
                            match the selected
                            filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="approval-table-wrapper">
                            <table className="approval-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Request
                                        </th>

                                        <th>
                                            Module
                                        </th>

                                        <th>
                                            Requested By
                                        </th>

                                        <th>
                                            Level
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {approvals.map(
                                        (
                                            approval
                                        ) => (
                                            <tr
                                                key={
                                                    approval._id
                                                }
                                            >
                                                <td>
                                                    <div className="approval-request-cell">
                                                        <strong>
                                                            {
                                                                approval.title
                                                            }
                                                        </strong>

                                                        <span>
                                                            {approval.referenceNumber ||
                                                                "No reference number"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="approval-module-badge">
                                                        {formatModule(
                                                            approval.module
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="approval-user-cell">
                                                        <div className="approval-user-avatar">
                                                            <FiUser />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {getUserName(
                                                                    approval.requestedBy
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {approval
                                                                    .requestedBy
                                                                    ?.email ||
                                                                    "-"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="approval-level-text">
                                                        {approval.currentLevel ||
                                                            1}{" "}
                                                        /{" "}
                                                        {approval.totalLevels ||
                                                            1}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`approval-status-badge ${getStatusClass(
                                                            approval.status
                                                        )}`}
                                                    >
                                                        {
                                                            approval.status
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="approval-date">
                                                        <FiCalendar />

                                                        {formatDate(
                                                            approval.createdAt
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="approval-row-actions">
                                                        <button
                                                            type="button"
                                                            className="approval-icon-btn view"
                                                            title="View"
                                                            onClick={() =>
                                                                handleView(
                                                                    approval
                                                                )
                                                            }
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {approval.status ===
                                                            "PENDING" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="approval-icon-btn approve"
                                                                    title="Approve"
                                                                    onClick={() =>
                                                                        openApproveModal(
                                                                            approval
                                                                        )
                                                                    }
                                                                >
                                                                    <FiCheck />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="approval-icon-btn reject"
                                                                    title="Reject"
                                                                    onClick={() =>
                                                                        openRejectModal(
                                                                            approval
                                                                        )
                                                                    }
                                                                >
                                                                    <FiX />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="approval-icon-btn cancel"
                                                                    title="Cancel"
                                                                    onClick={() =>
                                                                        openCancelModal(
                                                                            approval
                                                                        )
                                                                    }
                                                                >
                                                                    <FiAlertCircle />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="approval-pagination">
                            <div className="approval-pagination-info">
                                Showing{" "}
                                <strong>
                                    {approvals.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        pagination.total
                                    }
                                </strong>{" "}
                                requests
                            </div>

                            <div className="approval-pagination-controls">
                                <button
                                    type="button"
                                    disabled={
                                        page <= 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (prev) =>
                                                Math.max(
                                                    prev -
                                                        1,
                                                    1
                                                )
                                        )
                                    }
                                >
                                    Previous
                                </button>

                                <span>
                                    Page{" "}
                                    <strong>
                                        {page}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {pagination.totalPages ||
                                            1}
                                    </strong>
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        pagination.totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (prev) =>
                                                prev +
                                                1
                                        )
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* =====================================================
                VIEW MODAL
            ===================================================== */}

            {showViewModal &&
                selectedApproval && (
                    <div
                        className="approval-modal-overlay"
                        onMouseDown={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                setShowViewModal(
                                    false
                                );
                            }
                        }}
                    >
                        <div className="approval-modal approval-view-modal">
                            <div className="approval-modal-header">
                                <div>
                                    <h2>
                                        Approval Details
                                    </h2>

                                    <p>
                                        {
                                            selectedApproval.referenceNumber ||
                                            "Approval Request"
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="approval-modal-body">
                                <div className="approval-detail-top">
                                    <div>
                                        <span>
                                            Title
                                        </span>

                                        <strong>
                                            {
                                                selectedApproval.title
                                            }
                                        </strong>
                                    </div>

                                    <span
                                        className={`approval-status-badge ${getStatusClass(
                                            selectedApproval.status
                                        )}`}
                                    >
                                        {
                                            selectedApproval.status
                                        }
                                    </span>
                                </div>

                                <div className="approval-detail-grid">
                                    <div>
                                        <span>
                                            Module
                                        </span>

                                        <strong>
                                            {formatModule(
                                                selectedApproval.module
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Reference Type
                                        </span>

                                        <strong>
                                            {
                                                selectedApproval.referenceType
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Reference Number
                                        </span>

                                        <strong>
                                            {selectedApproval.referenceNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Requested By
                                        </span>

                                        <strong>
                                            {getUserName(
                                                selectedApproval.requestedBy
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Requested At
                                        </span>

                                        <strong>
                                            {formatDateTime(
                                                selectedApproval.requestedAt
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Current Level
                                        </span>

                                        <strong>
                                            {
                                                selectedApproval.currentLevel
                                            }{" "}
                                            /{" "}
                                            {
                                                selectedApproval.totalLevels
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="approval-description-box">
                                    <span>
                                        Description
                                    </span>

                                    <p>
                                        {selectedApproval.description ||
                                            "No description provided."}
                                    </p>
                                </div>

                                {/* Current Step */}
                                {currentStep && (
                                    <div className="approval-current-step">
                                        <div className="approval-section-title">
                                            <FiClock />
                                            Current Approval
                                            Step
                                        </div>

                                        <div className="approval-current-step-card">
                                            <div>
                                                <span>
                                                    Level{" "}
                                                    {
                                                        currentStep.level
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        getStepApprover(
                                                            currentStep
                                                        )
                                                    }
                                                </strong>
                                            </div>

                                            <span className="approval-step-type">
                                                {
                                                    currentStep.approverType
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Approval Timeline */}
                                <div className="approval-steps-section">
                                    <div className="approval-section-title">
                                        <FiLayers />
                                        Approval
                                        Workflow
                                    </div>

                                    <div className="approval-steps">
                                        {(
                                            selectedApproval.steps ||
                                            []
                                        ).map(
                                            (
                                                step
                                            ) => (
                                                <div
                                                    className={`approval-step ${step.status.toLowerCase()}`}
                                                    key={
                                                        step._id ||
                                                        step.level
                                                    }
                                                >
                                                    <div className="approval-step-line">
                                                        <div className="approval-step-icon">
                                                            {getStepStatusIcon(
                                                                step.status
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="approval-step-content">
                                                        <div className="approval-step-header">
                                                            <div>
                                                                <strong>
                                                                    Level{" "}
                                                                    {
                                                                        step.level
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {
                                                                        step.approverType
                                                                    }
                                                                </span>
                                                            </div>

                                                            <span
                                                                className={`approval-step-status ${step.status.toLowerCase()}`}
                                                            >
                                                                {
                                                                    step.status
                                                                }
                                                            </span>
                                                        </div>

                                                        <p className="approval-step-approver">
                                                            {
                                                                getStepApprover(
                                                                    step
                                                                )
                                                            }
                                                        </p>

                                                        {step.actedBy && (
                                                            <p className="approval-step-acted">
                                                                Acted by{" "}
                                                                <strong>
                                                                    {getUserName(
                                                                        step.actedBy
                                                                    )}
                                                                </strong>

                                                                {step.actedAt && (
                                                                    <>
                                                                        {" "}
                                                                        on{" "}
                                                                        {
                                                                            formatDateTime(
                                                                                step.actedAt
                                                                            )
                                                                        }
                                                                    </>
                                                                )}
                                                            </p>
                                                        )}

                                                        {step.comments && (
                                                            <div className="approval-step-comment">
                                                                {step.comments}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Rejection */}
                                {selectedApproval.rejectionReason && (
                                    <div className="approval-reason-box rejection">
                                        <strong>
                                            Rejection
                                            Reason
                                        </strong>

                                        <p>
                                            {
                                                selectedApproval.rejectionReason
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Cancellation */}
                                {selectedApproval.cancellationReason && (
                                    <div className="approval-reason-box cancellation">
                                        <strong>
                                            Cancellation
                                            Reason
                                        </strong>

                                        <p>
                                            {
                                                selectedApproval.cancellationReason
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="approval-modal-footer">
                                <button
                                    type="button"
                                    className="approval-btn approval-btn-secondary"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    Close
                                </button>

                                {selectedApproval.status ===
                                    "PENDING" && (
                                    <>
                                        <button
                                            type="button"
                                            className="approval-btn approval-btn-danger"
                                            onClick={() =>
                                                openRejectModal(
                                                    selectedApproval
                                                )
                                            }
                                        >
                                            <FiX />
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            className="approval-btn approval-btn-success"
                                            onClick={() =>
                                                openApproveModal(
                                                    selectedApproval
                                                )
                                            }
                                        >
                                            <FiCheck />
                                            Approve
                                        </button>
                                    </>
                                )}

                                {selectedApproval.status ===
                                    "PENDING" &&
                                    selectedApproval.requestedBy &&
                                    canCancel && (
                                        <button
                                            type="button"
                                            className="approval-btn approval-btn-warning"
                                            onClick={() =>
                                                openCancelModal(
                                                    selectedApproval
                                                )
                                            }
                                        >
                                            <FiAlertCircle />
                                            Cancel
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

            {/* =====================================================
                APPROVE MODAL
            ===================================================== */}

            {showApproveModal &&
                selectedApproval && (
                    <div className="approval-modal-overlay">
                        <div className="approval-modal approval-action-modal">
                            <div className="approval-modal-header">
                                <div>
                                    <h2>
                                        Approve Request
                                    </h2>

                                    <p>
                                        {
                                            selectedApproval.title
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeActionModals
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="approval-modal-body">
                                <div className="approval-action-warning approve">
                                    <FiCheck />

                                    <div>
                                        <strong>
                                            Approve this
                                            request?
                                        </strong>

                                        <p>
                                            Your approval
                                            will be recorded
                                            for the current
                                            approval level.
                                        </p>
                                    </div>
                                </div>

                                <div className="approval-form-group">
                                    <label>
                                        Comments
                                        <span>
                                            Optional
                                        </span>
                                    </label>

                                    <textarea
                                        rows="5"
                                        maxLength="1000"
                                        placeholder="Enter approval comments..."
                                        value={
                                            approvalComments
                                        }
                                        onChange={(e) =>
                                            setApprovalComments(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="approval-modal-footer">
                                <button
                                    type="button"
                                    className="approval-btn approval-btn-secondary"
                                    onClick={
                                        closeActionModals
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="approval-btn approval-btn-success"
                                    onClick={
                                        handleApprove
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {actionLoading ? (
                                        <>
                                            <span className="approval-button-spinner" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck />
                                            Approve
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =====================================================
                REJECT MODAL
            ===================================================== */}

            {showRejectModal &&
                selectedApproval && (
                    <div className="approval-modal-overlay">
                        <div className="approval-modal approval-action-modal">
                            <div className="approval-modal-header">
                                <div>
                                    <h2>
                                        Reject Request
                                    </h2>

                                    <p>
                                        {
                                            selectedApproval.title
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeActionModals
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="approval-modal-body">
                                <div className="approval-action-warning reject">
                                    <FiX />

                                    <div>
                                        <strong>
                                            Reject this
                                            request?
                                        </strong>

                                        <p>
                                            A rejection
                                            reason is required
                                            and will be stored
                                            in the approval
                                            history.
                                        </p>
                                    </div>
                                </div>

                                <div className="approval-form-group">
                                    <label>
                                        Rejection Reason
                                        <span className="required">
                                            Required
                                        </span>
                                    </label>

                                    <textarea
                                        rows="5"
                                        maxLength="1000"
                                        placeholder="Enter rejection reason..."
                                        value={
                                            rejectionReason
                                        }
                                        onChange={(e) =>
                                            setRejectionReason(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />

                                    <div className="approval-character-count">
                                        {
                                            rejectionReason.length
                                        }{" "}
                                        / 1000
                                    </div>
                                </div>
                            </div>

                            <div className="approval-modal-footer">
                                <button
                                    type="button"
                                    className="approval-btn approval-btn-secondary"
                                    onClick={
                                        closeActionModals
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="approval-btn approval-btn-danger"
                                    onClick={
                                        handleReject
                                    }
                                    disabled={
                                        actionLoading ||
                                        !rejectionReason.trim()
                                    }
                                >
                                    {actionLoading ? (
                                        <>
                                            <span className="approval-button-spinner" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FiX />
                                            Reject
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =====================================================
                CANCEL MODAL
            ===================================================== */}

            {showCancelModal &&
                selectedApproval && (
                    <div className="approval-modal-overlay">
                        <div className="approval-modal approval-action-modal">
                            <div className="approval-modal-header">
                                <div>
                                    <h2>
                                        Cancel Request
                                    </h2>

                                    <p>
                                        {
                                            selectedApproval.title
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeActionModals
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="approval-modal-body">
                                <div className="approval-action-warning cancel">
                                    <FiAlertCircle />

                                    <div>
                                        <strong>
                                            Cancel this
                                            request?
                                        </strong>

                                        <p>
                                            Only the requester
                                            can cancel a pending
                                            approval request.
                                        </p>
                                    </div>
                                </div>

                                <div className="approval-form-group">
                                    <label>
                                        Cancellation
                                        Reason
                                        <span>
                                            Optional
                                        </span>
                                    </label>

                                    <textarea
                                        rows="5"
                                        maxLength="1000"
                                        placeholder="Enter cancellation reason..."
                                        value={
                                            cancellationReason
                                        }
                                        onChange={(e) =>
                                            setCancellationReason(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="approval-modal-footer">
                                <button
                                    type="button"
                                    className="approval-btn approval-btn-secondary"
                                    onClick={
                                        closeActionModals
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="approval-btn approval-btn-warning"
                                    onClick={
                                        handleCancel
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {actionLoading ? (
                                        <>
                                            <span className="approval-button-spinner" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FiAlertCircle />
                                            Cancel Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default ApprovalManagement;