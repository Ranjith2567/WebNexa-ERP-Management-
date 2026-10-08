import React, { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiRefreshCw,
    FiEye,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiFilter,
    FiActivity,
    FiCheckCircle,
    FiXCircle,
    FiUser,
    FiCalendar,
    FiGitBranch,
    FiFileText,
    FiClock,
    FiGlobe,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/auditLogs.css";

const ACTION_OPTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "APPROVE",
    "REJECT",
    "CANCEL",
    "PAYMENT",
    "REFUND",
    "STOCK_IN",
    "STOCK_OUT",
    "TRANSFER",
    "ADJUSTMENT",
    "POST",
    "PROCESS",
    "EXPORT",
    "IMPORT",
    "PASSWORD_CHANGE",
    "PASSWORD_RESET",
    "OTHER",
];

const MODULE_OPTIONS = [
    "AUTH",
    "USER",
    "COMPANY",
    "BRANCH",
    "EMPLOYEE",
    "DEPARTMENT",
    "DESIGNATION",
    "PRODUCT",
    "CATEGORY",
    "BRAND",
    "UNIT",
    "STOCK",
    "STOCK_TRANSFER",
    "STOCK_ADJUSTMENT",
    "WAREHOUSE",
    "REORDER_LEVEL",
    "SUPPLIER",
    "PURCHASE_ORDER",
    "GOODS_RECEIPT",
    "PURCHASE_INVOICE",
    "PURCHASE_PAYMENT",
    "PURCHASE_RETURN",
    "CUSTOMER",
    "QUOTATION",
    "SALES_ORDER",
    "SALES_INVOICE",
    "SALES_PAYMENT",
    "SALES_RETURN",
    "CREDIT_NOTE",
    "EXPENSE",
    "EXPENSE_CATEGORY",
    "ACCOUNT",
    "JOURNAL_ENTRY",
    "LEDGER_ENTRY",
    "DASHBOARD",
    "REPORT",
    "NOTIFICATION",
    "SETTINGS",
    "SYSTEM",
    "OTHER",
];

const STATUS_OPTIONS = ["SUCCESS", "FAILED"];

const formatLabel = (value = "") => {
    return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const formatJson = (value) => {
    if (value === null || value === undefined) {
        return "No data";
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "Unable to display data";
    }
};

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [action, setAction] = useState("");
    const [module, setModule] = useState("");
    const [status, setStatus] = useState("");

    const [userId, setUserId] = useState("");
    const [branchId, setBranchId] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);

    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [selectedLog, setSelectedLog] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [summary, setSummary] = useState({
        total: 0,
        success: 0,
        failed: 0,
    });

    // ========================================
    // FETCH USERS
    // ========================================

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users", {
                params: {
                    limit: 100,
                },
            });

            const responseData = response.data;

            const userData =
                responseData?.users ||
                responseData?.data ||
                responseData?.users?.data ||
                [];

            setUsers(Array.isArray(userData) ? userData : []);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    // ========================================
    // FETCH BRANCHES
    // ========================================

    const fetchBranches = async () => {
        try {
            const response = await api.get("/branches", {
                params: {
                    limit: 100,
                },
            });

            const responseData = response.data;

            const branchData =
                responseData?.branches ||
                responseData?.data ||
                responseData?.branches?.data ||
                [];

            setBranches(
                Array.isArray(branchData) ? branchData : []
            );
        } catch (err) {
            console.error("Failed to fetch branches:", err);
        }
    };

    // ========================================
    // BUILD QUERY
    // ========================================

    const buildParams = () => {
        const params = {
            page,
            limit,
        };

        if (search.trim()) {
            params.search = search.trim();
        }

        if (action) {
            params.action = action;
        }

        if (module) {
            params.module = module;
        }

        if (status) {
            params.status = status;
        }

        if (userId) {
            params.user = userId;
        }

        if (branchId) {
            params.branch = branchId;
        }

        if (startDate) {
            params.startDate = startDate;
        }

        if (endDate) {
            params.endDate = endDate;
        }

        return params;
    };

    // ========================================
    // FETCH AUDIT LOGS
    // ========================================

    const fetchAuditLogs = async (showRefresh = false) => {
        try {
            setError("");

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get(
                "/audit-logs",
                {
                    params: buildParams(),
                }
            );

            const responseData = response.data;

            const logData =
                responseData?.data ||
                responseData?.logs ||
                [];

            setLogs(
                Array.isArray(logData)
                    ? logData
                    : []
            );

            setTotal(
                Number(responseData?.total) || 0
            );

            setTotalPages(
                Number(responseData?.totalPages) || 0
            );
        } catch (err) {
            console.error(
                "Fetch Audit Logs Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to fetch audit logs."
            );

            setLogs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ========================================
    // FETCH COUNT
    // ========================================

    const fetchAuditCount = async () => {
        try {
            const params = {};

            if (action) {
                params.action = action;
            }

            if (module) {
                params.module = module;
            }

            if (status) {
                params.status = status;
            }

            if (userId) {
                params.user = userId;
            }

            if (startDate) {
                params.startDate = startDate;
            }

            if (endDate) {
                params.endDate = endDate;
            }

            const response = await api.get(
                "/audit-logs/count",
                {
                    params,
                }
            );

            const count =
                Number(response.data?.count) || 0;

            setSummary((previous) => ({
                ...previous,
                total: count,
            }));
        } catch (err) {
            console.error(
                "Audit Count Error:",
                err
            );
        }
    };

    // ========================================
    // SUMMARY FROM CURRENT FILTER
    // ========================================

    const calculateCurrentSummary = useMemo(() => {
        const success = logs.filter(
            (log) => log.status === "SUCCESS"
        ).length;

        const failed = logs.filter(
            (log) => log.status === "FAILED"
        ).length;

        return {
            success,
            failed,
        };
    }, [logs]);

    // ========================================
    // INITIAL LOAD
    // ========================================

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchAuditLogs();
        fetchAuditCount();
    }, [
        page,
        action,
        module,
        status,
        userId,
        branchId,
        startDate,
        endDate,
    ]);

    // ========================================
    // SEARCH
    // ========================================

    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 1) {
                setPage(1);
                return;
            }

            fetchAuditLogs();
            fetchAuditCount();
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    // ========================================
    // RESET FILTERS
    // ========================================

    const handleResetFilters = () => {
        setSearch("");
        setAction("");
        setModule("");
        setStatus("");
        setUserId("");
        setBranchId("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    // ========================================
    // VIEW LOG
    // ========================================

    const handleViewLog = async (log) => {
        try {
            const response = await api.get(
                `/audit-logs/${log._id}`
            );

            const data =
                response.data?.data || log;

            setSelectedLog(data);
            setShowViewModal(true);
        } catch (err) {
            console.error(
                "Fetch Audit Log Error:",
                err
            );

            setSelectedLog(log);
            setShowViewModal(true);
        }
    };

    // ========================================
    // PAGINATION
    // ========================================

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage((previous) => previous - 1);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage((previous) => previous + 1);
        }
    };

    // ========================================
    // PAGE NUMBERS
    // ========================================

    const pageNumbers = useMemo(() => {
        if (totalPages <= 1) {
            return [];
        }

        const pages = [];

        const start = Math.max(1, page - 2);
        const end = Math.min(
            totalPages,
            page + 2
        );

        for (
            let current = start;
            current <= end;
            current++
        ) {
            pages.push(current);
        }

        return pages;
    }, [page, totalPages]);

    // ========================================
    // RENDER
    // ========================================

    return (
        <div className="audit-logs-page">

            {/* ================================= */}
            {/* PAGE HEADER */}
            {/* ================================= */}

            <div className="audit-page-header">
                <div>
                    <div className="audit-title-row">
                        <FiActivity />

                        <h1>Audit Logs</h1>
                    </div>

                    <p>
                        Track important activities and
                        changes across the ERP system.
                    </p>
                </div>

                <button
                    type="button"
                    className="audit-refresh-btn"
                    onClick={() =>
                        fetchAuditLogs(true)
                    }
                    disabled={loading || refreshing}
                >
                    <FiRefreshCw
                        className={
                            refreshing
                                ? "audit-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {/* ================================= */}
            {/* SUMMARY */}
            {/* ================================= */}

            <div className="audit-summary-grid">

                <div className="audit-summary-card">
                    <div className="audit-summary-icon total">
                        <FiActivity />
                    </div>

                    <div>
                        <span>Total Logs</span>

                        <strong>
                            {summary.total}
                        </strong>
                    </div>
                </div>

                <div className="audit-summary-card">
                    <div className="audit-summary-icon success">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>Success</span>

                        <strong>
                            {
                                calculateCurrentSummary.success
                            }
                        </strong>
                    </div>
                </div>

                <div className="audit-summary-card">
                    <div className="audit-summary-icon failed">
                        <FiXCircle />
                    </div>

                    <div>
                        <span>Failed</span>

                        <strong>
                            {
                                calculateCurrentSummary.failed
                            }
                        </strong>
                    </div>
                </div>

                <div className="audit-summary-card">
                    <div className="audit-summary-icon activity">
                        <FiClock />
                    </div>

                    <div>
                        <span>Current Page</span>

                        <strong>
                            {logs.length}
                        </strong>
                    </div>
                </div>

            </div>

            {/* ================================= */}
            {/* FILTER CARD */}
            {/* ================================= */}

            <div className="audit-filter-card">

                <div className="audit-filter-header">
                    <div>
                        <FiFilter />

                        <span>
                            Filters
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={
                            handleResetFilters
                        }
                        className="audit-clear-btn"
                    >
                        Clear Filters
                    </button>
                </div>

                <div className="audit-filter-grid">

                    {/* Search */}

                    <div className="audit-filter-field search-field">
                        <label>
                            Search
                        </label>

                        <div className="audit-search-wrapper">
                            <FiSearch />

                            <input
                                type="text"
                                placeholder="Search description or reference..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* Action */}

                    <div className="audit-filter-field">
                        <label>
                            Action
                        </label>

                        <select
                            value={action}
                            onChange={(event) => {
                                setAction(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        >
                            <option value="">
                                All Actions
                            </option>

                            {ACTION_OPTIONS.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {formatLabel(item)}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Module */}

                    <div className="audit-filter-field">
                        <label>
                            Module
                        </label>

                        <select
                            value={module}
                            onChange={(event) => {
                                setModule(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        >
                            <option value="">
                                All Modules
                            </option>

                            {MODULE_OPTIONS.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {formatLabel(item)}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Status */}

                    <div className="audit-filter-field">
                        <label>
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        >
                            <option value="">
                                All Status
                            </option>

                            {STATUS_OPTIONS.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {formatLabel(item)}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* User */}

                    <div className="audit-filter-field">
                        <label>
                            User
                        </label>

                        <select
                            value={userId}
                            onChange={(event) => {
                                setUserId(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        >
                            <option value="">
                                All Users
                            </option>

                            {users.map((item) => (
                                <option
                                    key={item._id}
                                    value={item._id}
                                >
                                    {item.name ||
                                        item.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Branch */}

                    <div className="audit-filter-field">
                        <label>
                            Branch
                        </label>

                        <select
                            value={branchId}
                            onChange={(event) => {
                                setBranchId(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        >
                            <option value="">
                                All Branches
                            </option>

                            {branches.map((item) => (
                                <option
                                    key={item._id}
                                    value={item._id}
                                >
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}

                    <div className="audit-filter-field">
                        <label>
                            Start Date
                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => {
                                setStartDate(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* End Date */}

                    <div className="audit-filter-field">
                        <label>
                            End Date
                        </label>

                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => {
                                setEndDate(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        />
                    </div>

                </div>
            </div>

            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (
                <div className="audit-error">
                    <FiXCircle />

                    <span>{error}</span>
                </div>
            )}

            {/* ================================= */}
            {/* TABLE */}
            {/* ================================= */}

            <div className="audit-table-card">

                <div className="audit-table-header">
                    <div>
                        <h2>
                            Activity History
                        </h2>

                        <span>
                            {total} total records
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="audit-loading">
                        <FiRefreshCw className="audit-spin" />

                        <p>
                            Loading audit logs...
                        </p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="audit-empty">
                        <FiFileText />

                        <h3>
                            No audit logs found
                        </h3>

                        <p>
                            Try changing your filters
                            or search criteria.
                        </p>
                    </div>
                ) : (
                    <div className="audit-table-wrapper">
                        <table className="audit-table">

                            <thead>
                                <tr>
                                    <th>
                                        Date & Time
                                    </th>

                                    <th>
                                        User
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                    <th>
                                        Module
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Reference
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id}>

                                        <td>
                                            <div className="audit-date-cell">
                                                <FiCalendar />

                                                <span>
                                                    {formatDateTime(
                                                        log.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="audit-user-cell">
                                                <div className="audit-avatar">
                                                    <FiUser />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {log.user?.name ||
                                                            "System"}
                                                    </strong>

                                                    {log.user
                                                        ?.role && (
                                                        <small>
                                                            {
                                                                log.user
                                                                    .role
                                                            }
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`audit-action-badge action-${String(
                                                    log.action ||
                                                        ""
                                                ).toLowerCase()}`}
                                            >
                                                {formatLabel(
                                                    log.action
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="audit-module-badge">
                                                {formatLabel(
                                                    log.module
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="audit-description">
                                                {log.description ||
                                                    "-"}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="audit-reference">
                                                {log.referenceNumber ? (
                                                    <>
                                                        <strong>
                                                            {
                                                                log.referenceNumber
                                                            }
                                                        </strong>

                                                        <small>
                                                            {formatLabel(
                                                                log.referenceType
                                                            )}
                                                        </small>
                                                    </>
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`audit-status ${
                                                    log.status ===
                                                    "SUCCESS"
                                                        ? "success"
                                                        : "failed"
                                                }`}
                                            >
                                                {log.status ===
                                                "SUCCESS" ? (
                                                    <FiCheckCircle />
                                                ) : (
                                                    <FiXCircle />
                                                )}

                                                {formatLabel(
                                                    log.status
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="audit-view-btn"
                                                onClick={() =>
                                                    handleViewLog(
                                                        log
                                                    )
                                                }
                                                title="View audit log"
                                            >
                                                <FiEye />
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

                {/* ================================= */}
                {/* PAGINATION */}
                {/* ================================= */}

                {!loading &&
                    logs.length > 0 &&
                    totalPages > 0 && (
                        <div className="audit-pagination">

                            <div className="audit-pagination-info">
                                Showing{" "}
                                <strong>
                                    {(page - 1) *
                                        limit +
                                        1}
                                </strong>{" "}
                                to{" "}
                                <strong>
                                    {Math.min(
                                        page * limit,
                                        total
                                    )}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {total}
                                </strong>{" "}
                                records
                            </div>

                            <div className="audit-pagination-controls">

                                <button
                                    type="button"
                                    onClick={
                                        handlePreviousPage
                                    }
                                    disabled={page === 1}
                                >
                                    <FiChevronLeft />
                                </button>

                                {pageNumbers.map(
                                    (pageNumber) => (
                                        <button
                                            key={
                                                pageNumber
                                            }
                                            type="button"
                                            className={
                                                pageNumber ===
                                                page
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setPage(
                                                    pageNumber
                                                )
                                            }
                                        >
                                            {
                                                pageNumber
                                            }
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={
                                        handleNextPage
                                    }
                                    disabled={
                                        page ===
                                        totalPages
                                    }
                                >
                                    <FiChevronRight />
                                </button>

                            </div>
                        </div>
                    )}
            </div>

            {/* ================================= */}
            {/* VIEW MODAL */}
            {/* ================================= */}

            {showViewModal &&
                selectedLog && (
                    <div
                        className="audit-modal-overlay"
                        onClick={() =>
                            setShowViewModal(false)
                        }
                    >
                        <div
                            className="audit-view-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="audit-modal-header">

                                <div>
                                    <div className="audit-modal-title">
                                        <FiActivity />

                                        <h2>
                                            Audit Log Details
                                        </h2>
                                    </div>

                                    <span>
                                        {selectedLog._id}
                                    </span>
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

                            <div className="audit-detail-grid">

                                <div className="audit-detail-item">
                                    <span>
                                        Action
                                    </span>

                                    <strong>
                                        {formatLabel(
                                            selectedLog.action
                                        )}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Module
                                    </span>

                                    <strong>
                                        {formatLabel(
                                            selectedLog.module
                                        )}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Status
                                    </span>

                                    <strong
                                        className={
                                            selectedLog.status ===
                                            "SUCCESS"
                                                ? "detail-success"
                                                : "detail-failed"
                                        }
                                    >
                                        {formatLabel(
                                            selectedLog.status
                                        )}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Date & Time
                                    </span>

                                    <strong>
                                        {formatDateTime(
                                            selectedLog.createdAt
                                        )}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        User
                                    </span>

                                    <strong>
                                        {selectedLog.user
                                            ?.name ||
                                            "System"}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {selectedLog.user
                                            ?.email || "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Branch
                                    </span>

                                    <strong>
                                        {selectedLog.branch
                                            ?.name || "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Branch Code
                                    </span>

                                    <strong>
                                        {selectedLog.branch
                                            ?.branchCode || "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Reference Type
                                    </span>

                                    <strong>
                                        {formatLabel(
                                            selectedLog.referenceType
                                        )}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        Reference Number
                                    </span>

                                    <strong>
                                        {selectedLog.referenceNumber ||
                                            "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        IP Address
                                    </span>

                                    <strong>
                                        {selectedLog.ipAddress ||
                                            "-"}
                                    </strong>
                                </div>

                                <div className="audit-detail-item">
                                    <span>
                                        User Agent
                                    </span>

                                    <strong className="user-agent-value">
                                        {selectedLog.userAgent ||
                                            "-"}
                                    </strong>
                                </div>

                            </div>

                            <div className="audit-description-box">
                                <div className="audit-detail-section-title">
                                    <FiFileText />

                                    <span>
                                        Description
                                    </span>
                                </div>

                                <p>
                                    {selectedLog.description ||
                                        "-"}
                                </p>
                            </div>

                            {selectedLog.errorMessage && (
                                <div className="audit-error-box">
                                    <div>
                                        <FiXCircle />

                                        <span>
                                            Error Message
                                        </span>
                                    </div>

                                    <p>
                                        {
                                            selectedLog.errorMessage
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="audit-values-grid">

                                <div className="audit-json-section">
                                    <div className="audit-detail-section-title">
                                        <FiFileText />

                                        <span>
                                            Old Values
                                        </span>
                                    </div>

                                    <pre>
                                        {formatJson(
                                            selectedLog.oldValues
                                        )}
                                    </pre>
                                </div>

                                <div className="audit-json-section">
                                    <div className="audit-detail-section-title">
                                        <FiFileText />

                                        <span>
                                            New Values
                                        </span>
                                    </div>

                                    <pre>
                                        {formatJson(
                                            selectedLog.newValues
                                        )}
                                    </pre>
                                </div>

                            </div>

                            <div className="audit-metadata-section">
                                <div className="audit-detail-section-title">
                                    <FiGlobe />

                                    <span>
                                        Metadata
                                    </span>
                                </div>

                                <pre>
                                    {formatJson(
                                        selectedLog.metadata
                                    )}
                                </pre>
                            </div>

                            <div className="audit-modal-footer">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
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

export default AuditLogs;