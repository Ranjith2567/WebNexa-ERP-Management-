import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiPower,
    FiBookOpen,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiRefreshCw,
    FiAlertCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/accounts.css";

const ACCOUNT_TYPES = [
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "INCOME",
    "EXPENSE",
];

const INITIAL_FORM = {
    company: "",
    accountCode: "",
    accountName: "",
    accountType: "ASSET",
    parentAccount: "",
    description: "",
    openingBalance: 0,
    isActive: true,
};

const Account = () => {
    // ======================================================
    // State
    // ======================================================

    const [accounts, setAccounts] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [masterLoading, setMasterLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [accountTypeFilter, setAccountTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
    });

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingAccount, setEditingAccount] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const [formData, setFormData] = useState(INITIAL_FORM);

    // ======================================================
    // Helpers
    // ======================================================

    const getCompanyId = (company) => {
        if (!company) return "";

        if (typeof company === "string") {
            return company;
        }

        return company._id || company.id || "";
    };

    const getCompanyName = (company) => {
        if (!company) return "-";

        if (typeof company === "string") {
            const found = companies.find(
                (item) =>
                    item._id === company ||
                    item.id === company
            );

            return (
                found?.name ||
                found?.legalName ||
                company
            );
        }

        return (
            company.name ||
            company.legalName ||
            "-"
        );
    };

    const getParentName = (parentAccount) => {
        if (!parentAccount) return "-";

        if (typeof parentAccount === "string") {
            const parent = accounts.find(
                (item) =>
                    item._id === parentAccount
            );

            return (
                parent?.accountName ||
                parentAccount
            );
        }

        return (
            parentAccount.accountName ||
            "-"
        );
    };

    const formatCurrency = (value) => {
        const amount = Number(value || 0);

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getAccountTypeClass = (type) => {
        switch (type) {
            case "ASSET":
                return "account-type asset";

            case "LIABILITY":
                return "account-type liability";

            case "EQUITY":
                return "account-type equity";

            case "INCOME":
                return "account-type income";

            case "EXPENSE":
                return "account-type expense";

            default:
                return "account-type";
        }
    };

    const getErrorMessage = (err, fallback) => {
        return (
            err?.response?.data?.message ||
            err?.message ||
            fallback
        );
    };

    // ======================================================
    // Fetch Companies
    // ======================================================

    const fetchCompanies = async () => {
        try {
            setMasterLoading(true);

            const response = await api.get(
                "/companies"
            );

            const data = response?.data;

            let companyList = [];

            if (Array.isArray(data)) {
                companyList = data;
            } else if (Array.isArray(data?.data)) {
                companyList = data.data;
            } else if (
                Array.isArray(data?.companies)
            ) {
                companyList = data.companies;
            }

            setCompanies(companyList);
        } catch (err) {
            console.error(
                "Fetch Companies Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to load companies."
                )
            );
        } finally {
            setMasterLoading(false);
        }
    };

    // ======================================================
    // Fetch Accounts
    // ======================================================

    const fetchAccounts = async (
        requestedPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            if (!companyFilter) {
                setAccounts([]);
                setPagination({
                    total: 0,
                    page: 1,
                    limit: 20,
                    pages: 0,
                });

                return;
            }

            const params = {
                company: companyFilter,
                page: requestedPage,
                limit: 20,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (accountTypeFilter) {
                params.accountType =
                    accountTypeFilter;
            }

            if (statusFilter !== "") {
                params.isActive =
                    statusFilter;
            }

            const response = await api.get(
                "/accounts",
                {
                    params,
                }
            );

            const responseData =
                response?.data || {};

            const accountList =
                Array.isArray(
                    responseData.data
                )
                    ? responseData.data
                    : [];

            setAccounts(accountList);

            setPagination(
                responseData.pagination || {
                    total: accountList.length,
                    page: requestedPage,
                    limit: 20,
                    pages: 1,
                }
            );
        } catch (err) {
            console.error(
                "Fetch Accounts Error:",
                err
            );

            setAccounts([]);

            setError(
                getErrorMessage(
                    err,
                    "Failed to fetch accounts."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // Initial Load
    // ======================================================

    useEffect(() => {
        fetchCompanies();
    }, []);

    // ======================================================
    // Load Accounts
    // ======================================================

    useEffect(() => {
        if (!companyFilter) {
            setLoading(false);
            setAccounts([]);
            return;
        }

        fetchAccounts(page);
    }, [
        companyFilter,
        page,
        accountTypeFilter,
        statusFilter,
    ]);

    // ======================================================
    // Search Debounce
    // ======================================================

    useEffect(() => {
        if (!companyFilter) return;

        const timer = setTimeout(() => {
            setPage(1);
            fetchAccounts(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    // ======================================================
    // Clear Messages
    // ======================================================

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3500);

        return () => clearTimeout(timer);
    }, [success]);

    // ======================================================
    // Filter Parent Accounts
    // ======================================================

    const availableParentAccounts = useMemo(() => {
        if (!formData.company) {
            return [];
        }

        return accounts.filter((account) => {
            const accountCompany =
                getCompanyId(account.company);

            return (
                accountCompany ===
                    formData.company &&
                account._id !==
                    editingAccount?._id &&
                account.isActive !== false
            );
        });
    }, [
        accounts,
        formData.company,
        editingAccount,
    ]);

    // ======================================================
    // Handle Input
    // ======================================================

    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // ======================================================
    // Open Add Modal
    // ======================================================

    const handleAdd = () => {
        setEditingAccount(null);

        setFormData({
            ...INITIAL_FORM,
            company:
                companyFilter ||
                companies[0]?._id ||
                "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ======================================================
    // Open Edit Modal
    // ======================================================

    const handleEdit = (account) => {
        if (account.isSystemAccount) {
            setError(
                "System accounts cannot be modified."
            );
            return;
        }

        setEditingAccount(account);

        setFormData({
            company:
                getCompanyId(account.company),
            accountCode:
                account.accountCode || "",
            accountName:
                account.accountName || "",
            accountType:
                account.accountType || "ASSET",
            parentAccount:
                getCompanyId(
                    account.parentAccount
                ),
            description:
                account.description || "",
            openingBalance:
                account.openingBalance ?? 0,
            isActive:
                account.isActive !== false,
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ======================================================
    // Open View Modal
    // ======================================================

    const handleView = async (account) => {
        try {
            setError("");

            const response = await api.get(
                `/accounts/${account._id}`
            );

            setSelectedAccount(
                response?.data?.data ||
                    account
            );
        } catch (err) {
            console.error(
                "Fetch Account Error:",
                err
            );

            setSelectedAccount(account);

            setError(
                getErrorMessage(
                    err,
                    "Failed to fetch account details."
                )
            );
        }

        setShowViewModal(true);
    };

    // ======================================================
    // Close Modal
    // ======================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingAccount(null);
        setFormData(INITIAL_FORM);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedAccount(null);
    };

    // ======================================================
    // Submit Account
    // ======================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.company) {
            setError("Company is required.");
            return;
        }

        if (!formData.accountCode.trim()) {
            setError(
                "Account code is required."
            );
            return;
        }

        if (!formData.accountName.trim()) {
            setError(
                "Account name is required."
            );
            return;
        }

        if (
            !ACCOUNT_TYPES.includes(
                formData.accountType
            )
        ) {
            setError(
                "Please select a valid account type."
            );
            return;
        }

        const openingBalance =
            Number(formData.openingBalance);

        if (
            Number.isNaN(openingBalance) ||
            openingBalance < 0
        ) {
            setError(
                "Opening balance must be a valid positive number."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingAccount) {
                const payload = {
                    accountName:
                        formData.accountName.trim(),
                    accountType:
                        formData.accountType,
                    parentAccount:
                        formData.parentAccount ||
                        null,
                    description:
                        formData.description.trim(),
                    isActive:
                        Boolean(
                            formData.isActive
                        ),
                    openingBalance,
                };

                const response =
                    await api.patch(
                        `/accounts/${editingAccount._id}`,
                        payload
                    );

                setSuccess(
                    response?.data?.message ||
                        "Account updated successfully."
                );
            } else {
                const payload = {
                    company:
                        formData.company,
                    accountCode:
                        formData.accountCode
                            .trim()
                            .toUpperCase(),
                    accountName:
                        formData.accountName.trim(),
                    accountType:
                        formData.accountType,
                    parentAccount:
                        formData.parentAccount ||
                        null,
                    description:
                        formData.description.trim(),
                    openingBalance,
                };

                const response =
                    await api.post(
                        "/accounts",
                        payload
                    );

                setSuccess(
                    response?.data?.message ||
                        "Account created successfully."
                );
            }

            closeModal();

            setPage(1);

            await fetchAccounts(1);
        } catch (err) {
            console.error(
                "Save Account Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    editingAccount
                        ? "Failed to update account."
                        : "Failed to create account."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // Deactivate Account
    // ======================================================

    const handleDeactivate = async (
        account
    ) => {
        if (account.isSystemAccount) {
            setError(
                "System accounts cannot be deactivated."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to deactivate "${account.accountName}"?`
            );

        if (!confirmed) return;

        try {
            setError("");

            const response =
                await api.patch(
                    `/accounts/${account._id}/deactivate`
                );

            setSuccess(
                response?.data?.message ||
                    "Account deactivated successfully."
            );

            await fetchAccounts(page);
        } catch (err) {
            console.error(
                "Deactivate Account Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to deactivate account."
                )
            );
        }
    };

    // ======================================================
    // Delete Account
    // ======================================================

    const handleDelete = async (account) => {
        if (account.isSystemAccount) {
            setError(
                "System accounts cannot be deleted."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${account.accountName}"?`
            );

        if (!confirmed) return;

        try {
            setError("");

            const response =
                await api.delete(
                    `/accounts/${account._id}`
                );

            setSuccess(
                response?.data?.message ||
                    "Account deleted successfully."
            );

            const nextPage =
                accounts.length === 1 &&
                page > 1
                    ? page - 1
                    : page;

            setPage(nextPage);

            await fetchAccounts(
                nextPage
            );
        } catch (err) {
            console.error(
                "Delete Account Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to delete account."
                )
            );
        }
    };

    // ======================================================
    // Refresh
    // ======================================================

    const handleRefresh = () => {
        if (!companyFilter) return;

        fetchAccounts(page);
    };

    // ======================================================
    // Pagination
    // ======================================================

    const handlePreviousPage = () => {
        if (page <= 1) return;

        setPage((prev) => prev - 1);
    };

    const handleNextPage = () => {
        if (
            pagination.pages &&
            page >= pagination.pages
        ) {
            return;
        }

        setPage((prev) => prev + 1);
    };

    // ======================================================
    // Render
    // ======================================================

    return (
        <div className="accounts-page">

            {/* ==========================================
                Header
            ========================================== */}

            <div className="accounts-page-header">

                <div className="accounts-page-title">

                    <div className="accounts-title-icon">
                        <FiBookOpen />
                    </div>

                    <div>
                        <h1>Accounts</h1>

                        <p>
                            Manage chart of accounts
                            and financial accounts
                        </p>
                    </div>

                </div>

                <div className="accounts-header-actions">

                    <button
                        type="button"
                        className="accounts-refresh-btn"
                        onClick={handleRefresh}
                        disabled={
                            loading ||
                            !companyFilter
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "accounts-spin"
                                    : ""
                            }
                        />
                    </button>

                    <button
                        type="button"
                        className="accounts-primary-btn"
                        onClick={handleAdd}
                        disabled={
                            masterLoading ||
                            companies.length === 0
                        }
                    >
                        <FiPlus />
                        Add Account
                    </button>

                </div>

            </div>

            {/* ==========================================
                Messages
            ========================================== */}

            {error && (
                <div className="accounts-alert accounts-alert-error">
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

            {success && (
                <div className="accounts-alert accounts-alert-success">
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

            {/* ==========================================
                Filters
            ========================================== */}

            <div className="accounts-filter-card">

                <div className="accounts-search-box">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search account code or name..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        disabled={
                            !companyFilter
                        }
                    />

                </div>

                <div className="accounts-filter-group">

                    <label>Company</label>

                    <select
                        value={companyFilter}
                        onChange={(event) => {
                            setCompanyFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            Select Company
                        </option>

                        {companies.map(
                            (company) => (
                                <option
                                    key={
                                        company._id
                                    }
                                    value={
                                        company._id
                                    }
                                >
                                    {company.name ||
                                        company.legalName}
                                </option>
                            )
                        )}
                    </select>

                </div>

                <div className="accounts-filter-group">

                    <label>Account Type</label>

                    <select
                        value={
                            accountTypeFilter
                        }
                        onChange={(event) => {
                            setAccountTypeFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !companyFilter
                        }
                    >
                        <option value="">
                            All Types
                        </option>

                        {ACCOUNT_TYPES.map(
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

                <div className="accounts-filter-group">

                    <label>Status</label>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !companyFilter
                        }
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="true">
                            Active
                        </option>

                        <option value="false">
                            Inactive
                        </option>
                    </select>

                </div>

            </div>

            {/* ==========================================
                No Company Selected
            ========================================== */}

            {!companyFilter &&
                !loading && (
                    <div className="accounts-empty-state">

                        <div className="accounts-empty-icon">
                            <FiBookOpen />
                        </div>

                        <h3>
                            Select a company
                        </h3>

                        <p>
                            Select a company above
                            to view its accounts.
                        </p>

                    </div>
                )}

            {/* ==========================================
                Account Table
            ========================================== */}

            {companyFilter && (
                <div className="accounts-table-card">

                    <div className="accounts-table-header">

                        <div>
                            <h2>
                                Chart of Accounts
                            </h2>

                            <span>
                                {pagination.total ||
                                    0}{" "}
                                account
                                {pagination.total ===
                                1
                                    ? ""
                                    : "s"}
                            </span>
                        </div>

                    </div>

                    {loading ? (
                        <div className="accounts-loading">

                            <div className="accounts-spinner"></div>

                            <p>
                                Loading accounts...
                            </p>

                        </div>
                    ) : accounts.length ===
                      0 ? (
                        <div className="accounts-empty-state accounts-table-empty">

                            <div className="accounts-empty-icon">
                                <FiBookOpen />
                            </div>

                            <h3>
                                No accounts found
                            </h3>

                            <p>
                                No accounts match
                                the selected
                                filters.
                            </p>

                            <button
                                type="button"
                                className="accounts-primary-btn"
                                onClick={
                                    handleAdd
                                }
                            >
                                <FiPlus />
                                Add Account
                            </button>

                        </div>
                    ) : (
                        <div className="accounts-table-wrapper">

                            <table className="accounts-table">

                                <thead>
                                    <tr>
                                        <th>
                                            Code
                                        </th>

                                        <th>
                                            Account
                                        </th>

                                        <th>
                                            Type
                                        </th>

                                        <th>
                                            Parent
                                        </th>

                                        <th>
                                            Opening Balance
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th className="accounts-actions-column">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {accounts.map(
                                        (
                                            account
                                        ) => (
                                            <tr
                                                key={
                                                    account._id
                                                }
                                            >

                                                <td>
                                                    <span className="account-code">
                                                        {
                                                            account.accountCode
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="account-name-cell">

                                                        <div className="account-row-icon">
                                                            <FiBookOpen />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    account.accountName
                                                                }
                                                            </strong>

                                                            {account.description && (
                                                                <small>
                                                                    {
                                                                        account.description
                                                                    }
                                                                </small>
                                                            )}
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    <span
                                                        className={getAccountTypeClass(
                                                            account.accountType
                                                        )}
                                                    >
                                                        {
                                                            account.accountType
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="account-parent">
                                                        {getParentName(
                                                            account.parentAccount
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="account-balance">
                                                        {formatCurrency(
                                                            account.openingBalance
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    {account.isActive !==
                                                    false ? (
                                                        <span className="account-status active">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="account-status inactive">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                <td>

                                                    <div className="account-actions">

                                                        <button
                                                            type="button"
                                                            className="account-action-btn view"
                                                            onClick={() =>
                                                                handleView(
                                                                    account
                                                                )
                                                            }
                                                            title="View"
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="account-action-btn edit"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    account
                                                                )
                                                            }
                                                            disabled={
                                                                account.isSystemAccount
                                                            }
                                                            title={
                                                                account.isSystemAccount
                                                                    ? "System account cannot be modified"
                                                                    : "Edit"
                                                            }
                                                        >
                                                            <FiEdit2 />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="account-action-btn deactivate"
                                                            onClick={() =>
                                                                handleDeactivate(
                                                                    account
                                                                )
                                                            }
                                                            disabled={
                                                                account.isSystemAccount ||
                                                                account.isActive ===
                                                                    false
                                                            }
                                                            title={
                                                                account.isSystemAccount
                                                                    ? "System account cannot be deactivated"
                                                                    : account.isActive ===
                                                                      false
                                                                    ? "Already inactive"
                                                                    : "Deactivate"
                                                            }
                                                        >
                                                            <FiPower />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="account-action-btn delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    account
                                                                )
                                                            }
                                                            disabled={
                                                                account.isSystemAccount
                                                            }
                                                            title={
                                                                account.isSystemAccount
                                                                    ? "System account cannot be deleted"
                                                                    : "Delete"
                                                            }
                                                        >
                                                            <FiTrash2 />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                    {/* ======================================
                        Pagination
                    ====================================== */}

                    {!loading &&
                        accounts.length >
                            0 &&
                        pagination.pages >
                            1 && (
                            <div className="accounts-pagination">

                                <div className="accounts-pagination-info">
                                    Showing page{" "}
                                    <strong>
                                        {pagination.page ||
                                            page}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {
                                            pagination.pages
                                        }
                                    </strong>
                                </div>

                                <div className="accounts-pagination-buttons">

                                    <button
                                        type="button"
                                        onClick={
                                            handlePreviousPage
                                        }
                                        disabled={
                                            page <=
                                            1
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
                                            page >=
                                            pagination.pages
                                        }
                                    >
                                        Next
                                        <FiChevronRight />
                                    </button>

                                </div>

                            </div>
                        )}

                </div>
            )}

            {/* ==========================================
                Add / Edit Modal
            ========================================== */}

            {showModal && (
                <div
                    className="accounts-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="accounts-modal">

                        <div className="accounts-modal-header">

                            <div>
                                <h2>
                                    {editingAccount
                                        ? "Edit Account"
                                        : "Add Account"}
                                </h2>

                                <p>
                                    {editingAccount
                                        ? "Update account details"
                                        : "Create a new financial account"}
                                </p>
                            </div>

                            <button
                                type="button"
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
                        >

                            <div className="accounts-modal-body">

                                {/* Company */}

                                <div className="accounts-form-group">

                                    <label>
                                        Company
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
                                            handleChange
                                        }
                                        disabled={
                                            Boolean(
                                                editingAccount
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
                                                    key={
                                                        company._id
                                                    }
                                                    value={
                                                        company._id
                                                    }
                                                >
                                                    {company.name ||
                                                        company.legalName}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {editingAccount && (
                                        <small className="accounts-form-hint">
                                            Company cannot be changed after account creation.
                                        </small>
                                    )}

                                </div>

                                <div className="accounts-form-row">

                                    {/* Account Code */}

                                    <div className="accounts-form-group">

                                        <label>
                                            Account Code
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            name="accountCode"
                                            value={
                                                formData.accountCode
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. 1000"
                                            maxLength={
                                                50
                                            }
                                            disabled={
                                                Boolean(
                                                    editingAccount
                                                )
                                            }
                                            required
                                        />

                                        {editingAccount && (
                                            <small className="accounts-form-hint">
                                                Account code cannot be changed.
                                            </small>
                                        )}

                                    </div>

                                    {/* Account Type */}

                                    <div className="accounts-form-group">

                                        <label>
                                            Account Type
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="accountType"
                                            value={
                                                formData.accountType
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >
                                            {ACCOUNT_TYPES.map(
                                                (
                                                    type
                                                ) => (
                                                    <option
                                                        key={
                                                            type
                                                        }
                                                        value={
                                                            type
                                                        }
                                                    >
                                                        {
                                                            type
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                </div>

                                {/* Account Name */}

                                <div className="accounts-form-group">

                                    <label>
                                        Account Name
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        name="accountName"
                                        value={
                                            formData.accountName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter account name"
                                        maxLength={
                                            150
                                        }
                                        required
                                    />

                                </div>

                                {/* Parent Account */}

                                <div className="accounts-form-group">

                                    <label>
                                        Parent Account
                                    </label>

                                    <select
                                        name="parentAccount"
                                        value={
                                            formData.parentAccount
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !formData.company
                                        }
                                    >
                                        <option value="">
                                            No Parent Account
                                        </option>

                                        {availableParentAccounts.map(
                                            (
                                                account
                                            ) => (
                                                <option
                                                    key={
                                                        account._id
                                                    }
                                                    value={
                                                        account._id
                                                    }
                                                >
                                                    {
                                                        account.accountCode
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        account.accountName
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <small className="accounts-form-hint">
                                        Only active accounts from the selected company are shown.
                                    </small>

                                </div>

                                {/* Opening Balance */}

                                <div className="accounts-form-group">

                                    <label>
                                        Opening Balance
                                    </label>

                                    <input
                                        type="number"
                                        name="openingBalance"
                                        value={
                                            formData.openingBalance
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />

                                </div>

                                {/* Description */}

                                <div className="accounts-form-group">

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
                                        placeholder="Enter account description"
                                        rows="4"
                                        maxLength={
                                            500
                                        }
                                    />

                                    <small className="accounts-character-count">
                                        {
                                            formData
                                                .description
                                                .length
                                        }{" "}
                                        / 500
                                    </small>

                                </div>

                                {/* Active */}

                                {editingAccount && (
                                    <label className="accounts-checkbox-row">

                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={
                                                formData.isActive
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <span>
                                            Account is active
                                        </span>

                                    </label>
                                )}

                            </div>

                            <div className="accounts-modal-footer">

                                <button
                                    type="button"
                                    className="accounts-secondary-btn"
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
                                    className="accounts-primary-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <span className="accounts-button-spinner"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus />
                                            {editingAccount
                                                ? "Update Account"
                                                : "Create Account"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ==========================================
                View Modal
            ========================================== */}

            {showViewModal &&
                selectedAccount && (
                    <div
                        className="accounts-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >

                        <div className="accounts-view-modal">

                            <div className="accounts-modal-header">

                                <div>
                                    <h2>
                                        Account Details
                                    </h2>

                                    <p>
                                        View account information
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FiX />
                                </button>

                            </div>

                            <div className="accounts-view-body">

                                <div className="accounts-view-title">

                                    <div className="accounts-view-icon">
                                        <FiBookOpen />
                                    </div>

                                    <div>
                                        <h3>
                                            {
                                                selectedAccount.accountName
                                            }
                                        </h3>

                                        <span>
                                            {
                                                selectedAccount.accountCode
                                            }
                                        </span>
                                    </div>

                                </div>

                                <div className="accounts-view-grid">

                                    <div className="accounts-detail-item">

                                        <label>
                                            Company
                                        </label>

                                        <strong>
                                            {getCompanyName(
                                                selectedAccount.company
                                            )}
                                        </strong>

                                    </div>

                                    <div className="accounts-detail-item">

                                        <label>
                                            Account Type
                                        </label>

                                        <span
                                            className={getAccountTypeClass(
                                                selectedAccount.accountType
                                            )}
                                        >
                                            {
                                                selectedAccount.accountType
                                            }
                                        </span>

                                    </div>

                                    <div className="accounts-detail-item">

                                        <label>
                                            Parent Account
                                        </label>

                                        <strong>
                                            {getParentName(
                                                selectedAccount.parentAccount
                                            )}
                                        </strong>

                                    </div>

                                    <div className="accounts-detail-item">

                                        <label>
                                            Opening Balance
                                        </label>

                                        <strong>
                                            {formatCurrency(
                                                selectedAccount.openingBalance
                                            )}
                                        </strong>

                                    </div>

                                    <div className="accounts-detail-item">

                                        <label>
                                            Status
                                        </label>

                                        {selectedAccount.isActive !==
                                        false ? (
                                            <span className="account-status active">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="account-status inactive">
                                                Inactive
                                            </span>
                                        )}

                                    </div>

                                    <div className="accounts-detail-item">

                                        <label>
                                            System Account
                                        </label>

                                        <strong>
                                            {selectedAccount.isSystemAccount
                                                ? "Yes"
                                                : "No"}
                                        </strong>

                                    </div>

                                </div>

                                <div className="accounts-description-box">

                                    <label>
                                        Description
                                    </label>

                                    <p>
                                        {selectedAccount.description ||
                                            "No description provided."}
                                    </p>

                                </div>

                                <div className="accounts-view-meta">

                                    <div>
                                        <span>
                                            Created By
                                        </span>

                                        <strong>
                                            {selectedAccount
                                                .createdBy
                                                ?.name ||
                                                selectedAccount
                                                    .createdBy
                                                    ?.email ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Created
                                        </span>

                                        <strong>
                                            {selectedAccount.createdAt
                                                ? new Date(
                                                      selectedAccount.createdAt
                                                  ).toLocaleDateString(
                                                      "en-IN"
                                                  )
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Updated By
                                        </span>

                                        <strong>
                                            {selectedAccount
                                                .updatedBy
                                                ?.name ||
                                                selectedAccount
                                                    .updatedBy
                                                    ?.email ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Updated
                                        </span>

                                        <strong>
                                            {selectedAccount.updatedAt
                                                ? new Date(
                                                      selectedAccount.updatedAt
                                                  ).toLocaleDateString(
                                                      "en-IN"
                                                  )
                                                : "-"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            <div className="accounts-modal-footer">

                                <button
                                    type="button"
                                    className="accounts-secondary-btn"
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

        </div>
    );
};

export default Account;