import React, { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiRefreshCw,
    FiEye,
    FiBookOpen,
    FiCalendar,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiX,
    FiDollarSign,
    FiTrendingUp,
    FiTrendingDown,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiFileText,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/ledger.css";

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

const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getStatusClass = (status) => {
    switch (status) {
        case "POSTED":
            return "ledger-status posted";

        case "CANCELLED":
            return "ledger-status cancelled";

        case "DRAFT":
            return "ledger-status draft";

        default:
            return "ledger-status";
    }
};

const normalizeList = (payload, key) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.[key])) {
        return payload[key];
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

const normalizeCompanies = (payload) => {
    if (Array.isArray(payload)) return payload;

    if (Array.isArray(payload?.companies)) {
        return payload.companies;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

const normalizeBranches = (payload) => {
    if (Array.isArray(payload)) return payload;

    if (Array.isArray(payload?.branches)) {
        return payload.branches;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

const normalizeAccounts = (payload) => {
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.accounts)) {
        return payload.accounts;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return [];
};

const getCompanyId = (company) => {
    return company?._id || company?.id;
};

const getBranchId = (branch) => {
    return branch?._id || branch?.id;
};

const getAccountId = (account) => {
    return account?._id || account?.id;
};

const getBranchCompanyId = (branch) => {
    if (!branch?.company) return null;

    if (typeof branch.company === "object") {
        return branch.company?._id || branch.company?.id;
    }

    return branch.company;
};

const Ledger = () => {
    // =====================================================
    // MASTER DATA
    // =====================================================

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // =====================================================
    // LEDGER DATA
    // =====================================================

    const [ledgerEntries, setLedgerEntries] = useState([]);

    const [summary, setSummary] = useState({
        totalDebit: 0,
        totalCredit: 0,
        closingBalance: 0,
    });

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });

    // =====================================================
    // UI STATE
    // =====================================================

    const [loading, setLoading] = useState(true);
    const [masterLoading, setMasterLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [viewMode, setViewMode] = useState("ledger");

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // =====================================================
    // FILTERS
    // =====================================================

    const [filters, setFilters] = useState({
        company: "",
        branch: "",
        account: "",
        fromDate: "",
        toDate: "",
        search: "",
        referenceType: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        company: "",
        branch: "",
        account: "",
        fromDate: "",
        toDate: "",
        search: "",
        referenceType: "",
    });

    // =====================================================
    // LOAD MASTER DATA
    // =====================================================

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            setMasterLoading(true);
            setError("");

            const [companiesResponse, branchesResponse] =
                await Promise.all([
                    api.get("/companies"),
                    api.get("/branches"),
                ]);

            const companyPayload = companiesResponse?.data;
            const branchPayload = branchesResponse?.data;

            setCompanies(normalizeCompanies(companyPayload));
            setBranches(normalizeBranches(branchPayload));
        } catch (err) {
            console.error("Ledger master data error:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to load company and branch data."
            );
        } finally {
            setMasterLoading(false);
        }
    };

    // =====================================================
    // LOAD ACCOUNTS WHEN COMPANY CHANGES
    // =====================================================

    useEffect(() => {
        if (!filters.company) {
            setAccounts([]);
            return;
        }

        fetchAccounts(filters.company);
    }, [filters.company]);

    const fetchAccounts = async (companyId) => {
        try {
            const response = await api.get("/accounts", {
                params: {
                    company: companyId,
                    isActive: true,
                    limit: 100,
                    page: 1,
                },
            });

            setAccounts(normalizeAccounts(response?.data));
        } catch (err) {
            console.error("Ledger accounts error:", err);

            setAccounts([]);

            setError(
                err?.response?.data?.message ||
                "Failed to load accounts."
            );
        }
    };

    // =====================================================
    // FILTERED BRANCHES
    // =====================================================

    const filteredBranches = useMemo(() => {
        if (!filters.company) {
            return [];
        }

        return branches.filter((branch) => {
            const branchCompanyId =
                getBranchCompanyId(branch);

            return (
                branchCompanyId &&
                String(branchCompanyId) ===
                String(filters.company)
            );
        });
    }, [branches, filters.company]);

    // =====================================================
    // FETCH LEDGER
    // =====================================================

    useEffect(() => {
        if (!appliedFilters.company) {
            setLedgerEntries([]);
            setSummary({
                totalDebit: 0,
                totalCredit: 0,
                closingBalance: 0,
            });

            setPagination({
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
            });

            setLoading(false);
            return;
        }

        fetchLedger();
    }, [appliedFilters, pagination.page]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const endpoint =
                viewMode === "history"
                    ? "/ledger-entries/history"
                    : "/ledger-entries";

            const params = {
                company: appliedFilters.company,
                page: pagination.page,
                limit: pagination.limit,
            };

            if (appliedFilters.branch) {
                params.branch = appliedFilters.branch;
            }

            if (appliedFilters.account) {
                params.account = appliedFilters.account;
            }

            if (appliedFilters.fromDate) {
                params.fromDate = appliedFilters.fromDate;
            }

            if (appliedFilters.toDate) {
                params.toDate = appliedFilters.toDate;
            }

            if (
                viewMode === "history" &&
                appliedFilters.search
            ) {
                params.search = appliedFilters.search;
            }

            if (
                viewMode === "history" &&
                appliedFilters.referenceType
            ) {
                params.referenceType =
                    appliedFilters.referenceType;
            }

            const response = await api.get(
                endpoint,
                { params }
            );

            const responseData = response?.data;

            if (!responseData?.success) {
                throw new Error(
                    responseData?.message ||
                    "Failed to load ledger."
                );
            }

            if (viewMode === "ledger") {
                setLedgerEntries(
                    Array.isArray(responseData.data)
                        ? responseData.data
                        : []
                );

                setSummary(
                    responseData.summary || {
                        totalDebit: 0,
                        totalCredit: 0,
                        closingBalance: 0,
                    }
                );
            } else {
                setLedgerEntries(
                    Array.isArray(responseData.data)
                        ? responseData.data
                        : []
                );

                setSummary({
                    totalDebit: 0,
                    totalCredit: 0,
                    closingBalance: 0,
                });
            }

            setPagination((prev) => ({
                ...prev,
                ...(responseData.pagination || {}),
            }));
        } catch (err) {
            console.error("Ledger fetch error:", err);

            setLedgerEntries([]);

            setSummary({
                totalDebit: 0,
                totalCredit: 0,
                closingBalance: 0,
            });

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load ledger."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FILTER HANDLERS
    // =====================================================

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (field === "company") {
            setFilters((prev) => ({
                ...prev,
                company: value,
                branch: "",
                account: "",
            }));
        }
    };

    const applyFilters = () => {
        if (!filters.company) {
            setError("Please select a company.");
            return;
        }

        if (
            filters.fromDate &&
            filters.toDate &&
            filters.fromDate > filters.toDate
        ) {
            setError(
                "From date cannot be greater than To date."
            );
            return;
        }

        setError("");
        setSuccess("");

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));

        setAppliedFilters({
            ...filters,
        });
    };

    const clearFilters = () => {
        const emptyFilters = {
            company: "",
            branch: "",
            account: "",
            fromDate: "",
            toDate: "",
            search: "",
            referenceType: "",
        };

        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);

        setLedgerEntries([]);

        setSummary({
            totalDebit: 0,
            totalCredit: 0,
            closingBalance: 0,
        });

        setPagination({
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
        });

        setError("");
        setSuccess("");
    };

    const handleRefresh = () => {
        if (!appliedFilters.company) {
            fetchMasterData();
            return;
        }

        fetchLedger();
    };

    const handleViewModeChange = (mode) => {
        if (mode === viewMode) return;

        setViewMode(mode);

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));

        setError("");
        setSuccess("");
    };

    // =====================================================
    // VIEW ENTRY
    // =====================================================

    const handleViewEntry = async (entryId) => {
        try {
            setError("");

            const response = await api.get(
                `/ledger-entries/${entryId}`
            );

            const responseData = response?.data;

            if (!responseData?.success) {
                throw new Error(
                    responseData?.message ||
                    "Failed to load ledger entry."
                );
            }

            setSelectedEntry(responseData.data);
            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View ledger entry error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load ledger entry."
            );
        }
    };

    // =====================================================
    // ACCOUNT LEDGER
    // =====================================================

    const handleAccountLedger = (accountId) => {
        setFilters((prev) => ({
            ...prev,
            account: accountId,
        }));

        setAppliedFilters((prev) => ({
            ...prev,
            account: accountId,
        }));

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));
    };

    // =====================================================
    // PAGINATION
    // =====================================================

    const goToPage = (page) => {
        if (
            page < 1 ||
            page > pagination.totalPages ||
            page === pagination.page
        ) {
            return;
        }

        setPagination((prev) => ({
            ...prev,
            page,
        }));
    };

    const visiblePages = useMemo(() => {
        const totalPages = pagination.totalPages;
        const currentPage = pagination.page;

        if (!totalPages) {
            return [];
        }

        const pages = [];

        const start = Math.max(
            1,
            currentPage - 2
        );

        const end = Math.min(
            totalPages,
            currentPage + 2
        );

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }, [
        pagination.page,
        pagination.totalPages,
    ]);

    // =====================================================
    // CURRENT COMPANY / ACCOUNT
    // =====================================================

    const selectedCompany = companies.find(
        (company) =>
            String(getCompanyId(company)) ===
            String(appliedFilters.company)
    );

    const selectedAccount = accounts.find(
        (account) =>
            String(getAccountId(account)) ===
            String(appliedFilters.account)
    );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="ledger-page">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="ledger-header">
                <div>
                    <div className="ledger-title-row">
                        <div className="ledger-title-icon">
                            <FiBookOpen />
                        </div>

                        <div>
                            <h1>Ledger</h1>

                            <p>
                                View account-wise ledger and
                                transaction history
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="ledger-refresh-btn"
                    onClick={handleRefresh}
                    disabled={
                        loading ||
                        masterLoading
                    }
                >
                    <FiRefreshCw
                        className={
                            loading
                                ? "ledger-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="ledger-alert ledger-alert-error">
                    <span>{error}</span>

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
                <div className="ledger-alert ledger-alert-success">
                    <span>{success}</span>

                    <button
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* =================================================
                VIEW TABS
            ================================================= */}

            <div className="ledger-view-tabs">
                <button
                    className={
                        viewMode === "ledger"
                            ? "ledger-view-tab active"
                            : "ledger-view-tab"
                    }
                    onClick={() =>
                        handleViewModeChange(
                            "ledger"
                        )
                    }
                >
                    <FiBookOpen />

                    Account Ledger
                </button>

                <button
                    className={
                        viewMode === "history"
                            ? "ledger-view-tab active"
                            : "ledger-view-tab"
                    }
                    onClick={() =>
                        handleViewModeChange(
                            "history"
                        )
                    }
                >
                    <FiFileText />

                    Transaction History
                </button>
            </div>

            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="ledger-filter-card">
                <div className="ledger-filter-header">
                    <div>
                        <h3>
                            <FiFilter />

                            Filters
                        </h3>

                        <span>
                            Select company to view
                            ledger entries
                        </span>
                    </div>
                </div>

                <div className="ledger-filter-grid">
                    {/* COMPANY */}

                    <div className="ledger-field">
                        <label>
                            Company
                            <span>*</span>
                        </label>

                        <select
                            value={
                                filters.company
                            }
                            onChange={(e) =>
                                handleFilterChange(
                                    "company",
                                    e.target.value
                                )
                            }
                            disabled={
                                masterLoading
                            }
                        >
                            <option value="">
                                Select Company
                            </option>

                            {companies.map(
                                (company) => (
                                    <option
                                        key={getCompanyId(
                                            company
                                        )}
                                        value={getCompanyId(
                                            company
                                        )}
                                    >
                                        {company.name ||
                                            company.legalName ||
                                            "Unnamed Company"}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* BRANCH */}

                    <div className="ledger-field">
                        <label>
                            Branch
                        </label>

                        <select
                            value={
                                filters.branch
                            }
                            onChange={(e) =>
                                handleFilterChange(
                                    "branch",
                                    e.target.value
                                )
                            }
                            disabled={
                                !filters.company ||
                                masterLoading
                            }
                        >
                            <option value="">
                                All Branches
                            </option>

                            {filteredBranches.map(
                                (branch) => (
                                    <option
                                        key={getBranchId(
                                            branch
                                        )}
                                        value={getBranchId(
                                            branch
                                        )}
                                    >
                                        {branch.name ||
                                            "Unnamed Branch"}
                                        {branch.branchCode
                                            ? ` (${branch.branchCode})`
                                            : ""}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* ACCOUNT */}

                    <div className="ledger-field">
                        <label>
                            Account
                        </label>

                        <select
                            value={
                                filters.account
                            }
                            onChange={(e) =>
                                handleFilterChange(
                                    "account",
                                    e.target.value
                                )
                            }
                            disabled={
                                !filters.company
                            }
                        >
                            <option value="">
                                All Accounts
                            </option>

                            {accounts.map(
                                (account) => (
                                    <option
                                        key={getAccountId(
                                            account
                                        )}
                                        value={getAccountId(
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
                    </div>

                    {/* REFERENCE TYPE */}

                    {viewMode ===
                        "history" && (
                            <div className="ledger-field">
                                <label>
                                    Reference Type
                                </label>

                                <select
                                    value={
                                        filters.referenceType
                                    }
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "referenceType",
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
                        )}

                    {/* FROM DATE */}

                    <div className="ledger-field">
                        <label>
                            From Date
                        </label>

                        <div className="ledger-date-input">
                            <FiCalendar />

                            <input
                                type="date"
                                value={
                                    filters.fromDate
                                }
                                onChange={(e) =>
                                    handleFilterChange(
                                        "fromDate",
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* TO DATE */}

                    <div className="ledger-field">
                        <label>
                            To Date
                        </label>

                        <div className="ledger-date-input">
                            <FiCalendar />

                            <input
                                type="date"
                                value={
                                    filters.toDate
                                }
                                onChange={(e) =>
                                    handleFilterChange(
                                        "toDate",
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* SEARCH */}

                    {viewMode ===
                        "history" && (
                            <div className="ledger-field ledger-search-field">
                                <label>
                                    Search
                                </label>

                                <div className="ledger-search-input">
                                    <FiSearch />

                                    <input
                                        type="text"
                                        placeholder="Journal number or description..."
                                        value={
                                            filters.search
                                        }
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "search",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}

                    {/* ACTIONS */}

                    <div className="ledger-filter-actions">
                        <button
                            className="ledger-apply-btn"
                            onClick={
                                applyFilters
                            }
                        >
                            <FiFilter />

                            Apply Filters
                        </button>

                        <button
                            className="ledger-clear-btn"
                            onClick={
                                clearFilters
                            }
                        >
                            <FiX />

                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            {appliedFilters.company &&
                viewMode === "ledger" && (
                    <div className="ledger-summary-grid">
                        <div className="ledger-summary-card">
                            <div className="ledger-summary-icon debit">
                                <FiArrowDownLeft />
                            </div>

                            <div>
                                <span>
                                    Total Debit
                                </span>

                                <strong>
                                    ₹{" "}
                                    {formatCurrency(
                                        summary.totalDebit
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="ledger-summary-card">
                            <div className="ledger-summary-icon credit">
                                <FiArrowUpRight />
                            </div>

                            <div>
                                <span>
                                    Total Credit
                                </span>

                                <strong>
                                    ₹{" "}
                                    {formatCurrency(
                                        summary.totalCredit
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="ledger-summary-card">
                            <div className="ledger-summary-icon balance">
                                <FiDollarSign />
                            </div>

                            <div>
                                <span>
                                    Closing Balance
                                </span>

                                <strong
                                    className={
                                        summary.closingBalance >=
                                            0
                                            ? "positive-balance"
                                            : "negative-balance"
                                    }
                                >
                                    ₹{" "}
                                    {formatCurrency(
                                        Math.abs(
                                            summary.closingBalance
                                        )
                                    )}

                                    <small>
                                        {summary.closingBalance >=
                                            0
                                            ? " DR"
                                            : " CR"}
                                    </small>
                                </strong>
                            </div>
                        </div>

                        <div className="ledger-summary-card">
                            <div className="ledger-summary-icon entries">
                                <FiBookOpen />
                            </div>

                            <div>
                                <span>
                                    Transactions
                                </span>

                                <strong>
                                    {
                                        pagination.total
                                    }
                                </strong>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                ACTIVE FILTER INFO
            ================================================= */}

            {appliedFilters.company && (
                <div className="ledger-context-bar">
                    <div className="ledger-context-left">
                        <span>
                            Company:
                        </span>

                        <strong>
                            {selectedCompany?.name ||
                                selectedCompany?.legalName ||
                                "Selected Company"}
                        </strong>

                        {selectedAccount && (
                            <>
                                <span className="ledger-context-separator">
                                    /
                                </span>

                                <span>
                                    Account:
                                </span>

                                <strong>
                                    {
                                        selectedAccount.accountCode
                                    }{" "}
                                    -{" "}
                                    {
                                        selectedAccount.accountName
                                    }
                                </strong>
                            </>
                        )}
                    </div>

                    <div className="ledger-context-right">
                        {viewMode ===
                            "ledger"
                            ? "Account Ledger"
                            : "Transaction History"}
                    </div>
                </div>
            )}

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="ledger-table-card">
                <div className="ledger-table-header">
                    <div>
                        <h3>
                            {viewMode ===
                                "ledger"
                                ? "Ledger Entries"
                                : "Transaction History"}
                        </h3>

                        <p>
                            {pagination.total
                                ? `Showing ${ledgerEntries.length} of ${pagination.total} entries`
                                : "No entries found"}
                        </p>
                    </div>
                </div>

                {!appliedFilters.company ? (
                    <div className="ledger-empty-state">
                        <div className="ledger-empty-icon">
                            <FiBookOpen />
                        </div>

                        <h3>
                            Select a company
                        </h3>

                        <p>
                            Choose a company from
                            the filters to view
                            ledger transactions.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="ledger-loading-state">
                        <div className="ledger-loader" />

                        <p>
                            Loading ledger...
                        </p>
                    </div>
                ) : ledgerEntries.length ===
                    0 ? (
                    <div className="ledger-empty-state">
                        <div className="ledger-empty-icon">
                            <FiFileText />
                        </div>

                        <h3>
                            No transactions found
                        </h3>

                        <p>
                            No ledger entries match
                            the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="ledger-table-wrapper">
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Journal No.
                                    </th>

                                    <th>
                                        Account
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Reference
                                    </th>

                                    <th className="amount-column debit-column">
                                        Debit
                                    </th>

                                    <th className="amount-column credit-column">
                                        Credit
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
                                {ledgerEntries.map(
                                    (entry) => {
                                        const entryId =
                                            entry._id ||
                                            entry.id;

                                        const accountCode =
                                            entry.account
                                                ?.accountCode ||
                                            entry.accountCode ||
                                            "";

                                        const accountName =
                                            entry.account
                                                ?.accountName ||
                                            entry.accountName ||
                                            "";

                                        const journalNumber =
                                            entry.journalNumber ||
                                            entry.journalEntry
                                                ?.journalNumber ||
                                            "-";

                                        const journalStatus =
                                            entry.journalEntry
                                                ?.status ||
                                            entry.journalStatus ||
                                            "";

                                        const referenceType =
                                            entry.referenceType ||
                                            "";

                                        return (
                                            <tr
                                                key={
                                                    entryId
                                                }
                                            >
                                                <td>
                                                    <div className="ledger-date-cell">
                                                        <FiCalendar />

                                                        {formatDate(
                                                            entry.transactionDate
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <button
                                                        className="ledger-journal-link"
                                                        onClick={() =>
                                                            handleViewEntry(
                                                                entryId
                                                            )
                                                        }
                                                    >
                                                        {
                                                            journalNumber
                                                        }
                                                    </button>
                                                </td>

                                                <td>
                                                    <div className="ledger-account-cell">
                                                        <strong>
                                                            {
                                                                accountCode
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                accountName
                                                            }
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="ledger-description-cell">
                                                        {entry.description ||
                                                            entry
                                                                .journalEntry
                                                                ?.description ||
                                                            "-"}
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="ledger-reference-badge">
                                                        {
                                                            referenceType
                                                        }
                                                    </span>
                                                </td>

                                                <td className="amount-column debit-column">
                                                    {Number(
                                                        entry.debit ||
                                                        0
                                                    ) >
                                                        0
                                                        ? `₹ ${formatCurrency(
                                                            entry.debit
                                                        )}`
                                                        : "-"}
                                                </td>

                                                <td className="amount-column credit-column">
                                                    {Number(
                                                        entry.credit ||
                                                        0
                                                    ) >
                                                        0
                                                        ? `₹ ${formatCurrency(
                                                            entry.credit
                                                        )}`
                                                        : "-"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={getStatusClass(
                                                            journalStatus
                                                        )}
                                                    >
                                                        {
                                                            journalStatus
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="ledger-action-buttons">
                                                        <button
                                                            className="ledger-icon-btn view"
                                                            title="View Entry"
                                                            onClick={() =>
                                                                handleViewEntry(
                                                                    entryId
                                                                )
                                                            }
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        <button
                                                            className="ledger-icon-btn account"
                                                            title="View Account Ledger"
                                                            onClick={() =>
                                                                handleAccountLedger(
                                                                    entry
                                                                        .account
                                                                        ?._id ||
                                                                    entry.account
                                                                )
                                                            }
                                                        >
                                                            <FiBookOpen />
                                                        </button>
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

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {pagination.totalPages >
                    0 && (
                        <div className="ledger-pagination">
                            <div className="ledger-pagination-info">
                                Showing{" "}
                                <strong>
                                    {ledgerEntries.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        pagination.total
                                    }
                                </strong>{" "}
                                entries
                            </div>

                            <div className="ledger-pagination-controls">
                                <button
                                    onClick={() =>
                                        goToPage(
                                            pagination.page -
                                            1
                                        )
                                    }
                                    disabled={
                                        pagination.page <=
                                        1
                                    }
                                >
                                    <FiChevronLeft />
                                </button>

                                {visiblePages.map(
                                    (page) => (
                                        <button
                                            key={page}
                                            className={
                                                page ===
                                                    pagination.page
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    page
                                                )
                                            }
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() =>
                                        goToPage(
                                            pagination.page +
                                            1
                                        )
                                    }
                                    disabled={
                                        pagination.page >=
                                        pagination.totalPages
                                    }
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
            </div>

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {showViewModal &&
                selectedEntry && (
                    <div
                        className="ledger-modal-overlay"
                        onMouseDown={() =>
                            setShowViewModal(
                                false
                            )
                        }
                    >
                        <div
                            className="ledger-view-modal"
                            onMouseDown={(e) =>
                                e.stopPropagation()
                            }
                        >
                            <div className="ledger-modal-header">
                                <div>
                                    <div className="ledger-modal-title">
                                        <div className="ledger-modal-icon">
                                            <FiBookOpen />
                                        </div>

                                        <div>
                                            <h2>
                                                Ledger
                                                Entry
                                            </h2>

                                            <p>
                                                {selectedEntry.journalNumber ||
                                                    selectedEntry
                                                        .journalEntry
                                                        ?.journalNumber ||
                                                    "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="ledger-modal-close"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="ledger-modal-body">
                                {/* TOP DETAILS */}

                                <div className="ledger-detail-grid">
                                    <div className="ledger-detail-item">
                                        <span>
                                            Journal Number
                                        </span>

                                        <strong>
                                            {selectedEntry.journalNumber ||
                                                selectedEntry
                                                    .journalEntry
                                                    ?.journalNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Transaction
                                            Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedEntry.transactionDate
                                            )}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {selectedEntry.company
                                                ?.name ||
                                                selectedEntry
                                                    .company
                                                    ?.legalName ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .branch
                                                ?.name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Account
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .account
                                                ?.accountCode ||
                                                "-"}{" "}
                                            -{" "}
                                            {selectedEntry
                                                .account
                                                ?.accountName ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Account Type
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .account
                                                ?.accountType ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Reference
                                            Type
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .referenceType ||
                                                selectedEntry
                                                    .journalEntry
                                                    ?.referenceType ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="ledger-detail-item">
                                        <span>
                                            Journal
                                            Status
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .journalEntry
                                                ?.status ||
                                                "-"}
                                        </strong>
                                    </div>
                                </div>

                                {/* DESCRIPTION */}

                                <div className="ledger-detail-description">
                                    <span>
                                        Description
                                    </span>

                                    <p>
                                        {selectedEntry.description ||
                                            selectedEntry
                                                .journalEntry
                                                ?.description ||
                                            "No description"}
                                    </p>
                                </div>

                                {/* AMOUNT */}

                                <div className="ledger-entry-amount-grid">
                                    <div className="ledger-entry-amount debit">
                                        <div>
                                            <span>
                                                Debit
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatCurrency(
                                                    selectedEntry.debit
                                                )}
                                            </strong>
                                        </div>

                                        <FiArrowDownLeft />
                                    </div>

                                    <div className="ledger-entry-amount credit">
                                        <div>
                                            <span>
                                                Credit
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatCurrency(
                                                    selectedEntry.credit
                                                )}
                                            </strong>
                                        </div>

                                        <FiArrowUpRight />
                                    </div>
                                </div>

                                {/* REFERENCE ID */}

                                {selectedEntry.referenceId && (
                                    <div className="ledger-reference-id">
                                        <span>
                                            Reference ID
                                        </span>

                                        <strong>
                                            {
                                                selectedEntry.referenceId
                                            }
                                        </strong>
                                    </div>
                                )}
                            </div>

                            <div className="ledger-modal-footer">
                                <button
                                    className="ledger-close-btn"
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

export default Ledger;