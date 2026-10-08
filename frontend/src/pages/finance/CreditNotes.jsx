import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEye,
    FiXCircle,
    FiRefreshCw,
    FiFileText,
    FiUser,
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiAlertCircle,
    FiCheckCircle,
    FiPackage,
    FiHash,
    FiDollarSign,
    FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/creditNotes.css";

const CreditNotes = () => {
    // =====================================================
    // State
    // =====================================================

    const [creditNotes, setCreditNotes] = useState([]);

    const [salesReturns, setSalesReturns] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [masterLoading, setMasterLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [customerFilter, setCustomerFilter] = useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [showCancelModal, setShowCancelModal] =
        useState(false);

    const [selectedCreditNote, setSelectedCreditNote] =
        useState(null);

    const [selectedSalesReturn, setSelectedSalesReturn] =
        useState(null);

    const [cancelReason, setCancelReason] =
        useState("");

    const [formData, setFormData] = useState({
        salesReturn: "",
        creditNoteDate: new Date()
            .toISOString()
            .split("T")[0],
        reason: "",
        notes: "",
    });

    // =====================================================
    // Helpers
    // =====================================================

    const getId = (value) => {
        if (!value) return "";

        if (typeof value === "object") {
            return value._id || value.id || "";
        }

        return value;
    };

    const formatAmount = (value) => {
        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCustomerName = (customer) => {
        if (!customer) return "—";

        if (typeof customer === "string") {
            return customer;
        }

        return (
            customer.name ||
            customer.customerName ||
            customer.customerCode ||
            "Unknown Customer"
        );
    };

    const getCustomerId = (customer) => {
        return getId(customer);
    };

    const getSalesReturnNumber = (salesReturn) => {
        if (!salesReturn) return "—";

        if (typeof salesReturn === "string") {
            return salesReturn;
        }

        return (
            salesReturn.returnNumber ||
            salesReturn.returnNo ||
            "—"
        );
    };

    const getInvoiceNumber = (invoice) => {
        if (!invoice) return "—";

        if (typeof invoice === "string") {
            return invoice;
        }

        return (
            invoice.invoiceNumber ||
            invoice.invoiceNo ||
            "—"
        );
    };

    const getSalesOrderNumber = (order) => {
        if (!order) return "—";

        if (typeof order === "string") {
            return order;
        }

        return (
            order.salesOrderNumber ||
            order.orderNumber ||
            "—"
        );
    };

    const getStatusClass = (status) => {
        switch (String(status || "").toUpperCase()) {
            case "ISSUED":
                return "credit-status-issued";

            case "PARTIALLY_APPLIED":
                return "credit-status-partial";

            case "FULLY_APPLIED":
                return "credit-status-full";

            case "CANCELLED":
                return "credit-status-cancelled";

            case "DRAFT":
                return "credit-status-draft";

            default:
                return "credit-status-default";
        }
    };

    const getStatusLabel = (status) => {
        if (!status) return "UNKNOWN";

        return String(status)
            .replaceAll("_", " ")
            .toUpperCase();
    };

    // =====================================================
    // Fetch Master Data
    // =====================================================

    const fetchMasterData = async () => {
        try {
            setMasterLoading(true);
            setError("");

            const [
                salesReturnResponse,
                customerResponse,
            ] = await Promise.all([
                api.get("/sales-returns", {
                    params: {
                        limit: 100,
                        page: 1,
                    },
                }),

                api.get("/customers", {
                    params: {
                        limit: 100,
                        page: 1,
                        isActive: true,
                    },
                }),
            ]);

            // -----------------------------
            // Sales Returns
            // -----------------------------

            const salesReturnPayload =
                salesReturnResponse?.data;

            let returnData =
                salesReturnPayload?.data;

            if (Array.isArray(returnData)) {
                // Already array
            } else if (
                Array.isArray(
                    returnData?.salesReturns
                )
            ) {
                returnData =
                    returnData.salesReturns;
            } else if (
                Array.isArray(
                    salesReturnPayload?.salesReturns
                )
            ) {
                returnData =
                    salesReturnPayload.salesReturns;
            } else {
                returnData = [];
            }

            setSalesReturns(returnData);

            // -----------------------------
            // Customers
            // -----------------------------

            const customerPayload =
                customerResponse?.data;

            let customerData =
                customerPayload?.data;

            if (Array.isArray(customerData)) {
                // Already array
            } else if (
                Array.isArray(
                    customerData?.customers
                )
            ) {
                customerData =
                    customerData.customers;
            } else if (
                Array.isArray(
                    customerPayload?.customers
                )
            ) {
                customerData =
                    customerPayload.customers;
            } else {
                customerData = [];
            }

            setCustomers(customerData);
        } catch (err) {
            console.error(
                "Credit Note Master Data Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load Credit Note master data."
            );
        } finally {
            setMasterLoading(false);
        }
    };

    // =====================================================
    // Fetch Credit Notes
    // =====================================================

    const fetchCreditNotes = async (
        currentPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: currentPage,
                limit: 10,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            if (customerFilter) {
                params.customer = customerFilter;
            }

            const response = await api.get(
                "/credit-notes",
                {
                    params,
                }
            );

            const payload = response?.data;

            const data =
                payload?.data;

            let notes = [];

            if (Array.isArray(data)) {
                notes = data;
            } else if (
                Array.isArray(
                    data?.creditNotes
                )
            ) {
                notes = data.creditNotes;
            } else if (
                Array.isArray(
                    payload?.creditNotes
                )
            ) {
                notes = payload.creditNotes;
            }

            setCreditNotes(notes);

            const responsePagination =
                data?.pagination ||
                payload?.pagination;

            setPagination({
                total:
                    Number(
                        responsePagination?.total
                    ) || 0,

                page:
                    Number(
                        responsePagination?.page
                    ) || currentPage,

                limit:
                    Number(
                        responsePagination?.limit
                    ) || 10,

                totalPages:
                    Number(
                        responsePagination?.totalPages
                    ) || 0,
            });
        } catch (err) {
            console.error(
                "Credit Notes Fetch Error:",
                err
            );

            setCreditNotes([]);

            setError(
                err?.response?.data?.message ||
                    "Failed to fetch Credit Notes."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        fetchCreditNotes(page);
    }, [
        page,
        statusFilter,
        customerFilter,
    ]);

    // =====================================================
    // Search Submit
    // =====================================================

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        if (page !== 1) {
            setPage(1);
        } else {
            fetchCreditNotes(1);
        }
    };

    // =====================================================
    // Create Modal
    // =====================================================

    const openCreateModal = () => {
        setError("");
        setSuccess("");

        setSelectedSalesReturn(null);

        setFormData({
            salesReturn: "",
            creditNoteDate: new Date()
                .toISOString()
                .split("T")[0],
            reason: "",
            notes: "",
        });

        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        if (saving) return;

        setShowCreateModal(false);
        setSelectedSalesReturn(null);
    };

    // =====================================================
    // Sales Return Eligibility
    // =====================================================

    const eligibleSalesReturns = useMemo(() => {
        return salesReturns.filter((item) => {
            const status = String(
                item.status || ""
            ).toUpperCase();

            const settlementType = String(
                item.settlementType || ""
            ).toUpperCase();

            const creditAmount =
                Number(item.creditAmount || 0);

            return (
                status === "PROCESSED" &&
                settlementType ===
                    "CREDIT_NOTE" &&
                creditAmount > 0
            );
        });
    }, [salesReturns]);

    // =====================================================
    // Select Sales Return
    // =====================================================

    const handleSalesReturnChange = (e) => {
        const salesReturnId = e.target.value;

        setFormData((prev) => ({
            ...prev,
            salesReturn: salesReturnId,
        }));

        if (!salesReturnId) {
            setSelectedSalesReturn(null);
            return;
        }

        const selected =
            salesReturns.find(
                (item) =>
                    String(getId(item)) ===
                    String(salesReturnId)
            );

        setSelectedSalesReturn(
            selected || null
        );

        if (selected) {
            setFormData((prev) => ({
                ...prev,
                reason:
                    prev.reason ||
                    selected.reason ||
                    "",
                notes:
                    prev.notes ||
                    selected.notes ||
                    "",
            }));
        }
    };

    // =====================================================
    // Create Credit Note
    // =====================================================

    const handleCreateCreditNote = async (
        e
    ) => {
        e.preventDefault();

        if (!formData.salesReturn) {
            setError(
                "Please select a Sales Return."
            );
            return;
        }

        if (!formData.creditNoteDate) {
            setError(
                "Credit Note date is required."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                salesReturn:
                    formData.salesReturn,

                creditNoteDate:
                    formData.creditNoteDate,

                reason:
                    formData.reason.trim(),

                notes:
                    formData.notes.trim(),
            };

            const response = await api.post(
                "/credit-notes",
                payload
            );

            const created =
                response?.data?.data
                    ?.creditNote;

            setShowCreateModal(false);
            setSelectedSalesReturn(null);

            setFormData({
                salesReturn: "",
                creditNoteDate: new Date()
                    .toISOString()
                    .split("T")[0],
                reason: "",
                notes: "",
            });

            setSuccess(
                created?.creditNoteNumber
                    ? `Credit Note ${created.creditNoteNumber} created successfully.`
                    : "Credit Note created successfully."
            );

            setPage(1);

            await fetchCreditNotes(1);
            await fetchMasterData();
        } catch (err) {
            console.error(
                "Create Credit Note Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to create Credit Note."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // View Credit Note
    // =====================================================

    const handleView = async (creditNote) => {
        try {
            setError("");

            const id = getId(creditNote);

            if (!id) {
                setError(
                    "Credit Note ID is missing."
                );
                return;
            }

            const response = await api.get(
                `/credit-notes/${id}`
            );

            const fullCreditNote =
                response?.data?.data
                    ?.creditNote ||
                response?.data?.creditNote;

            if (!fullCreditNote) {
                throw new Error(
                    "Credit Note details not found."
                );
            }

            setSelectedCreditNote(
                fullCreditNote
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View Credit Note Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Failed to load Credit Note details."
            );
        }
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedCreditNote(null);
    };

    // =====================================================
    // Cancel Modal
    // =====================================================

    const openCancelModal = (creditNote) => {
        setSelectedCreditNote(
            creditNote
        );

        setCancelReason("");

        setError("");

        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        if (saving) return;

        setShowCancelModal(false);
        setCancelReason("");
    };

    // =====================================================
    // Cancel Credit Note
    // =====================================================

    const handleCancelCreditNote = async (
        e
    ) => {
        e.preventDefault();

        if (!selectedCreditNote) {
            return;
        }

        if (!cancelReason.trim()) {
            setError(
                "Cancellation reason is required."
            );
            return;
        }

        const appliedAmount =
            Number(
                selectedCreditNote.appliedAmount
            ) || 0;

        if (appliedAmount > 0) {
            setError(
                "Applied Credit Note cannot be cancelled."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const id =
                getId(selectedCreditNote);

            await api.patch(
                `/credit-notes/${id}/cancel`,
                {
                    cancellationReason:
                        cancelReason.trim(),
                }
            );

            setShowCancelModal(false);
            setCancelReason("");

            setSuccess(
                "Credit Note cancelled successfully."
            );

            await fetchCreditNotes(page);

            if (showViewModal) {
                setShowViewModal(false);
                setSelectedCreditNote(
                    null
                );
            }
        } catch (err) {
            console.error(
                "Cancel Credit Note Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to cancel Credit Note."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // Pagination
    // =====================================================

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (
            pagination.totalPages &&
            page < pagination.totalPages
        ) {
            setPage((prev) => prev + 1);
        }
    };

    // =====================================================
    // Refresh
    // =====================================================

    const handleRefresh = async () => {
        setError("");
        setSuccess("");

        await Promise.all([
            fetchCreditNotes(page),
            fetchMasterData(),
        ]);
    };

    // =====================================================
    // Selected Sales Return Details
    // =====================================================

    const selectedReturnCustomer =
        selectedSalesReturn?.customer;

    const selectedReturnInvoice =
        selectedSalesReturn?.salesInvoice;

    const selectedReturnOrder =
        selectedSalesReturn?.salesOrder;

    // =====================================================
    // Render
    // =====================================================

    return (
        <div className="credit-notes-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="credit-notes-header">

                <div className="credit-notes-header-left">

                    <div className="credit-notes-title-icon">
                        <FiFileText />
                    </div>

                    <div>
                        <h1>Credit Notes</h1>

                        <p>
                            Manage customer credit notes
                            generated from sales returns
                        </p>
                    </div>
                </div>

                <div className="credit-notes-header-actions">

                    <button
                        type="button"
                        className="credit-btn credit-btn-secondary"
                        onClick={handleRefresh}
                        disabled={
                            loading ||
                            masterLoading
                        }
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "credit-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        className="credit-btn credit-btn-primary"
                        onClick={
                            openCreateModal
                        }
                    >
                        <FiPlus />

                        Create Credit Note
                    </button>
                </div>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="credit-alert credit-alert-error">
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

            {success && !error && (
                <div className="credit-alert credit-alert-success">
                    <FiCheckCircle />

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

            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="credit-filter-card">

                <form
                    className="credit-filter-form"
                    onSubmit={
                        handleSearchSubmit
                    }
                >

                    <div className="credit-search-box">

                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search credit note number..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="DRAFT">
                            Draft
                        </option>

                        <option value="ISSUED">
                            Issued
                        </option>

                        <option value="PARTIALLY_APPLIED">
                            Partially Applied
                        </option>

                        <option value="FULLY_APPLIED">
                            Fully Applied
                        </option>

                        <option value="CANCELLED">
                            Cancelled
                        </option>
                    </select>

                    <select
                        value={customerFilter}
                        onChange={(e) => {
                            setCustomerFilter(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Customers
                        </option>

                        {customers.map(
                            (customer) => (
                                <option
                                    key={getId(
                                        customer
                                    )}
                                    value={getId(
                                        customer
                                    )}
                                >
                                    {getCustomerName(
                                        customer
                                    )}
                                </option>
                            )
                        )}
                    </select>

                    <button
                        type="submit"
                        className="credit-filter-search-btn"
                    >
                        <FiSearch />

                        Search
                    </button>

                    {(search ||
                        statusFilter ||
                        customerFilter) && (
                        <button
                            type="button"
                            className="credit-clear-filter-btn"
                            onClick={() => {
                                setSearch("");
                                setStatusFilter(
                                    ""
                                );
                                setCustomerFilter(
                                    ""
                                );
                                setPage(1);
                            }}
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* =================================================
                TABLE CARD
            ================================================= */}

            <div className="credit-table-card">

                <div className="credit-table-header">

                    <div>
                        <h2>
                            Credit Note List
                        </h2>

                        <p>
                            {pagination.total} total
                            credit note
                            {pagination.total !==
                            1
                                ? "s"
                                : ""}
                        </p>
                    </div>

                    <div className="credit-table-summary">

                        <span>
                            Page{" "}
                            {pagination.page ||
                                page}{" "}
                            of{" "}
                            {pagination.totalPages ||
                                1}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="credit-loading">
                        <FiRefreshCw className="credit-spin" />

                        <span>
                            Loading Credit Notes...
                        </span>
                    </div>
                ) : creditNotes.length ===
                  0 ? (
                    <div className="credit-empty">

                        <FiFileText />

                        <h3>
                            No Credit Notes Found
                        </h3>

                        <p>
                            No credit notes match the
                            selected filters.
                        </p>

                        <button
                            type="button"
                            className="credit-btn credit-btn-primary"
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />

                            Create Credit Note
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="credit-table-wrapper">

                            <table className="credit-table">

                                <thead>
                                    <tr>
                                        <th>
                                            Credit Note
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Customer
                                        </th>

                                        <th>
                                            Sales Return
                                        </th>

                                        <th>
                                            Invoice
                                        </th>

                                        <th>
                                            Amount
                                        </th>

                                        <th>
                                            Applied
                                        </th>

                                        <th>
                                            Remaining
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th className="credit-actions-column">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {creditNotes.map(
                                        (
                                            creditNote
                                        ) => {
                                            const applied =
                                                Number(
                                                    creditNote.appliedAmount
                                                ) ||
                                                0;

                                            const remaining =
                                                Number(
                                                    creditNote.remainingAmount
                                                ) ||
                                                0;

                                            return (
                                                <tr
                                                    key={getId(
                                                        creditNote
                                                    )}
                                                >

                                                    <td>
                                                        <div className="credit-note-number">
                                                            <FiHash />

                                                            <strong>
                                                                {
                                                                    creditNote.creditNoteNumber
                                                                }
                                                            </strong>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="credit-date">
                                                            <FiCalendar />

                                                            {formatDate(
                                                                creditNote.creditNoteDate
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="credit-customer">
                                                            <div className="credit-customer-icon">
                                                                <FiUser />
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {getCustomerName(
                                                                        creditNote.customer
                                                                    )}
                                                                </strong>

                                                                {creditNote
                                                                    .customer
                                                                    ?.customerCode && (
                                                                    <small>
                                                                        {
                                                                            creditNote
                                                                                .customer
                                                                                .customerCode
                                                                        }
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="credit-reference-link">
                                                            {getSalesReturnNumber(
                                                                creditNote.salesReturn
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="credit-reference-link">
                                                            {getInvoiceNumber(
                                                                creditNote.salesInvoice
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <strong className="credit-amount">
                                                            ₹{" "}
                                                            {formatAmount(
                                                                creditNote.grandTotal
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <span className="credit-applied-amount">
                                                            ₹{" "}
                                                            {formatAmount(
                                                                applied
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="credit-remaining-amount">
                                                            ₹{" "}
                                                            {formatAmount(
                                                                remaining
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`credit-status-badge ${getStatusClass(
                                                                creditNote.status
                                                            )}`}
                                                        >
                                                            {
                                                                getStatusLabel(
                                                                    creditNote.status
                                                                )
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="credit-row-actions">

                                                            <button
                                                                type="button"
                                                                className="credit-icon-btn credit-view-btn"
                                                                title="View"
                                                                onClick={() =>
                                                                    handleView(
                                                                        creditNote
                                                                    )
                                                                }
                                                            >
                                                                <FiEye />
                                                            </button>

                                                            {String(
                                                                creditNote.status
                                                            ).toUpperCase() !==
                                                                "CANCELLED" &&
                                                                applied <=
                                                                    0 && (
                                                                    <button
                                                                        type="button"
                                                                        className="credit-icon-btn credit-cancel-btn"
                                                                        title="Cancel"
                                                                        onClick={() =>
                                                                            openCancelModal(
                                                                                creditNote
                                                                            )
                                                                        }
                                                                    >
                                                                        <FiXCircle />
                                                                    </button>
                                                                )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}

                        <div className="credit-pagination">

                            <div className="credit-pagination-info">
                                Showing{" "}
                                <strong>
                                    {creditNotes.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        pagination.total
                                    }
                                </strong>{" "}
                                credit notes
                            </div>

                            <div className="credit-pagination-controls">

                                <button
                                    type="button"
                                    onClick={
                                        handlePreviousPage
                                    }
                                    disabled={
                                        page <= 1
                                    }
                                >
                                    <FiChevronLeft />

                                    Previous
                                </button>

                                <span>
                                    {page}
                                </span>

                                <button
                                    type="button"
                                    onClick={
                                        handleNextPage
                                    }
                                    disabled={
                                        !pagination.totalPages ||
                                        page >=
                                            pagination.totalPages
                                    }
                                >
                                    Next

                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* =================================================
                CREATE MODAL
            ================================================= */}

            {showCreateModal && (
                <div
                    className="credit-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeCreateModal();
                        }
                    }}
                >
                    <div className="credit-modal credit-create-modal">

                        <div className="credit-modal-header">

                            <div>
                                <h2>
                                    Create Credit Note
                                </h2>

                                <p>
                                    Generate a Credit Note
                                    from a processed Sales
                                    Return
                                </p>
                            </div>

                            <button
                                type="button"
                                className="credit-modal-close"
                                onClick={
                                    closeCreateModal
                                }
                            >
                                <FiX />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleCreateCreditNote
                            }
                            className="credit-create-form"
                        >

                            <div className="credit-modal-body">

                                {/* ---------------------------------
                                    Sales Return
                                --------------------------------- */}

                                <div className="credit-form-section">

                                    <div className="credit-section-title">
                                        <FiFileText />

                                        <span>
                                            Sales Return
                                            Reference
                                        </span>
                                    </div>

                                    <div className="credit-form-grid">

                                        <div className="credit-form-group credit-form-full">

                                            <label>
                                                Sales Return
                                                <span>*</span>
                                            </label>

                                            <select
                                                value={
                                                    formData.salesReturn
                                                }
                                                onChange={
                                                    handleSalesReturnChange
                                                }
                                                disabled={
                                                    masterLoading ||
                                                    saving
                                                }
                                            >
                                                <option value="">
                                                    Select processed
                                                    Sales Return
                                                </option>

                                                {eligibleSalesReturns.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={getId(
                                                                item
                                                            )}
                                                            value={getId(
                                                                item
                                                            )}
                                                        >
                                                            {getSalesReturnNumber(
                                                                item
                                                            )}{" "}
                                                            — ₹{" "}
                                                            {formatAmount(
                                                                item.grandTotal
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            {eligibleSalesReturns.length ===
                                                0 && (
                                                <small className="credit-form-hint">
                                                    No eligible
                                                    processed Sales
                                                    Returns with
                                                    CREDIT_NOTE
                                                    settlement were
                                                    found.
                                                </small>
                                            )}
                                        </div>

                                        <div className="credit-form-group">

                                            <label>
                                                Credit Note Date
                                                <span>*</span>
                                            </label>

                                            <div className="credit-date-field">
                                                <FiCalendar />

                                                <input
                                                    type="date"
                                                    value={
                                                        formData.creditNoteDate
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setFormData(
                                                            (
                                                                prev
                                                            ) => ({
                                                                ...prev,
                                                                creditNoteDate:
                                                                    e
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="credit-form-group">

                                            <label>
                                                Settlement Type
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    selectedSalesReturn?.settlementType ||
                                                    ""
                                                }
                                                placeholder="—"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ---------------------------------
                                    Return Preview
                                --------------------------------- */}

                                {selectedSalesReturn && (
                                    <div className="credit-preview-card">

                                        <div className="credit-preview-header">

                                            <div>
                                                <h3>
                                                    Return
                                                    Details
                                                </h3>

                                                <span>
                                                    {
                                                        getSalesReturnNumber(
                                                            selectedSalesReturn
                                                        )
                                                    }
                                                </span>
                                            </div>

                                            <span className="credit-status-badge credit-status-issued">
                                                PROCESSED
                                            </span>
                                        </div>

                                        <div className="credit-preview-grid">

                                            <div>
                                                <span>
                                                    Customer
                                                </span>

                                                <strong>
                                                    {getCustomerName(
                                                        selectedReturnCustomer
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Invoice
                                                </span>

                                                <strong>
                                                    {getInvoiceNumber(
                                                        selectedReturnInvoice
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Sales Order
                                                </span>

                                                <strong>
                                                    {getSalesOrderNumber(
                                                        selectedReturnOrder
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Return Total
                                                </span>

                                                <strong>
                                                    ₹{" "}
                                                    {formatAmount(
                                                        selectedSalesReturn.grandTotal
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Credit Amount
                                                </span>

                                                <strong className="credit-preview-highlight">
                                                    ₹{" "}
                                                    {formatAmount(
                                                        selectedSalesReturn.creditAmount
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Return Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        selectedSalesReturn.returnDate ||
                                                            selectedSalesReturn.createdAt
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ---------------------------------
                                    Items
                                --------------------------------- */}

                                {selectedSalesReturn?.items?.length >
                                    0 && (
                                    <div className="credit-form-section">

                                        <div className="credit-section-title">
                                            <FiPackage />

                                            <span>
                                                Return Items
                                            </span>
                                        </div>

                                        <div className="credit-items-wrapper">

                                            <table className="credit-items-table">

                                                <thead>
                                                    <tr>
                                                        <th>
                                                            Product
                                                        </th>

                                                        <th>
                                                            Qty
                                                        </th>

                                                        <th>
                                                            Unit Price
                                                        </th>

                                                        <th>
                                                            Discount
                                                        </th>

                                                        <th>
                                                            Tax
                                                        </th>

                                                        <th>
                                                            Line Total
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {selectedSalesReturn.items.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    item._id ||
                                                                    index
                                                                }
                                                            >
                                                                <td>
                                                                    <strong>
                                                                        {item
                                                                            .product
                                                                            ?.name ||
                                                                            item.description ||
                                                                            "Product"}
                                                                    </strong>

                                                                    {item
                                                                        .product
                                                                        ?.sku && (
                                                                        <small>
                                                                            {
                                                                                item
                                                                                    .product
                                                                                    .sku
                                                                            }
                                                                        </small>
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </td>

                                                                <td>
                                                                    ₹{" "}
                                                                    {formatAmount(
                                                                        item.unitPrice
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    ₹{" "}
                                                                    {formatAmount(
                                                                        item.discountAmount
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    ₹{" "}
                                                                    {formatAmount(
                                                                        item.taxAmount
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    <strong>
                                                                        ₹{" "}
                                                                        {formatAmount(
                                                                            item.lineTotal
                                                                        )}
                                                                    </strong>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* ---------------------------------
                                    Reason / Notes
                                --------------------------------- */}

                                <div className="credit-form-section">

                                    <div className="credit-section-title">
                                        <FiFileText />

                                        <span>
                                            Credit Note Details
                                        </span>
                                    </div>

                                    <div className="credit-form-grid">

                                        <div className="credit-form-group credit-form-full">

                                            <label>
                                                Reason
                                            </label>

                                            <textarea
                                                rows="3"
                                                value={
                                                    formData.reason
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setFormData(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            reason:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                placeholder="Enter credit note reason..."
                                                disabled={
                                                    saving
                                                }
                                            />
                                        </div>

                                        <div className="credit-form-group credit-form-full">

                                            <label>
                                                Notes
                                            </label>

                                            <textarea
                                                rows="3"
                                                value={
                                                    formData.notes
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setFormData(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            notes:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                placeholder="Additional notes..."
                                                disabled={
                                                    saving
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="credit-modal-footer">

                                <button
                                    type="button"
                                    className="credit-btn credit-btn-secondary"
                                    onClick={
                                        closeCreateModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="credit-btn credit-btn-primary"
                                    disabled={
                                        saving ||
                                        !formData.salesReturn
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FiRefreshCw className="credit-spin" />

                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus />

                                            Create Credit
                                            Note
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {showViewModal &&
                selectedCreditNote && (
                    <div
                        className="credit-modal-overlay"
                        onMouseDown={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >
                        <div className="credit-modal credit-view-modal">

                            <div className="credit-modal-header">

                                <div>
                                    <h2>
                                        Credit Note Details
                                    </h2>

                                    <p>
                                        {
                                            selectedCreditNote.creditNoteNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="credit-modal-close"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="credit-modal-body">

                                {/* Header Info */}

                                <div className="credit-detail-top">

                                    <div className="credit-detail-number">
                                        <span>
                                            Credit Note
                                        </span>

                                        <strong>
                                            {
                                                selectedCreditNote.creditNoteNumber
                                            }
                                        </strong>
                                    </div>

                                    <span
                                        className={`credit-status-badge ${getStatusClass(
                                            selectedCreditNote.status
                                        )}`}
                                    >
                                        {getStatusLabel(
                                            selectedCreditNote.status
                                        )}
                                    </span>
                                </div>

                                {/* Main Details */}

                                <div className="credit-detail-grid">

                                    <div className="credit-detail-box">

                                        <span>
                                            Credit Note Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedCreditNote.creditNoteDate
                                            )}
                                        </strong>
                                    </div>

                                    <div className="credit-detail-box">

                                        <span>
                                            Customer
                                        </span>

                                        <strong>
                                            {getCustomerName(
                                                selectedCreditNote.customer
                                            )}
                                        </strong>

                                        {selectedCreditNote
                                            .customer
                                            ?.customerCode && (
                                            <small>
                                                {
                                                    selectedCreditNote
                                                        .customer
                                                        .customerCode
                                                }
                                            </small>
                                        )}
                                    </div>

                                    <div className="credit-detail-box">

                                        <span>
                                            Sales Return
                                        </span>

                                        <strong>
                                            {getSalesReturnNumber(
                                                selectedCreditNote.salesReturn
                                            )}
                                        </strong>
                                    </div>

                                    <div className="credit-detail-box">

                                        <span>
                                            Sales Invoice
                                        </span>

                                        <strong>
                                            {getInvoiceNumber(
                                                selectedCreditNote.salesInvoice
                                            )}
                                        </strong>
                                    </div>

                                    <div className="credit-detail-box">

                                        <span>
                                            Sales Order
                                        </span>

                                        <strong>
                                            {getSalesOrderNumber(
                                                selectedCreditNote.salesOrder
                                            )}
                                        </strong>
                                    </div>

                                    <div className="credit-detail-box">

                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {selectedCreditNote
                                                .branch
                                                ?.name ||
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                                {/* Amount Summary */}

                                <div className="credit-amount-summary">

                                    <div>
                                        <span>
                                            Subtotal
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.subtotal
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Discount
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.discountAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Taxable
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.taxableAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Tax
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.taxAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="credit-grand-total">

                                        <span>
                                            Grand Total
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.grandTotal
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Applied
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.appliedAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="credit-remaining-box">

                                        <span>
                                            Remaining
                                        </span>

                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedCreditNote.remainingAmount
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                {/* Items */}

                                <div className="credit-detail-section">

                                    <div className="credit-section-title">
                                        <FiPackage />

                                        <span>
                                            Credit Note Items
                                        </span>
                                    </div>

                                    <div className="credit-items-wrapper">

                                        <table className="credit-items-table">

                                            <thead>
                                                <tr>
                                                    <th>
                                                        Product
                                                    </th>

                                                    <th>
                                                        Qty
                                                    </th>

                                                    <th>
                                                        Unit Price
                                                    </th>

                                                    <th>
                                                        Discount
                                                    </th>

                                                    <th>
                                                        Taxable
                                                    </th>

                                                    <th>
                                                        Tax
                                                    </th>

                                                    <th>
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {selectedCreditNote.items?.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                item._id ||
                                                                index
                                                            }
                                                        >
                                                            <td>
                                                                <strong>
                                                                    {item
                                                                        .product
                                                                        ?.name ||
                                                                        item.description ||
                                                                        "Product"}
                                                                </strong>

                                                                {item
                                                                    .product
                                                                    ?.sku && (
                                                                    <small>
                                                                        {
                                                                            item
                                                                                .product
                                                                                .sku
                                                                        }
                                                                    </small>
                                                                )}
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.quantity
                                                                }
                                                            </td>

                                                            <td>
                                                                ₹{" "}
                                                                {formatAmount(
                                                                    item.unitPrice
                                                                )}
                                                            </td>

                                                            <td>
                                                                ₹{" "}
                                                                {formatAmount(
                                                                    item.discountAmount
                                                                )}
                                                            </td>

                                                            <td>
                                                                ₹{" "}
                                                                {formatAmount(
                                                                    item.taxableAmount
                                                                )}
                                                            </td>

                                                            <td>
                                                                ₹{" "}
                                                                {formatAmount(
                                                                    item.taxAmount
                                                                )}
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    ₹{" "}
                                                                    {formatAmount(
                                                                        item.lineTotal
                                                                    )}
                                                                </strong>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Reason / Notes */}

                                {(selectedCreditNote.reason ||
                                    selectedCreditNote.notes) && (
                                    <div className="credit-detail-grid">

                                        {selectedCreditNote.reason && (
                                            <div className="credit-text-detail">

                                                <span>
                                                    Reason
                                                </span>

                                                <p>
                                                    {
                                                        selectedCreditNote.reason
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {selectedCreditNote.notes && (
                                            <div className="credit-text-detail">

                                                <span>
                                                    Notes
                                                </span>

                                                <p>
                                                    {
                                                        selectedCreditNote.notes
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Audit */}

                                <div className="credit-audit-section">

                                    <div>
                                        <span>
                                            Created
                                        </span>

                                        <strong>
                                            {formatDateTime(
                                                selectedCreditNote.createdAt
                                            )}
                                        </strong>

                                        {selectedCreditNote
                                            .createdBy
                                            ?.name && (
                                            <small>
                                                by{" "}
                                                {
                                                    selectedCreditNote
                                                        .createdBy
                                                        .name
                                                }
                                            </small>
                                        )}
                                    </div>

                                    <div>
                                        <span>
                                            Issued
                                        </span>

                                        <strong>
                                            {formatDateTime(
                                                selectedCreditNote.issuedAt
                                            )}
                                        </strong>

                                        {selectedCreditNote
                                            .issuedBy
                                            ?.name && (
                                            <small>
                                                by{" "}
                                                {
                                                    selectedCreditNote
                                                        .issuedBy
                                                        .name
                                                }
                                            </small>
                                        )}
                                    </div>

                                    {selectedCreditNote.cancelledAt && (
                                        <div>
                                            <span>
                                                Cancelled
                                            </span>

                                            <strong>
                                                {formatDateTime(
                                                    selectedCreditNote.cancelledAt
                                                )}
                                            </strong>

                                            {selectedCreditNote
                                                .cancelledBy
                                                ?.name && (
                                                <small>
                                                    by{" "}
                                                    {
                                                        selectedCreditNote
                                                            .cancelledBy
                                                            .name
                                                    }
                                                </small>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedCreditNote.cancellationReason && (
                                    <div className="credit-cancellation-box">

                                        <FiAlertCircle />

                                        <div>
                                            <strong>
                                                Cancellation
                                                Reason
                                            </strong>

                                            <p>
                                                {
                                                    selectedCreditNote.cancellationReason
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="credit-modal-footer">

                                {String(
                                    selectedCreditNote.status
                                ).toUpperCase() !==
                                    "CANCELLED" &&
                                    Number(
                                        selectedCreditNote.appliedAmount ||
                                            0
                                    ) <= 0 && (
                                        <button
                                            type="button"
                                            className="credit-btn credit-btn-danger"
                                            onClick={() =>
                                                openCancelModal(
                                                    selectedCreditNote
                                                )
                                            }
                                        >
                                            <FiXCircle />

                                            Cancel Credit
                                            Note
                                        </button>
                                    )}

                                <button
                                    type="button"
                                    className="credit-btn credit-btn-secondary"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                CANCEL MODAL
            ================================================= */}

            {showCancelModal &&
                selectedCreditNote && (
                    <div
                        className="credit-modal-overlay credit-cancel-overlay"
                        onMouseDown={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                closeCancelModal();
                            }
                        }}
                    >
                        <div className="credit-modal credit-cancel-modal">

                            <div className="credit-modal-header">

                                <div>
                                    <h2>
                                        Cancel Credit Note
                                    </h2>

                                    <p>
                                        {
                                            selectedCreditNote.creditNoteNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="credit-modal-close"
                                    onClick={
                                        closeCancelModal
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    handleCancelCreditNote
                                }
                            >

                                <div className="credit-modal-body">

                                    <div className="credit-cancel-warning">

                                        <FiAlertCircle />

                                        <div>
                                            <strong>
                                                This action will
                                                cancel the Credit
                                                Note.
                                            </strong>

                                            <p>
                                                Cancelled Credit
                                                Notes are retained
                                                for accounting
                                                records and cannot
                                                be deleted.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="credit-cancel-summary">

                                        <div>
                                            <span>
                                                Credit Note
                                            </span>

                                            <strong>
                                                {
                                                    selectedCreditNote.creditNoteNumber
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Amount
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatAmount(
                                                    selectedCreditNote.grandTotal
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Applied Amount
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatAmount(
                                                    selectedCreditNote.appliedAmount
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="credit-form-group credit-cancel-reason">

                                        <label>
                                            Cancellation Reason
                                            <span>*</span>
                                        </label>

                                        <textarea
                                            rows="5"
                                            value={
                                                cancelReason
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setCancelReason(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Enter the reason for cancelling this Credit Note..."
                                            disabled={
                                                saving
                                            }
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="credit-modal-footer">

                                    <button
                                        type="button"
                                        className="credit-btn credit-btn-secondary"
                                        onClick={
                                            closeCancelModal
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Keep Credit
                                        Note
                                    </button>

                                    <button
                                        type="submit"
                                        className="credit-btn credit-btn-danger"
                                        disabled={
                                            saving ||
                                            !cancelReason.trim()
                                        }
                                    >
                                        {saving ? (
                                            <>
                                                <FiRefreshCw className="credit-spin" />

                                                Cancelling...
                                            </>
                                        ) : (
                                            <>
                                                <FiXCircle />

                                                Confirm
                                                Cancellation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default CreditNotes;