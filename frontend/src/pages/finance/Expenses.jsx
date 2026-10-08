import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiX,
    FiCheck,
    FiSend,
    FiCreditCard,
    FiAlertCircle,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiDollarSign,
    FiCalendar,
    FiFilter,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/expenses.css";

const PAYMENT_METHODS = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
];

const initialForm = {
    company: "",
    branch: "",
    category: "",
    expenseDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "CASH",
    paidFrom: "",
    supplier: "",
    description: "",
    referenceNumber: "",
    notes: "",
};

const getId = (item) => item?._id || item?.id || "";

const getList = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
        if (Array.isArray(payload?.[key])) {
            return payload[key];
        }
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatAmount = (amount) => {
    const value = Number(amount || 0);

    return value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getPaymentLabel = (value) => {
    const method = PAYMENT_METHODS.find(
        (item) => item.value === value
    );

    return method?.label || value || "-";
};

const getStatusLabel = (value) => {
    const status = STATUS_OPTIONS.find(
        (item) => item.value === value
    );

    return status?.label || value || "-";
};

const getErrorMessage = (error, fallback) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};

const Expenses = () => {
    // ======================================================
    // MASTER DATA
    // ======================================================

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // ======================================================
    // EXPENSE DATA
    // ======================================================

    const [expenses, setExpenses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ======================================================
    // FILTERS
    // ======================================================

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentMethodFilter, setPaymentMethodFilter] =
        useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // ======================================================
    // PAGINATION
    // ======================================================

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    // ======================================================
    // MODALS
    // ======================================================

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingExpense, setEditingExpense] =
        useState(null);

    const [selectedExpense, setSelectedExpense] =
        useState(null);

    // ======================================================
    // REJECTION MODAL
    // ======================================================

    const [showRejectModal, setShowRejectModal] =
        useState(false);

    const [rejectingExpense, setRejectingExpense] =
        useState(null);

    const [rejectionReason, setRejectionReason] =
        useState("");

    // ======================================================
    // FORM
    // ======================================================

    const [formData, setFormData] =
        useState(initialForm);

    // ======================================================
    // FETCH MASTER DATA
    // ======================================================

    const fetchMasterData = async () => {
        try {
            const [
                companiesResponse,
                branchesResponse,
                suppliersResponse,
            ] = await Promise.all([
                api.get("/companies"),
                api.get("/branches"),
                api.get("/suppliers"),
            ]);

            const companyPayload =
                companiesResponse?.data || {};

            const branchPayload =
                branchesResponse?.data || {};

            const supplierPayload =
                suppliersResponse?.data || {};

            setCompanies(
                getList(companyPayload, [
                    "companies",
                ])
            );

            setBranches(
                getList(branchPayload, [
                    "branches",
                ])
            );

            setSuppliers(
                getList(supplierPayload, [
                    "suppliers",
                ])
            );
        } catch (err) {
            console.error(
                "Expense Master Data Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to load expense master data."
                )
            );
        }
    };

    // ======================================================
    // FETCH CATEGORIES
    // ======================================================

    const fetchCategories = async (
        companyId = "",
        branchId = ""
    ) => {
        try {
            if (!companyId || !branchId) {
                setCategories([]);
                return;
            }

            const response =
                await api.get(
                    "/expense-categories",
                    {
                        params: {
                            company: companyId,
                            branch: branchId,
                            isActive: "true",
                            page: 1,
                            limit: 100,
                        },
                    }
                );

            const payload =
                response?.data || {};

            setCategories(
                getList(payload, [
                    "categories",
                    "expenseCategories",
                ])
            );
        } catch (err) {
            console.error(
                "Expense Categories Error:",
                err
            );

            setCategories([]);

            setError(
                getErrorMessage(
                    err,
                    "Failed to load expense categories."
                )
            );
        }
    };

    // ======================================================
    // FETCH EXPENSES
    // ======================================================

    const fetchExpenses = async (
        requestedPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: requestedPage,
                limit: 10,
            };

            if (companyFilter) {
                params.company = companyFilter;
            }

            if (branchFilter) {
                params.branch = branchFilter;
            }

            if (categoryFilter) {
                params.category = categoryFilter;
            }

            if (supplierFilter) {
                params.supplier = supplierFilter;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            if (paymentMethodFilter) {
                params.paymentMethod =
                    paymentMethodFilter;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            if (fromDate) {
                params.fromDate = fromDate;
            }

            if (toDate) {
                params.toDate = toDate;
            }

            const response = await api.get(
                "/expenses",
                { params }
            );

            const payload =
                response?.data || {};

            setExpenses(
                Array.isArray(payload.data)
                    ? payload.data
                    : []
            );

            if (payload.pagination) {
                setPagination(
                    payload.pagination
                );
            } else {
                setPagination({
                    currentPage:
                        requestedPage,
                    perPage: 10,
                    totalItems:
                        payload.data?.length || 0,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage:
                        requestedPage > 1,
                });
            }
        } catch (err) {
            console.error(
                "Fetch Expenses Error:",
                err
            );

            setExpenses([]);

            setError(
                getErrorMessage(
                    err,
                    "Failed to fetch expenses."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        fetchExpenses(page);
    }, [
        page,
        companyFilter,
        branchFilter,
        categoryFilter,
        supplierFilter,
        statusFilter,
        paymentMethodFilter,
        fromDate,
        toDate,
    ]);

    // ======================================================
    // SEARCH DEBOUNCE
    // ======================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchExpenses(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    // ======================================================
    // FILTERED BRANCHES
    // ======================================================

    const filteredBranches = useMemo(() => {
        if (!formData.company) {
            return [];
        }

        return branches.filter(
            (branch) => {
                const branchCompany =
                    branch.company?._id ||
                    branch.company?.id ||
                    branch.company;

                return (
                    String(branchCompany) ===
                    String(formData.company)
                );
            }
        );
    }, [
        branches,
        formData.company,
    ]);

    const filterBranches = useMemo(() => {
        if (!companyFilter) {
            return branches;
        }

        return branches.filter(
            (branch) => {
                const branchCompany =
                    branch.company?._id ||
                    branch.company?.id ||
                    branch.company;

                return (
                    String(branchCompany) ===
                    String(companyFilter)
                );
            }
        );
    }, [
        branches,
        companyFilter,
    ]);

    // ======================================================
    // FILTERED CATEGORIES
    // ======================================================

    const filterCategories = useMemo(() => {
        if (
            !companyFilter ||
            !branchFilter
        ) {
            return [];
        }

        return categories.filter(
            (category) => {
                const categoryCompany =
                    category.company?._id ||
                    category.company?.id ||
                    category.company;

                const categoryBranch =
                    category.branch?._id ||
                    category.branch?.id ||
                    category.branch;

                return (
                    String(categoryCompany) ===
                        String(companyFilter) &&
                    String(categoryBranch) ===
                        String(branchFilter)
                );
            }
        );
    }, [
        categories,
        companyFilter,
        branchFilter,
    ]);

    // ======================================================
    // FORM CATEGORIES
    // ======================================================

    const formCategories = categories.filter(
        (category) => {
            const categoryCompany =
                category.company?._id ||
                category.company?.id ||
                category.company;

            const categoryBranch =
                category.branch?._id ||
                category.branch?.id ||
                category.branch;

            return (
                String(categoryCompany) ===
                    String(formData.company) &&
                String(categoryBranch) ===
                    String(formData.branch)
            );
        }
    );

    // ======================================================
    // HANDLE FORM CHANGE
    // ======================================================

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ======================================================
    // COMPANY CHANGE
    // ======================================================

    const handleFormCompanyChange = (
        e
    ) => {
        const companyId =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            category: "",
            supplier: "",
        }));

        setCategories([]);

        if (companyId) {
            fetchCategories(
                companyId,
                ""
            );
        }
    };

    // ======================================================
    // BRANCH CHANGE
    // ======================================================

    const handleFormBranchChange = (
        e
    ) => {
        const branchId =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            branch: branchId,
            category: "",
            supplier: "",
        }));

        if (
            formData.company &&
            branchId
        ) {
            fetchCategories(
                formData.company,
                branchId
            );
        } else {
            setCategories([]);
        }
    };

    // ======================================================
    // FILTER COMPANY CHANGE
    // ======================================================

    const handleCompanyFilterChange = (
        e
    ) => {
        const companyId =
            e.target.value;

        setCompanyFilter(companyId);
        setBranchFilter("");
        setCategoryFilter("");
        setPage(1);

        if (companyId) {
            // Load categories only when branch
            // is selected.
            setCategories([]);
        }
    };

    // ======================================================
    // FILTER BRANCH CHANGE
    // ======================================================

    const handleBranchFilterChange = (
        e
    ) => {
        const branchId =
            e.target.value;

        setBranchFilter(branchId);
        setCategoryFilter("");
        setPage(1);

        if (
            companyFilter &&
            branchId
        ) {
            fetchCategories(
                companyFilter,
                branchId
            );
        } else {
            setCategories([]);
        }
    };

    // ======================================================
    // RESET FILTERS
    // ======================================================

    const resetFilters = () => {
        setSearch("");
        setCompanyFilter("");
        setBranchFilter("");
        setCategoryFilter("");
        setSupplierFilter("");
        setStatusFilter("");
        setPaymentMethodFilter("");
        setFromDate("");
        setToDate("");
        setPage(1);
        setCategories([]);
    };

    // ======================================================
    // OPEN CREATE
    // ======================================================

    const openCreateModal = () => {
        setEditingExpense(null);

        setFormData({
            ...initialForm,
            expenseDate:
                new Date()
                    .toISOString()
                    .split("T")[0],
        });

        setCategories([]);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ======================================================
    // OPEN EDIT
    // ======================================================

    const handleEdit = async (
        expense
    ) => {
        const companyId =
            getId(expense.company);

        const branchId =
            getId(expense.branch);

        const categoryId =
            getId(expense.category);

        setEditingExpense(expense);

        setFormData({
            company: companyId,
            branch: branchId,
            category: categoryId,
            expenseDate: expense.expenseDate
                ? new Date(
                      expense.expenseDate
                  )
                      .toISOString()
                      .split("T")[0]
                : "",
            amount:
                expense.amount ?? "",
            paymentMethod:
                expense.paymentMethod ||
                "CASH",
            paidFrom:
                expense.paidFrom || "",
            supplier:
                getId(
                    expense.supplier
                ),
            description:
                expense.description || "",
            referenceNumber:
                expense.referenceNumber ||
                "",
            notes:
                expense.notes || "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);

        if (
            companyId &&
            branchId
        ) {
            await fetchCategories(
                companyId,
                branchId
            );
        }
    };

    // ======================================================
    // VIEW
    // ======================================================

    const handleView = (
        expense
    ) => {
        setSelectedExpense(expense);
        setShowViewModal(true);
    };

    // ======================================================
    // CLOSE FORM MODAL
    // ======================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingExpense(null);
        setFormData(initialForm);
        setCategories([]);
    };

    // ======================================================
    // SUBMIT FORM
    // ======================================================

    const handleSubmit = async (
        e
    ) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.company ||
            !formData.branch ||
            !formData.category ||
            !formData.expenseDate ||
            !formData.amount ||
            !formData.paymentMethod
        ) {
            setError(
                "Please fill all required fields."
            );
            return;
        }

        const numericAmount =
            Number(formData.amount);

        if (
            Number.isNaN(numericAmount) ||
            numericAmount <= 0
        ) {
            setError(
                "Expense amount must be greater than zero."
            );
            return;
        }

        const payload = {
            company:
                formData.company,
            branch:
                formData.branch,
            category:
                formData.category,
            expenseDate:
                formData.expenseDate,
            amount:
                numericAmount,
            paymentMethod:
                formData.paymentMethod,
            paidFrom:
                formData.paidFrom.trim(),
            supplier:
                formData.supplier || null,
            description:
                formData.description.trim(),
            referenceNumber:
                formData.referenceNumber.trim(),
            notes:
                formData.notes.trim(),
        };

        try {
            setSaving(true);

            if (editingExpense) {
                // Backend does not allow
                // company / branch changes.
                delete payload.company;
                delete payload.branch;

                const response =
                    await api.put(
                        `/expenses/${getId(
                            editingExpense
                        )}`,
                        payload
                    );

                setSuccess(
                    response?.data?.message ||
                        "Expense updated successfully."
                );
            } else {
                const response =
                    await api.post(
                        "/expenses",
                        payload
                    );

                setSuccess(
                    response?.data?.message ||
                        "Expense created successfully."
                );
            }

            setShowModal(false);
            setEditingExpense(null);
            setFormData(initialForm);
            setCategories([]);

            await fetchExpenses(page);
        } catch (err) {
            console.error(
                "Save Expense Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to save expense."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // DELETE
    // ======================================================

    const handleDelete = async (
        expense
    ) => {
        if (
            expense.status !==
            "DRAFT"
        ) {
            setError(
                "Only draft expenses can be deleted."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Delete expense ${expense.expenseNumber}?`
            );

        if (!confirmed) return;

        try {
            setActionLoading(
                `delete-${getId(
                    expense
                )}`
            );

            setError("");
            setSuccess("");

            const response =
                await api.delete(
                    `/expenses/${getId(
                        expense
                    )}`
                );

            setSuccess(
                response?.data?.message ||
                    "Expense deleted successfully."
            );

            await fetchExpenses(page);
        } catch (err) {
            console.error(
                "Delete Expense Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to delete expense."
                )
            );
        } finally {
            setActionLoading("");
        }
    };

    // ======================================================
    // SUBMIT FOR APPROVAL
    // ======================================================

    const handleSubmitForApproval =
        async (expense) => {
            if (
                expense.status !==
                "DRAFT"
            ) {
                return;
            }

            try {
                const id =
                    getId(expense);

                setActionLoading(
                    `submit-${id}`
                );

                setError("");
                setSuccess("");

                const response =
                    await api.patch(
                        `/expenses/${id}/submit`
                    );

                setSuccess(
                    response?.data?.message ||
                        "Expense submitted for approval."
                );

                await fetchExpenses(page);
            } catch (err) {
                console.error(
                    "Submit Expense Error:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Failed to submit expense."
                    )
                );
            } finally {
                setActionLoading("");
            }
        };

    // ======================================================
    // APPROVE
    // ======================================================

    const handleApprove = async (
        expense
    ) => {
        if (
            expense.status !==
            "PENDING"
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Approve expense ${expense.expenseNumber}?`
            );

        if (!confirmed) return;

        try {
            const id =
                getId(expense);

            setActionLoading(
                `approve-${id}`
            );

            setError("");
            setSuccess("");

            const response =
                await api.patch(
                    `/expenses/${id}/approve`
                );

            setSuccess(
                response?.data?.message ||
                    "Expense approved successfully."
            );

            await fetchExpenses(page);
        } catch (err) {
            console.error(
                "Approve Expense Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to approve expense."
                )
            );
        } finally {
            setActionLoading("");
        }
    };

    // ======================================================
    // OPEN REJECT MODAL
    // ======================================================

    const openRejectModal = (
        expense
    ) => {
        setRejectingExpense(expense);
        setRejectionReason("");
        setShowRejectModal(true);
    };

    // ======================================================
    // REJECT
    // ======================================================

    const handleReject = async (
        e
    ) => {
        e.preventDefault();

        if (
            !rejectionReason.trim()
        ) {
            setError(
                "Rejection reason is required."
            );
            return;
        }

        if (!rejectingExpense) {
            return;
        }

        try {
            const id =
                getId(
                    rejectingExpense
                );

            setActionLoading(
                `reject-${id}`
            );

            setError("");
            setSuccess("");

            const response =
                await api.patch(
                    `/expenses/${id}/reject`,
                    {
                        rejectionReason:
                            rejectionReason.trim(),
                    }
                );

            setSuccess(
                response?.data?.message ||
                    "Expense rejected successfully."
            );

            setShowRejectModal(false);
            setRejectingExpense(null);
            setRejectionReason("");

            await fetchExpenses(page);
        } catch (err) {
            console.error(
                "Reject Expense Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to reject expense."
                )
            );
        } finally {
            setActionLoading("");
        }
    };

    // ======================================================
    // PAY
    // ======================================================

    const handlePay = async (
        expense
    ) => {
        if (
            expense.status !==
            "APPROVED"
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Mark expense ${expense.expenseNumber} as paid?`
            );

        if (!confirmed) return;

        try {
            const id =
                getId(expense);

            setActionLoading(
                `pay-${id}`
            );

            setError("");
            setSuccess("");

            const response =
                await api.patch(
                    `/expenses/${id}/pay`
                );

            setSuccess(
                response?.data?.message ||
                    "Expense marked as paid successfully."
            );

            await fetchExpenses(page);
        } catch (err) {
            console.error(
                "Pay Expense Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to mark expense as paid."
                )
            );
        } finally {
            setActionLoading("");
        }
    };

    // ======================================================
    // COUNTS
    // ======================================================

    const draftCount =
        expenses.filter(
            (item) =>
                item.status ===
                "DRAFT"
        ).length;

    const pendingCount =
        expenses.filter(
            (item) =>
                item.status ===
                "PENDING"
        ).length;

    const approvedCount =
        expenses.filter(
            (item) =>
                item.status ===
                "APPROVED"
        ).length;

    const paidCount =
        expenses.filter(
            (item) =>
                item.status ===
                "PAID"
        ).length;

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="expenses-page">
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="expenses-header">
                <div>
                    <div className="expenses-title-row">
                        <div className="expenses-title-icon">
                            <FiDollarSign />
                        </div>

                        <div>
                            <h1>
                                Expenses
                            </h1>

                            <p>
                                Manage business expenses,
                                approvals and payments
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="expenses-primary-btn"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus />
                    Add Expense
                </button>
            </div>

            {/* ==================================================
                ALERTS
            ================================================== */}

            {error && (
                <div className="expenses-alert expenses-alert-error">
                    <FiAlertCircle />

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {success && (
                <div className="expenses-alert expenses-alert-success">
                    <FiCheck />

                    <span>
                        {success}
                    </span>

                    <button
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="expenses-summary-grid">
                <div className="expense-summary-card">
                    <div className="expense-summary-icon">
                        <FiDollarSign />
                    </div>

                    <div>
                        <span>
                            Total
                        </span>

                        <strong>
                            {pagination.totalItems}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon draft">
                        <FiEdit2 />
                    </div>

                    <div>
                        <span>
                            Draft
                        </span>

                        <strong>
                            {draftCount}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon pending">
                        <FiSend />
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {pendingCount}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon approved">
                        <FiCheck />
                    </div>

                    <div>
                        <span>
                            Approved
                        </span>

                        <strong>
                            {approvedCount}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon paid">
                        <FiCreditCard />
                    </div>

                    <div>
                        <span>
                            Paid
                        </span>

                        <strong>
                            {paidCount}
                        </strong>
                    </div>
                </div>
            </div>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="expenses-filter-card">
                <div className="expenses-filter-header">
                    <div>
                        <FiFilter />
                        Filters
                    </div>

                    <button
                        className="expenses-reset-btn"
                        onClick={
                            resetFilters
                        }
                    >
                        <FiRefreshCw />
                        Reset
                    </button>
                </div>

                <div className="expenses-filter-grid">
                    <div className="expenses-search">
                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search expense number, description, reference..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <select
                        value={
                            companyFilter
                        }
                        onChange={
                            handleCompanyFilterChange
                        }
                    >
                        <option value="">
                            All Companies
                        </option>

                        {companies.map(
                            (company) => (
                                <option
                                    key={getId(
                                        company
                                    )}
                                    value={getId(
                                        company
                                    )}
                                >
                                    {company.name ||
                                        company.legalName}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={
                            branchFilter
                        }
                        onChange={
                            handleBranchFilterChange
                        }
                        disabled={
                            !companyFilter
                        }
                    >
                        <option value="">
                            All Branches
                        </option>

                        {filterBranches.map(
                            (branch) => (
                                <option
                                    key={getId(
                                        branch
                                    )}
                                    value={getId(
                                        branch
                                    )}
                                >
                                    {
                                        branch.name
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={
                            categoryFilter
                        }
                        onChange={(e) => {
                            setCategoryFilter(
                                e.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !branchFilter
                        }
                    >
                        <option value="">
                            All Categories
                        </option>

                        {filterCategories.map(
                            (category) => (
                                <option
                                    key={getId(
                                        category
                                    )}
                                    value={getId(
                                        category
                                    )}
                                >
                                    {
                                        category.name
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={
                            supplierFilter
                        }
                        onChange={(e) => {
                            setSupplierFilter(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Suppliers
                        </option>

                        {suppliers.map(
                            (supplier) => (
                                <option
                                    key={getId(
                                        supplier
                                    )}
                                    value={getId(
                                        supplier
                                    )}
                                >
                                    {
                                        supplier.name
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={
                            statusFilter
                        }
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

                        {STATUS_OPTIONS.map(
                            (status) => (
                                <option
                                    key={
                                        status.value
                                    }
                                    value={
                                        status.value
                                    }
                                >
                                    {
                                        status.label
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={
                            paymentMethodFilter
                        }
                        onChange={(e) => {
                            setPaymentMethodFilter(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Payment Methods
                        </option>

                        {PAYMENT_METHODS.map(
                            (method) => (
                                <option
                                    key={
                                        method.value
                                    }
                                    value={
                                        method.value
                                    }
                                >
                                    {
                                        method.label
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <div className="expenses-date-input">
                        <FiCalendar />

                        <input
                            type="date"
                            value={
                                fromDate
                            }
                            onChange={(e) => {
                                setFromDate(
                                    e.target.value
                                );
                                setPage(1);
                            }}
                        />
                    </div>

                    <div className="expenses-date-input">
                        <FiCalendar />

                        <input
                            type="date"
                            value={
                                toDate
                            }
                            onChange={(e) => {
                                setToDate(
                                    e.target.value
                                );
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="expenses-table-card">
                <div className="expenses-table-header">
                    <div>
                        <h2>
                            Expense Records
                        </h2>

                        <span>
                            Showing{" "}
                            <strong>
                                {
                                    expenses.length
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {
                                    pagination.totalItems
                                }
                            </strong>{" "}
                            expenses
                        </span>
                    </div>

                    <button
                        className="expenses-refresh-btn"
                        onClick={() =>
                            fetchExpenses(
                                page
                            )
                        }
                    >
                        <FiRefreshCw />
                    </button>
                </div>

                {loading ? (
                    <div className="expenses-loading">
                        <div className="expenses-spinner" />

                        <span>
                            Loading expenses...
                        </span>
                    </div>
                ) : expenses.length ===
                  0 ? (
                    <div className="expenses-empty">
                        <FiDollarSign />

                        <h3>
                            No expenses found
                        </h3>

                        <p>
                            Create an expense or
                            change your filters.
                        </p>

                        <button
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />
                            Add Expense
                        </button>
                    </div>
                ) : (
                    <div className="expenses-table-wrapper">
                        <table className="expenses-table">
                            <thead>
                                <tr>
                                    <th>
                                        Expense
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Company /
                                        Branch
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Payment
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {expenses.map(
                                    (
                                        expense
                                    ) => {
                                        const id =
                                            getId(
                                                expense
                                            );

                                        const isActionLoading =
                                            actionLoading.includes(
                                                id
                                            );

                                        return (
                                            <tr
                                                key={
                                                    id
                                                }
                                            >
                                                <td>
                                                    <div className="expense-number">
                                                        {
                                                            expense.expenseNumber
                                                        }
                                                    </div>

                                                    <div className="expense-description">
                                                        {expense.description ||
                                                            "No description"}
                                                    </div>
                                                </td>

                                                <td>
                                                    {
                                                        formatDate(
                                                            expense.expenseDate
                                                        )
                                                    }
                                                </td>

                                                <td>
                                                    <div className="expense-company">
                                                        {
                                                            expense
                                                                .company
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </div>

                                                    <div className="expense-branch">
                                                        {
                                                            expense
                                                                .branch
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="expense-category">
                                                        {
                                                            expense
                                                                .category
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </div>

                                                    {expense
                                                        .category
                                                        ?.code && (
                                                        <div className="expense-code">
                                                            {
                                                                expense
                                                                    .category
                                                                    .code
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    <strong className="expense-amount">
                                                        ₹{" "}
                                                        {formatAmount(
                                                            expense.amount
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className="expense-payment">
                                                        {getPaymentLabel(
                                                            expense.paymentMethod
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`expense-status status-${expense.status?.toLowerCase()}`}
                                                    >
                                                        {
                                                            getStatusLabel(
                                                                expense.status
                                                            )
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="expense-actions">
                                                        <button
                                                            className="expense-action view"
                                                            title="View"
                                                            onClick={() =>
                                                                handleView(
                                                                    expense
                                                                )
                                                            }
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {expense.status ===
                                                            "DRAFT" && (
                                                            <>
                                                                <button
                                                                    className="expense-action edit"
                                                                    title="Edit"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            expense
                                                                        )
                                                                    }
                                                                >
                                                                    <FiEdit2 />
                                                                </button>

                                                                <button
                                                                    className="expense-action submit"
                                                                    title="Submit for Approval"
                                                                    disabled={
                                                                        isActionLoading
                                                                    }
                                                                    onClick={() =>
                                                                        handleSubmitForApproval(
                                                                            expense
                                                                        )
                                                                    }
                                                                >
                                                                    <FiSend />
                                                                </button>

                                                                <button
                                                                    className="expense-action delete"
                                                                    title="Delete"
                                                                    disabled={
                                                                        isActionLoading
                                                                    }
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            expense
                                                                        )
                                                                    }
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </>
                                                        )}

                                                        {expense.status ===
                                                            "PENDING" && (
                                                            <>
                                                                <button
                                                                    className="expense-action approve"
                                                                    title="Approve"
                                                                    disabled={
                                                                        isActionLoading
                                                                    }
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            expense
                                                                        )
                                                                    }
                                                                >
                                                                    <FiCheck />
                                                                </button>

                                                                <button
                                                                    className="expense-action reject"
                                                                    title="Reject"
                                                                    disabled={
                                                                        isActionLoading
                                                                    }
                                                                    onClick={() =>
                                                                        openRejectModal(
                                                                            expense
                                                                        )
                                                                    }
                                                                >
                                                                    <FiX />
                                                                </button>
                                                            </>
                                                        )}

                                                        {expense.status ===
                                                            "APPROVED" && (
                                                            <button
                                                                className="expense-action pay"
                                                                title="Mark as Paid"
                                                                disabled={
                                                                    isActionLoading
                                                                }
                                                                onClick={() =>
                                                                    handlePay(
                                                                        expense
                                                                    )
                                                                }
                                                            >
                                                                <FiCreditCard />
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
                )}

                {/* ==================================================
                    PAGINATION
                ================================================== */}

                {!loading &&
                    expenses.length > 0 && (
                        <div className="expenses-pagination">
                            <div className="expenses-pagination-info">
                                Page{" "}
                                <strong>
                                    {
                                        pagination.currentPage
                                    }
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        pagination.totalPages ||
                                            1
                                    }
                                </strong>
                            </div>

                            <div className="expenses-pagination-buttons">
                                <button
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                prev
                                            ) =>
                                                Math.max(
                                                    prev -
                                                        1,
                                                    1
                                                )
                                        )
                                    }
                                >
                                    <FiChevronLeft />
                                    Previous
                                </button>

                                <button
                                    disabled={
                                        !pagination.hasNextPage
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                prev
                                            ) =>
                                                prev +
                                                1
                                        )
                                    }
                                >
                                    Next
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
            </div>

            {/* ==================================================
                CREATE / EDIT MODAL
            ================================================== */}

            {showModal && (
                <div className="expenses-modal-overlay">
                    <div className="expenses-modal">
                        <div className="expenses-modal-header">
                            <div>
                                <h2>
                                    {editingExpense
                                        ? "Edit Expense"
                                        : "Add Expense"}
                                </h2>

                                <p>
                                    {editingExpense
                                        ? `Update ${editingExpense.expenseNumber}`
                                        : "Create a new business expense"}
                                </p>
                            </div>

                            <button
                                className="expenses-modal-close"
                                onClick={
                                    closeModal
                                }
                            >
                                <FiX />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="expenses-form"
                        >
                            <div className="expenses-modal-body">
                                {error && (
                                    <div className="expenses-form-error">
                                        <FiAlertCircle />
                                        {error}
                                    </div>
                                )}

                                <div className="expenses-form-grid">
                                    <div className="expenses-field">
                                        <label>
                                            Company{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="company"
                                            value={
                                                formData.company
                                            }
                                            onChange={
                                                handleFormCompanyChange
                                            }
                                            disabled={
                                                Boolean(
                                                    editingExpense
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Company
                                            </option>

                                            {companies.map(
                                                (
                                                    company
                                                ) => (
                                                    <option
                                                        key={getId(
                                                            company
                                                        )}
                                                        value={getId(
                                                            company
                                                        )}
                                                    >
                                                        {company.name ||
                                                            company.legalName}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Branch{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="branch"
                                            value={
                                                formData.branch
                                            }
                                            onChange={
                                                handleFormBranchChange
                                            }
                                            disabled={
                                                !formData.company ||
                                                Boolean(
                                                    editingExpense
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Branch
                                            </option>

                                            {filteredBranches.map(
                                                (
                                                    branch
                                                ) => (
                                                    <option
                                                        key={getId(
                                                            branch
                                                        )}
                                                        value={getId(
                                                            branch
                                                        )}
                                                    >
                                                        {
                                                            branch.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Category{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="category"
                                            value={
                                                formData.category
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                !formData.branch
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Category
                                            </option>

                                            {formCategories.map(
                                                (
                                                    category
                                                ) => (
                                                    <option
                                                        key={getId(
                                                            category
                                                        )}
                                                        value={getId(
                                                            category
                                                        )}
                                                    >
                                                        {
                                                            category.name
                                                        }
                                                        {category.code
                                                            ? ` (${category.code})`
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Expense Date{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="date"
                                            name="expenseDate"
                                            value={
                                                formData.expenseDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Amount{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <div className="expenses-input-prefix">
                                            <span>
                                                ₹
                                            </span>

                                            <input
                                                type="number"
                                                name="amount"
                                                value={
                                                    formData.amount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Payment Method{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="paymentMethod"
                                            value={
                                                formData.paymentMethod
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >
                                            {PAYMENT_METHODS.map(
                                                (
                                                    method
                                                ) => (
                                                    <option
                                                        key={
                                                            method.value
                                                        }
                                                        value={
                                                            method.value
                                                        }
                                                    >
                                                        {
                                                            method.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Paid From
                                        </label>

                                        <input
                                            type="text"
                                            name="paidFrom"
                                            value={
                                                formData.paidFrom
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Cash account / bank / wallet"
                                        />
                                    </div>

                                    <div className="expenses-field">
                                        <label>
                                            Supplier
                                        </label>

                                        <select
                                            name="supplier"
                                            value={
                                                formData.supplier
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >
                                            <option value="">
                                                No Supplier
                                            </option>

                                            {suppliers
                                                .filter(
                                                    (
                                                        supplier
                                                    ) => {
                                                        const supplierCompany =
                                                            supplier.company?._id ||
                                                            supplier.company?.id ||
                                                            supplier.company;

                                                        const supplierBranch =
                                                            supplier.branch?._id ||
                                                            supplier.branch?.id ||
                                                            supplier.branch;

                                                        if (
                                                            !formData.company ||
                                                            !formData.branch
                                                        ) {
                                                            return true;
                                                        }

                                                        return (
                                                            String(
                                                                supplierCompany
                                                            ) ===
                                                                String(
                                                                    formData.company
                                                                ) &&
                                                            String(
                                                                supplierBranch
                                                            ) ===
                                                                String(
                                                                    formData.branch
                                                                )
                                                        );
                                                    }
                                                )
                                                .map(
                                                    (
                                                        supplier
                                                    ) => (
                                                        <option
                                                            key={getId(
                                                                supplier
                                                            )}
                                                            value={getId(
                                                                supplier
                                                            )}
                                                        >
                                                            {
                                                                supplier.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                        </select>
                                    </div>

                                    <div className="expenses-field expenses-field-full">
                                        <label>
                                            Reference Number
                                        </label>

                                        <input
                                            type="text"
                                            name="referenceNumber"
                                            value={
                                                formData.referenceNumber
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Invoice / receipt / reference number"
                                        />
                                    </div>

                                    <div className="expenses-field expenses-field-full">
                                        <label>
                                            Description
                                        </label>

                                        <textarea
                                            name="description"
                                            value={
                                                formData.description
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            rows="3"
                                            placeholder="Enter expense description"
                                        />
                                    </div>

                                    <div className="expenses-field expenses-field-full">
                                        <label>
                                            Notes
                                        </label>

                                        <textarea
                                            name="notes"
                                            value={
                                                formData.notes
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            rows="3"
                                            placeholder="Additional notes"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="expenses-modal-footer">
                                <button
                                    type="button"
                                    className="expenses-secondary-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="expenses-primary-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <span className="expenses-button-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck />
                                            {editingExpense
                                                ? "Update Expense"
                                                : "Create Expense"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================================================
                VIEW MODAL
            ================================================== */}

            {showViewModal &&
                selectedExpense && (
                    <div className="expenses-modal-overlay">
                        <div className="expenses-modal expenses-view-modal">
                            <div className="expenses-modal-header">
                                <div>
                                    <h2>
                                        Expense Details
                                    </h2>

                                    <p>
                                        {
                                            selectedExpense.expenseNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    className="expenses-modal-close"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="expenses-modal-body">
                                <div className="expense-view-top">
                                    <div>
                                        <span>
                                            Expense Number
                                        </span>

                                        <strong>
                                            {
                                                selectedExpense.expenseNumber
                                            }
                                        </strong>
                                    </div>

                                    <span
                                        className={`expense-status status-${selectedExpense.status?.toLowerCase()}`}
                                    >
                                        {
                                            getStatusLabel(
                                                selectedExpense.status
                                            )
                                        }
                                    </span>
                                </div>

                                <div className="expense-view-grid">
                                    <div>
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .company
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .branch
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Category
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .category
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Expense Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedExpense.expenseDate
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Amount
                                        </span>

                                        <strong className="expense-view-amount">
                                            ₹{" "}
                                            {formatAmount(
                                                selectedExpense.amount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Payment Method
                                        </span>

                                        <strong>
                                            {getPaymentLabel(
                                                selectedExpense.paymentMethod
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Paid From
                                        </span>

                                        <strong>
                                            {selectedExpense.paidFrom ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Supplier
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .supplier
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Reference Number
                                        </span>

                                        <strong>
                                            {selectedExpense.referenceNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Created By
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .createdBy
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Approved By
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .approvedBy
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Paid By
                                        </span>

                                        <strong>
                                            {selectedExpense
                                                .paidBy
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="expense-view-text">
                                    <span>
                                        Description
                                    </span>

                                    <p>
                                        {selectedExpense.description ||
                                            "No description"}
                                    </p>
                                </div>

                                <div className="expense-view-text">
                                    <span>
                                        Notes
                                    </span>

                                    <p>
                                        {selectedExpense.notes ||
                                            "No notes"}
                                    </p>
                                </div>

                                {selectedExpense.rejectionReason && (
                                    <div className="expense-rejection-box">
                                        <span>
                                            Rejection Reason
                                        </span>

                                        <p>
                                            {
                                                selectedExpense.rejectionReason
                                            }
                                        </p>
                                    </div>
                                )}

                                {selectedExpense.approvedAt && (
                                    <div className="expense-workflow-info">
                                        Approved At:{" "}
                                        {formatDate(
                                            selectedExpense.approvedAt
                                        )}
                                    </div>
                                )}

                                {selectedExpense.paidAt && (
                                    <div className="expense-workflow-info">
                                        Paid At:{" "}
                                        {formatDate(
                                            selectedExpense.paidAt
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="expenses-modal-footer">
                                <button
                                    type="button"
                                    className="expenses-secondary-btn"
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

            {/* ==================================================
                REJECT MODAL
            ================================================== */}

            {showRejectModal &&
                rejectingExpense && (
                    <div className="expenses-modal-overlay">
                        <div className="expenses-modal expenses-reject-modal">
                            <div className="expenses-modal-header">
                                <div>
                                    <h2>
                                        Reject Expense
                                    </h2>

                                    <p>
                                        {
                                            rejectingExpense.expenseNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    className="expenses-modal-close"
                                    onClick={() => {
                                        setShowRejectModal(
                                            false
                                        );
                                        setRejectingExpense(
                                            null
                                        );
                                    }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    handleReject
                                }
                            >
                                <div className="expenses-modal-body">
                                    <div className="expenses-field">
                                        <label>
                                            Rejection Reason{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            value={
                                                rejectionReason
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setRejectionReason(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            rows="5"
                                            placeholder="Enter the reason for rejecting this expense..."
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="expenses-modal-footer">
                                    <button
                                        type="button"
                                        className="expenses-secondary-btn"
                                        onClick={() => {
                                            setShowRejectModal(
                                                false
                                            );
                                            setRejectingExpense(
                                                null
                                            );
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="expenses-danger-btn"
                                        disabled={
                                            actionLoading.includes(
                                                getId(
                                                    rejectingExpense
                                                )
                                            )
                                        }
                                    >
                                        <FiX />
                                        Reject Expense
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Expenses;