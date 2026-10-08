import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiSend,
    FiXCircle,
    FiBookOpen,
    FiChevronLeft,
    FiChevronRight,
    FiRefreshCw,
    FiAlertCircle,
    FiCheckCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/journalEntries.css";

const REFERENCE_TYPES = [
    "MANUAL",
    "SALES",
    "PURCHASE",
    "EXPENSE",
    "PAYMENT",
    "RECEIPT",
    "ADJUSTMENT",
    "OTHER",
];

const STATUS_OPTIONS = [
    "DRAFT",
    "POSTED",
    "CANCELLED",
];

const emptyLine = () => ({
    account: "",
    description: "",
    debit: "",
    credit: "",
});

const initialForm = {
    company: "",
    branch: "",
    journalDate: new Date().toISOString().split("T")[0],
    referenceType: "MANUAL",
    referenceId: "",
    description: "",
    entries: [emptyLine(), emptyLine()],
};

const getId = (item) => item?._id || item?.id || "";

const normalizeList = (payload, keys = []) => {
    if (Array.isArray(payload)) {
        return payload;
    }

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

const formatAmount = (value) => {
    return Number(value || 0).toFixed(2);
};

const getToday = () => {
    return new Date().toISOString().split("T")[0];
};

const JournalEntries = () => {
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [journalEntries, setJournalEntries] = useState([]);

    const [loading, setLoading] = useState(true);
    const [masterLoading, setMasterLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [referenceTypeFilter, setReferenceTypeFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
    });

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingJournal, setEditingJournal] = useState(null);
    const [selectedJournal, setSelectedJournal] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    // =====================================================
    // Messages
    // =====================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError("");

        setTimeout(() => {
            setSuccess("");
        }, 3500);
    };

    const showError = (message) => {
        setError(message || "Something went wrong.");
        setSuccess("");

        setTimeout(() => {
            setError("");
        }, 5000);
    };

    // =====================================================
    // Load Companies
    // =====================================================

    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies");

            const payload = response.data;

            const list = normalizeList(payload, [
                "companies",
            ]);

            setCompanies(list);
        } catch (err) {
            console.error("Fetch Companies Error:", err);

            showError(
                err?.response?.data?.message ||
                    "Failed to load companies."
            );
        }
    };

    // =====================================================
    // Load Branches
    // =====================================================

    const fetchBranches = async (companyId = "") => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            setMasterLoading(true);

            const response = await api.get("/branches", {
                params: {
                    company: companyId,
                    limit: 100,
                },
            });

            const payload = response.data;

            const list = normalizeList(payload, [
                "branches",
            ]);

            setBranches(list);
        } catch (err) {
            console.error("Fetch Branches Error:", err);

            setBranches([]);

            showError(
                err?.response?.data?.message ||
                    "Failed to load branches."
            );
        } finally {
            setMasterLoading(false);
        }
    };

    // =====================================================
    // Load Accounts
    // =====================================================

    const fetchAccounts = async (companyId = "") => {
        if (!companyId) {
            setAccounts([]);
            return;
        }

        try {
            setMasterLoading(true);

            const response = await api.get("/accounts", {
                params: {
                    company: companyId,
                    isActive: true,
                    page: 1,
                    limit: 100,
                },
            });

            const payload = response.data;

            const list = normalizeList(payload, [
                "accounts",
            ]);

            setAccounts(list);
        } catch (err) {
            console.error("Fetch Accounts Error:", err);

            setAccounts([]);

            showError(
                err?.response?.data?.message ||
                    "Failed to load accounts."
            );
        } finally {
            setMasterLoading(false);
        }
    };

    // =====================================================
    // Load Journal Entries
    // =====================================================

    const fetchJournalEntries = async (
        requestedPage = page
    ) => {
        if (!companyFilter) {
            setJournalEntries([]);
            setPagination({
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 1,
            });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const params = {
                company: companyFilter,
                page: requestedPage,
                limit: 20,
            };

            if (branchFilter) {
                params.branch = branchFilter;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            if (referenceTypeFilter) {
                params.referenceType =
                    referenceTypeFilter;
            }

            if (fromDate) {
                params.fromDate = fromDate;
            }

            if (toDate) {
                params.toDate = toDate;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await api.get(
                "/journal-entries",
                {
                    params,
                }
            );

            const payload = response.data;

            setJournalEntries(
                Array.isArray(payload?.data)
                    ? payload.data
                    : []
            );

            setPagination(
                payload?.pagination || {
                    total: 0,
                    page: requestedPage,
                    limit: 20,
                    totalPages: 1,
                }
            );
        } catch (err) {
            console.error(
                "Fetch Journal Entries Error:",
                err
            );

            setJournalEntries([]);

            showError(
                err?.response?.data?.message ||
                    "Failed to load journal entries."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {
        fetchCompanies();
    }, []);

    // =====================================================
    // Company Filter Change
    // =====================================================

    useEffect(() => {
        if (!companyFilter) {
            setBranches([]);
            setJournalEntries([]);
            setBranchFilter("");
            setPage(1);
            return;
        }

        setBranchFilter("");
        setPage(1);

        fetchBranches(companyFilter);
        fetchAccounts(companyFilter);
        fetchJournalEntries(1);
    }, [companyFilter]);

    // =====================================================
    // Filter Changes
    // =====================================================

    useEffect(() => {
        if (!companyFilter) {
            return;
        }

        setPage(1);

        fetchJournalEntries(1);
    }, [
        branchFilter,
        statusFilter,
        referenceTypeFilter,
        fromDate,
        toDate,
    ]);

    // =====================================================
    // Search
    // =====================================================

    useEffect(() => {
        if (!companyFilter) {
            return;
        }

        const timer = setTimeout(() => {
            setPage(1);
            fetchJournalEntries(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    // =====================================================
    // Form Company Change
    // =====================================================

    const handleFormCompanyChange = async (companyId) => {
        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            entries: prev.entries.map((line) => ({
                ...line,
                account: "",
            })),
        }));

        setBranches([]);
        setAccounts([]);

        if (companyId) {
            await Promise.all([
                fetchBranches(companyId),
                fetchAccounts(companyId),
            ]);
        }
    };

    // =====================================================
    // Form Branch Change
    // =====================================================

    const handleFormBranchChange = (branchId) => {
        setFormData((prev) => ({
            ...prev,
            branch: branchId,
        }));
    };

    // =====================================================
    // Open Create
    // =====================================================

    const handleAdd = () => {
        clearMessages();

        setEditingJournal(null);

        setFormData({
            ...initialForm,
            journalDate: getToday(),
            entries: [
                emptyLine(),
                emptyLine(),
            ],
        });

        setBranches([]);
        setAccounts([]);

        setShowModal(true);
    };

    // =====================================================
    // Open Edit
    // =====================================================

    const handleEdit = async (journal) => {
        clearMessages();

        if (journal.status !== "DRAFT") {
            showError(
                "Only DRAFT journal entries can be edited."
            );
            return;
        }

        const companyId =
            getId(journal.company);

        const branchId =
            getId(journal.branch);

        setEditingJournal(journal);

        setFormData({
            company: companyId,
            branch: branchId,
            journalDate: journal.journalDate
                ? new Date(journal.journalDate)
                      .toISOString()
                      .split("T")[0]
                : getToday(),
            referenceType:
                journal.referenceType || "MANUAL",
            referenceId:
                journal.referenceId || "",
            description:
                journal.description || "",
            entries:
                journal.entries?.length >= 2
                    ? journal.entries.map((line) => ({
                          account:
                              getId(line.account),
                          description:
                              line.description || "",
                          debit:
                              line.debit > 0
                                  ? String(line.debit)
                                  : "",
                          credit:
                              line.credit > 0
                                  ? String(line.credit)
                                  : "",
                      }))
                    : [
                          emptyLine(),
                          emptyLine(),
                      ],
        });

        setShowModal(true);

        await Promise.all([
            fetchBranches(companyId),
            fetchAccounts(companyId),
        ]);
    };

    // =====================================================
    // Form Change
    // =====================================================

    const handleFieldChange = (
        field,
        value
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // =====================================================
    // Journal Line Change
    // =====================================================

    const handleLineChange = (
        index,
        field,
        value
    ) => {
        setFormData((prev) => {
            const entries = [...prev.entries];

            entries[index] = {
                ...entries[index],
                [field]: value,
            };

            if (field === "debit" && value !== "") {
                entries[index].credit = "";
            }

            if (field === "credit" && value !== "") {
                entries[index].debit = "";
            }

            return {
                ...prev,
                entries,
            };
        });
    };

    // =====================================================
    // Add Line
    // =====================================================

    const addLine = () => {
        setFormData((prev) => ({
            ...prev,
            entries: [
                ...prev.entries,
                emptyLine(),
            ],
        }));
    };

    // =====================================================
    // Remove Line
    // =====================================================

    const removeLine = (index) => {
        if (formData.entries.length <= 2) {
            showError(
                "At least two journal entry lines are required."
            );
            return;
        }

        setFormData((prev) => ({
            ...prev,
            entries: prev.entries.filter(
                (_, lineIndex) =>
                    lineIndex !== index
            ),
        }));
    };

    // =====================================================
    // Totals
    // =====================================================

    const totals = useMemo(() => {
        const debit = formData.entries.reduce(
            (sum, line) =>
                sum + Number(line.debit || 0),
            0
        );

        const credit = formData.entries.reduce(
            (sum, line) =>
                sum + Number(line.credit || 0),
            0
        );

        return {
            debit: Number(debit.toFixed(2)),
            credit: Number(credit.toFixed(2)),
            difference: Number(
                (debit - credit).toFixed(2)
            ),
            balanced:
                debit > 0 &&
                credit > 0 &&
                Number(debit.toFixed(2)) ===
                    Number(credit.toFixed(2)),
        };
    }, [formData.entries]);

    // =====================================================
    // Validate Form
    // =====================================================

    const validateForm = () => {
        if (!formData.company) {
            return "Company is required.";
        }

        if (!formData.branch) {
            return "Branch is required.";
        }

        if (!formData.journalDate) {
            return "Journal date is required.";
        }

        if (
            !formData.entries ||
            formData.entries.length < 2
        ) {
            return "At least two journal entry lines are required.";
        }

        for (
            let index = 0;
            index < formData.entries.length;
            index++
        ) {
            const line =
                formData.entries[index];

            if (!line.account) {
                return `Account is required for line ${
                    index + 1
                }.`;
            }

            const debit = Number(
                line.debit || 0
            );

            const credit = Number(
                line.credit || 0
            );

            if (
                !Number.isFinite(debit) ||
                !Number.isFinite(credit)
            ) {
                return `Invalid debit or credit value on line ${
                    index + 1
                }.`;
            }

            if (debit < 0 || credit < 0) {
                return `Debit and credit cannot be negative on line ${
                    index + 1
                }.`;
            }

            if (
                debit > 0 &&
                credit > 0
            ) {
                return `Line ${
                    index + 1
                } cannot have both debit and credit.`;
            }

            if (
                debit === 0 &&
                credit === 0
            ) {
                return `Line ${
                    index + 1
                } must contain either debit or credit.`;
            }
        }

        if (totals.debit <= 0) {
            return "Total debit must be greater than zero.";
        }

        if (totals.credit <= 0) {
            return "Total credit must be greater than zero.";
        }

        if (!totals.balanced) {
            return `Journal entry is not balanced. Difference: ₹${Math.abs(
                totals.difference
            ).toFixed(2)}`;
        }

        return "";
    };

    // =====================================================
    // Submit Create / Update
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        clearMessages();

        const validationError =
            validateForm();

        if (validationError) {
            showError(validationError);
            return;
        }

        try {
            setSaving(true);

            const payload = {
                company: formData.company,
                branch: formData.branch,
                journalDate:
                    formData.journalDate,
                referenceType:
                    formData.referenceType ||
                    "MANUAL",
                referenceId:
                    formData.referenceId.trim()
                        ? formData.referenceId.trim()
                        : null,
                description:
                    formData.description.trim(),
                entries: formData.entries.map(
                    (line) => ({
                        account: line.account,
                        description:
                            line.description.trim(),
                        debit: Number(
                            line.debit || 0
                        ),
                        credit: Number(
                            line.credit || 0
                        ),
                    })
                ),
            };

            let response;

            if (editingJournal) {
                response = await api.patch(
                    `/journal-entries/${getId(
                        editingJournal
                    )}`,
                    {
                        journalDate:
                            payload.journalDate,
                        referenceType:
                            payload.referenceType,
                        referenceId:
                            payload.referenceId,
                        description:
                            payload.description,
                        entries:
                            payload.entries,
                    }
                );
            } else {
                response = await api.post(
                    "/journal-entries",
                    payload
                );
            }

            showSuccess(
                response?.data?.message ||
                    (editingJournal
                        ? "Journal entry updated successfully."
                        : "Journal entry created successfully.")
            );

            setShowModal(false);
            setEditingJournal(null);

            setFormData({
                ...initialForm,
                journalDate: getToday(),
                entries: [
                    emptyLine(),
                    emptyLine(),
                ],
            });

            await fetchJournalEntries(page);
        } catch (err) {
            console.error(
                "Save Journal Entry Error:",
                err
            );

            showError(
                err?.response?.data?.message ||
                    "Failed to save journal entry."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // View
    // =====================================================

    const handleView = async (journal) => {
        try {
            clearMessages();

            setActionLoading(true);

            const response =
                await api.get(
                    `/journal-entries/${getId(
                        journal
                    )}`
                );

            setSelectedJournal(
                response?.data?.data ||
                    journal
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View Journal Entry Error:",
                err
            );

            showError(
                err?.response?.data?.message ||
                    "Failed to load journal entry."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // Post
    // =====================================================

    const handlePost = async (journal) => {
        if (journal.status !== "DRAFT") {
            showError(
                "Only DRAFT journal entries can be posted."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Post ${journal.journalNumber}? This will create ledger entries.`
            );

        if (!confirmed) {
            return;
        }

        try {
            clearMessages();

            setActionLoading(true);

            const response =
                await api.patch(
                    `/journal-entries/${getId(
                        journal
                    )}/post`
                );

            showSuccess(
                response?.data?.message ||
                    "Journal entry posted successfully."
            );

            await fetchJournalEntries(page);
        } catch (err) {
            console.error(
                "Post Journal Entry Error:",
                err
            );

            showError(
                err?.response?.data?.message ||
                    "Failed to post journal entry."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // Cancel
    // =====================================================

    const handleCancel = async (journal) => {
        if (journal.status === "CANCELLED") {
            showError(
                "Journal entry is already cancelled."
            );
            return;
        }

        const reason =
            window.prompt(
                `Enter cancellation reason for ${journal.journalNumber}:`
            );

        if (reason === null) {
            return;
        }

        try {
            clearMessages();

            setActionLoading(true);

            const response =
                await api.patch(
                    `/journal-entries/${getId(
                        journal
                    )}/cancel`,
                    {
                        reason: reason.trim(),
                    }
                );

            showSuccess(
                response?.data?.message ||
                    "Journal entry cancelled successfully."
            );

            await fetchJournalEntries(page);
        } catch (err) {
            console.error(
                "Cancel Journal Entry Error:",
                err
            );

            showError(
                err?.response?.data?.message ||
                    "Failed to cancel journal entry."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // Delete
    // =====================================================

    const handleDelete = async (journal) => {
        if (journal.status !== "DRAFT") {
            showError(
                "Only DRAFT journal entries can be deleted."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Delete ${journal.journalNumber}? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {
            clearMessages();

            setActionLoading(true);

            const response =
                await api.delete(
                    `/journal-entries/${getId(
                        journal
                    )}`
                );

            showSuccess(
                response?.data?.message ||
                    "Journal entry deleted successfully."
            );

            const nextPage =
                journalEntries.length === 1 &&
                page > 1
                    ? page - 1
                    : page;

            if (nextPage !== page) {
                setPage(nextPage);
            }

            await fetchJournalEntries(
                nextPage
            );
        } catch (err) {
            console.error(
                "Delete Journal Entry Error:",
                err
            );

            showError(
                err?.response?.data?.message ||
                    "Failed to delete journal entry."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // Reset Filters
    // =====================================================

    const resetFilters = () => {
        setSearch("");
        setBranchFilter("");
        setStatusFilter("");
        setReferenceTypeFilter("");
        setFromDate("");
        setToDate("");
        setPage(1);

        if (companyFilter) {
            fetchJournalEntries(1);
        }
    };

    // =====================================================
    // Pagination
    // =====================================================

    const handlePageChange = (newPage) => {
        if (
            newPage < 1 ||
            newPage > pagination.totalPages
        ) {
            return;
        }

        setPage(newPage);
        fetchJournalEntries(newPage);
    };

    // =====================================================
    // Close Modal
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingJournal(null);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedJournal(null);
    };

    // =====================================================
    // Helpers
    // =====================================================

    const getCompanyName = (company) => {
        if (!company) {
            return "-";
        }

        if (typeof company === "string") {
            return company;
        }

        return (
            company.name ||
            company.legalName ||
            "-"
        );
    };

    const getBranchName = (branch) => {
        if (!branch) {
            return "-";
        }

        if (typeof branch === "string") {
            return branch;
        }

        return branch.name || "-";
    };

    const getAccountName = (account) => {
        if (!account) {
            return "-";
        }

        if (typeof account === "string") {
            return account;
        }

        return `${account.accountCode || ""} ${
            account.accountName || ""
        }`.trim();
    };

    const getStatusClass = (status) => {
        return `journal-status journal-status-${String(
            status || ""
        ).toLowerCase()}`;
    };

    const draftCount =
        journalEntries.filter(
            (item) =>
                item.status === "DRAFT"
        ).length;

    const postedCount =
        journalEntries.filter(
            (item) =>
                item.status === "POSTED"
        ).length;

    const cancelledCount =
        journalEntries.filter(
            (item) =>
                item.status === "CANCELLED"
        ).length;

    // =====================================================
    // Render
    // =====================================================

    return (
        <div className="journal-entries-page">
            {/* =================================================
                Header
            ================================================= */}

            <div className="journal-page-header">
                <div>
                    <div className="journal-title-row">
                        <div className="journal-title-icon">
                            <FiBookOpen />
                        </div>

                        <div>
                            <h1>
                                Journal Entries
                            </h1>

                            <p>
                                Create, manage and post
                                accounting journal entries
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="journal-primary-btn"
                    onClick={handleAdd}
                >
                    <FiPlus />
                    New Journal Entry
                </button>
            </div>

            {/* =================================================
                Alerts
            ================================================= */}

            {success && (
                <div className="journal-alert journal-alert-success">
                    <FiCheckCircle />
                    <span>{success}</span>
                </div>
            )}

            {error && (
                <div className="journal-alert journal-alert-error">
                    <FiAlertCircle />
                    <span>{error}</span>
                </div>
            )}

            {/* =================================================
                Stats
            ================================================= */}

            <div className="journal-stats-grid">
                <div className="journal-stat-card">
                    <div>
                        <span>
                            Total
                        </span>

                        <strong>
                            {pagination.total}
                        </strong>
                    </div>

                    <div className="journal-stat-icon total">
                        <FiBookOpen />
                    </div>
                </div>

                <div className="journal-stat-card">
                    <div>
                        <span>
                            Draft
                        </span>

                        <strong>
                            {draftCount}
                        </strong>
                    </div>

                    <div className="journal-stat-icon draft">
                        <FiEdit2 />
                    </div>
                </div>

                <div className="journal-stat-card">
                    <div>
                        <span>
                            Posted
                        </span>

                        <strong>
                            {postedCount}
                        </strong>
                    </div>

                    <div className="journal-stat-icon posted">
                        <FiCheckCircle />
                    </div>
                </div>

                <div className="journal-stat-card">
                    <div>
                        <span>
                            Cancelled
                        </span>

                        <strong>
                            {cancelledCount}
                        </strong>
                    </div>

                    <div className="journal-stat-icon cancelled">
                        <FiXCircle />
                    </div>
                </div>
            </div>

            {/* =================================================
                Filters
            ================================================= */}

            <div className="journal-filter-card">
                <div className="journal-filter-grid">
                    <div className="journal-filter-group journal-search-group">
                        <label>
                            Search
                        </label>

                        <div className="journal-search-box">
                            <FiSearch />

                            <input
                                type="text"
                                placeholder="Search journal number or description..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="journal-filter-group">
                        <label>
                            Company
                        </label>

                        <select
                            value={
                                companyFilter
                            }
                            onChange={(e) =>
                                setCompanyFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                Select Company
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
                                        {getCompanyName(
                                            company
                                        )}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="journal-filter-group">
                        <label>
                            Branch
                        </label>

                        <select
                            value={
                                branchFilter
                            }
                            onChange={(e) =>
                                setBranchFilter(
                                    e.target.value
                                )
                            }
                            disabled={
                                !companyFilter ||
                                masterLoading
                            }
                        >
                            <option value="">
                                All Branches
                            </option>

                            {branches.map(
                                (branch) => (
                                    <option
                                        key={getId(
                                            branch
                                        )}
                                        value={getId(
                                            branch
                                        )}
                                    >
                                        {getBranchName(
                                            branch
                                        )}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="journal-filter-group">
                        <label>
                            Status
                        </label>

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                All Status
                            </option>

                            {STATUS_OPTIONS.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="journal-filter-group">
                        <label>
                            Reference
                        </label>

                        <select
                            value={
                                referenceTypeFilter
                            }
                            onChange={(e) =>
                                setReferenceTypeFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                All References
                            </option>

                            {REFERENCE_TYPES.map(
                                (type) => (
                                    <option
                                        key={type}
                                        value={type}
                                    >
                                        {type}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="journal-filter-group">
                        <label>
                            From Date
                        </label>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) =>
                                setFromDate(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="journal-filter-group">
                        <label>
                            To Date
                        </label>

                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) =>
                                setToDate(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="journal-filter-actions">
                        <button
                            type="button"
                            className="journal-reset-btn"
                            onClick={
                                resetFilters
                            }
                        >
                            <FiRefreshCw />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* =================================================
                Table
            ================================================= */}

            <div className="journal-table-card">
                <div className="journal-table-header">
                    <div>
                        <h2>
                            Journal Entries
                        </h2>

                        <span>
                            {pagination.total} entries
                        </span>
                    </div>

                    {loading && (
                        <div className="journal-loading-small">
                            Loading...
                        </div>
                    )}
                </div>

                {!companyFilter ? (
                    <div className="journal-empty-state">
                        <FiBookOpen />

                        <h3>
                            Select a company
                        </h3>

                        <p>
                            Select a company above to
                            view journal entries.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="journal-empty-state">
                        <div className="journal-spinner" />

                        <p>
                            Loading journal entries...
                        </p>
                    </div>
                ) : journalEntries.length ===
                  0 ? (
                    <div className="journal-empty-state">
                        <FiBookOpen />

                        <h3>
                            No journal entries found
                        </h3>

                        <p>
                            Create your first journal
                            entry using the button above.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="journal-table-wrapper">
                            <table className="journal-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Journal No.
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Branch
                                        </th>

                                        <th>
                                            Reference
                                        </th>

                                        <th>
                                            Description
                                        </th>

                                        <th className="amount-column">
                                            Debit
                                        </th>

                                        <th className="amount-column">
                                            Credit
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th className="action-column">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {journalEntries.map(
                                        (journal) => (
                                            <tr
                                                key={getId(
                                                    journal
                                                )}
                                            >
                                                <td>
                                                    <strong className="journal-number">
                                                        {
                                                            journal.journalNumber
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {journal.journalDate
                                                        ? new Date(
                                                              journal.journalDate
                                                          ).toLocaleDateString(
                                                              "en-IN"
                                                          )
                                                        : "-"}
                                                </td>

                                                <td>
                                                    <span className="journal-branch-name">
                                                        {getBranchName(
                                                            journal.branch
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="journal-reference-badge">
                                                        {journal.referenceType ||
                                                            "MANUAL"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="journal-description">
                                                        {journal.description ||
                                                            "—"}
                                                    </span>
                                                </td>

                                                <td className="amount-column">
                                                    ₹
                                                    {formatAmount(
                                                        journal.totalDebit
                                                    )}
                                                </td>

                                                <td className="amount-column">
                                                    ₹
                                                    {formatAmount(
                                                        journal.totalCredit
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={getStatusClass(
                                                            journal.status
                                                        )}
                                                    >
                                                        {
                                                            journal.status
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="journal-actions">
                                                        <button
                                                            type="button"
                                                            className="journal-action-btn view"
                                                            title="View"
                                                            onClick={() =>
                                                                handleView(
                                                                    journal
                                                                )
                                                            }
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {journal.status ===
                                                            "DRAFT" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="journal-action-btn edit"
                                                                    title="Edit"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            journal
                                                                        )
                                                                    }
                                                                >
                                                                    <FiEdit2 />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="journal-action-btn post"
                                                                    title="Post"
                                                                    onClick={() =>
                                                                        handlePost(
                                                                            journal
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <FiSend />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="journal-action-btn delete"
                                                                    title="Delete"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            journal
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        actionLoading
                                                                    }
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </>
                                                        )}

                                                        {journal.status !==
                                                            "CANCELLED" && (
                                                            <button
                                                                type="button"
                                                                className="journal-action-btn cancel"
                                                                title="Cancel"
                                                                onClick={() =>
                                                                    handleCancel(
                                                                        journal
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                            >
                                                                <FiXCircle />
                                                            </button>
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

                        <div className="journal-pagination">
                            <div className="journal-pagination-info">
                                Showing{" "}
                                <strong>
                                    {journalEntries.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        pagination.total
                                    }
                                </strong>{" "}
                                entries
                            </div>

                            <div className="journal-pagination-controls">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(
                                            page - 1
                                        )
                                    }
                                    disabled={
                                        page <= 1
                                    }
                                >
                                    <FiChevronLeft />
                                </button>

                                <span>
                                    Page{" "}
                                    <strong>
                                        {page}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {Math.max(
                                            pagination.totalPages ||
                                                1,
                                            1
                                        )}
                                    </strong>
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(
                                            page + 1
                                        )
                                    }
                                    disabled={
                                        page >=
                                        Math.max(
                                            pagination.totalPages ||
                                                1,
                                            1
                                        )
                                    }
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* =================================================
                Create / Edit Modal
            ================================================= */}

            {showModal && (
                <div className="journal-modal-overlay">
                    <div className="journal-modal journal-entry-form-modal">
                        <div className="journal-modal-header">
                            <div>
                                <h2>
                                    {editingJournal
                                        ? "Edit Journal Entry"
                                        : "New Journal Entry"}
                                </h2>

                                <p>
                                    {editingJournal
                                        ? editingJournal.journalNumber
                                        : "Create a new accounting journal entry"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="journal-modal-close"
                                onClick={
                                    closeModal
                                }
                            >
                                <FiXCircle />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="journal-form"
                        >
                            <div className="journal-modal-body">
                                {/* Header fields */}

                                <div className="journal-form-grid">
                                    <div className="journal-form-group">
                                        <label>
                                            Company{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={
                                                formData.company
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFormCompanyChange(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                !!editingJournal
                                            }
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
                                                        {getCompanyName(
                                                            company
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="journal-form-group">
                                        <label>
                                            Branch{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={
                                                formData.branch
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFormBranchChange(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                !formData.company ||
                                                !!editingJournal
                                            }
                                        >
                                            <option value="">
                                                Select Branch
                                            </option>

                                            {branches.map(
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
                                                        {getBranchName(
                                                            branch
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="journal-form-group">
                                        <label>
                                            Journal Date{" "}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                formData.journalDate
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFieldChange(
                                                    "journalDate",
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="journal-form-group">
                                        <label>
                                            Reference Type
                                        </label>

                                        <select
                                            value={
                                                formData.referenceType
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFieldChange(
                                                    "referenceType",
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            {REFERENCE_TYPES.map(
                                                (
                                                    type
                                                ) => (
                                                    <option
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="journal-form-group">
                                        <label>
                                            Reference ID
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Optional reference ID"
                                            value={
                                                formData.referenceId
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFieldChange(
                                                    "referenceId",
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="journal-form-group journal-form-full">
                                        <label>
                                            Description
                                        </label>

                                        <textarea
                                            rows="2"
                                            placeholder="Journal description..."
                                            value={
                                                formData.description
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFieldChange(
                                                    "description",
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Journal Lines */}

                                <div className="journal-lines-section">
                                    <div className="journal-lines-header">
                                        <div>
                                            <h3>
                                                Journal Lines
                                            </h3>

                                            <p>
                                                Debit and credit
                                                totals must match.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="journal-add-line-btn"
                                            onClick={
                                                addLine
                                            }
                                        >
                                            <FiPlus />
                                            Add Line
                                        </button>
                                    </div>

                                    <div className="journal-lines-table-wrapper">
                                        <table className="journal-lines-table">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        #
                                                    </th>

                                                    <th>
                                                        Account
                                                    </th>

                                                    <th>
                                                        Description
                                                    </th>

                                                    <th>
                                                        Debit
                                                    </th>

                                                    <th>
                                                        Credit
                                                    </th>

                                                    <th>
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {formData.entries.map(
                                                    (
                                                        line,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                index
                                                            }
                                                        >
                                                            <td>
                                                                <span className="journal-line-number">
                                                                    {index +
                                                                        1}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <select
                                                                    value={
                                                                        line.account
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleLineChange(
                                                                            index,
                                                                            "account",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !formData.company
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Select Account
                                                                    </option>

                                                                    {accounts.map(
                                                                        (
                                                                            account
                                                                        ) => (
                                                                            <option
                                                                                key={getId(
                                                                                    account
                                                                                )}
                                                                                value={getId(
                                                                                    account
                                                                                )}
                                                                            >
                                                                                {account.accountCode}{" "}
                                                                                -{" "}
                                                                                {
                                                                                    account.accountName
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Line description"
                                                                    value={
                                                                        line.description
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleLineChange(
                                                                            index,
                                                                            "description",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    value={
                                                                        line.debit
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleLineChange(
                                                                            index,
                                                                            "debit",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    value={
                                                                        line.credit
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleLineChange(
                                                                            index,
                                                                            "credit",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="journal-remove-line-btn"
                                                                    onClick={() =>
                                                                        removeLine(
                                                                            index
                                                                        )
                                                                    }
                                                                    title="Remove line"
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>

                                            <tfoot>
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                    >
                                                        Total
                                                    </td>

                                                    <td>
                                                        ₹
                                                        {formatAmount(
                                                            totals.debit
                                                        )}
                                                    </td>

                                                    <td>
                                                        ₹
                                                        {formatAmount(
                                                            totals.credit
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                totals.balanced
                                                                    ? "journal-balance-ok"
                                                                    : "journal-balance-error"
                                                            }
                                                        >
                                                            {totals.balanced
                                                                ? "Balanced"
                                                                : "Not Balanced"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="journal-modal-footer">
                                <div className="journal-footer-summary">
                                    <span>
                                        Difference:
                                    </span>

                                    <strong
                                        className={
                                            totals.balanced
                                                ? "balanced"
                                                : "unbalanced"
                                        }
                                    >
                                        ₹
                                        {Math.abs(
                                            totals.difference
                                        ).toFixed(
                                            2
                                        )}
                                    </strong>
                                </div>

                                <div className="journal-footer-actions">
                                    <button
                                        type="button"
                                        className="journal-secondary-btn"
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
                                        className="journal-primary-btn"
                                        disabled={
                                            saving
                                        }
                                    >
                                        {saving ? (
                                            <>
                                                <span className="journal-btn-spinner" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheckCircle />
                                                {editingJournal
                                                    ? "Update Journal"
                                                    : "Create Journal"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                View Modal
            ================================================= */}

            {showViewModal &&
                selectedJournal && (
                    <div className="journal-modal-overlay">
                        <div className="journal-modal journal-view-modal">
                            <div className="journal-modal-header">
                                <div>
                                    <h2>
                                        Journal Entry Details
                                    </h2>

                                    <p>
                                        {
                                            selectedJournal.journalNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="journal-modal-close"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FiXCircle />
                                </button>
                            </div>

                            <div className="journal-modal-body">
                                <div className="journal-detail-grid">
                                    <div>
                                        <span>
                                            Journal Number
                                        </span>

                                        <strong>
                                            {
                                                selectedJournal.journalNumber
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Date
                                        </span>

                                        <strong>
                                            {selectedJournal.journalDate
                                                ? new Date(
                                                      selectedJournal.journalDate
                                                  ).toLocaleDateString(
                                                      "en-IN"
                                                  )
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {getCompanyName(
                                                selectedJournal.company
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {getBranchName(
                                                selectedJournal.branch
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Reference Type
                                        </span>

                                        <strong>
                                            {
                                                selectedJournal.referenceType
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            <span
                                                className={getStatusClass(
                                                    selectedJournal.status
                                                )}
                                            >
                                                {
                                                    selectedJournal.status
                                                }
                                            </span>
                                        </strong>
                                    </div>

                                    <div className="journal-detail-full">
                                        <span>
                                            Description
                                        </span>

                                        <strong>
                                            {selectedJournal.description ||
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="journal-view-lines">
                                    <div className="journal-lines-header">
                                        <div>
                                            <h3>
                                                Journal Lines
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="journal-lines-table-wrapper">
                                        <table className="journal-lines-table">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        #
                                                    </th>

                                                    <th>
                                                        Account
                                                    </th>

                                                    <th>
                                                        Description
                                                    </th>

                                                    <th>
                                                        Debit
                                                    </th>

                                                    <th>
                                                        Credit
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {selectedJournal.entries?.map(
                                                    (
                                                        line,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                index
                                                            }
                                                        >
                                                            <td>
                                                                {
                                                                    index +
                                                                    1
                                                                }
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {getAccountName(
                                                                        line.account
                                                                    )}
                                                                </strong>
                                                            </td>

                                                            <td>
                                                                {line.description ||
                                                                    "—"}
                                                            </td>

                                                            <td>
                                                                ₹
                                                                {formatAmount(
                                                                    line.debit
                                                                )}
                                                            </td>

                                                            <td>
                                                                ₹
                                                                {formatAmount(
                                                                    line.credit
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>

                                            <tfoot>
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                    >
                                                        Total
                                                    </td>

                                                    <td>
                                                        ₹
                                                        {formatAmount(
                                                            selectedJournal.totalDebit
                                                        )}
                                                    </td>

                                                    <td>
                                                        ₹
                                                        {formatAmount(
                                                            selectedJournal.totalCredit
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {selectedJournal.status ===
                                    "POSTED" &&
                                    selectedJournal.postedAt && (
                                        <div className="journal-info-box posted">
                                            <FiCheckCircle />

                                            <div>
                                                <strong>
                                                    Posted
                                                </strong>

                                                <span>
                                                    {new Date(
                                                        selectedJournal.postedAt
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                {selectedJournal.status ===
                                    "CANCELLED" && (
                                    <div className="journal-info-box cancelled">
                                        <FiXCircle />

                                        <div>
                                            <strong>
                                                Cancelled
                                            </strong>

                                            {selectedJournal.cancelledAt && (
                                                <span>
                                                    {new Date(
                                                        selectedJournal.cancelledAt
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            )}

                                            {selectedJournal.cancellationReason && (
                                                <span>
                                                    Reason:{" "}
                                                    {
                                                        selectedJournal.cancellationReason
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="journal-modal-footer">
                                <button
                                    type="button"
                                    className="journal-secondary-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                {selectedJournal.status ===
                                    "DRAFT" && (
                                    <>
                                        <button
                                            type="button"
                                            className="journal-secondary-btn"
                                            onClick={() => {
                                                closeViewModal();
                                                handleEdit(
                                                    selectedJournal
                                                );
                                            }}
                                        >
                                            <FiEdit2 />
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="journal-primary-btn"
                                            onClick={() =>
                                                handlePost(
                                                    selectedJournal
                                                )
                                            }
                                        >
                                            <FiSend />
                                            Post Journal
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default JournalEntries;