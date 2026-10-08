import React, { useEffect, useMemo, useState } from "react";
import {
    FiBarChart2,
    FiCalendar,
    FiRefreshCw,
    FiSearch,
    FiFilter,
    FiCheckCircle,
    FiAlertCircle,
    FiDollarSign,
    FiDatabase,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/trialBalance.css";

const TrialBalance = () => {
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        totalAccounts: 0,
        totalDebit: 0,
        totalCredit: 0,
        difference: 0,
    });

    const [loading, setLoading] = useState(false);
    const [masterLoading, setMasterLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [filters, setFilters] = useState({
        company: "",
        branch: "",
        fromDate: "",
        toDate: "",
        search: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        company: "",
        branch: "",
        fromDate: "",
        toDate: "",
    });

    /* =========================
       FETCH MASTER DATA
    ========================= */

    const fetchMasterData = async () => {
        try {
            setMasterLoading(true);
            setError("");

            const [companyResponse, branchResponse] =
                await Promise.all([
                    api.get("/companies"),
                    api.get("/branches"),
                ]);

            const companyData =
                companyResponse?.data?.data ||
                companyResponse?.data?.companies ||
                (Array.isArray(companyResponse?.data)
                    ? companyResponse.data
                    : []);

            const branchData =
                branchResponse?.data?.data ||
                branchResponse?.data?.branches ||
                (Array.isArray(branchResponse?.data)
                    ? branchResponse.data
                    : []);

            setCompanies(companyData);
            setBranches(branchData);
        } catch (err) {
            console.error("Trial Balance Master Data Error:", err);

            setError(
                err?.response?.data?.message ||
                    "Failed to load company and branch data."
            );
        } finally {
            setMasterLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    /* =========================
       FILTER BRANCHES
    ========================= */

    const filteredBranches = useMemo(() => {
        if (!filters.company) {
            return [];
        }

        return branches.filter((branch) => {
            const branchCompany =
                branch.company?._id ||
                branch.company?.id ||
                branch.company;

            return String(branchCompany) === String(filters.company);
        });
    }, [branches, filters.company]);

    /* =========================
       FETCH TRIAL BALANCE
    ========================= */

    const fetchTrialBalance = async (filterValues = appliedFilters) => {
        if (!filterValues.company) {
            setData([]);
            setSummary({
                totalAccounts: 0,
                totalDebit: 0,
                totalCredit: 0,
                difference: 0,
            });
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const params = {
                company: filterValues.company,
            };

            if (filterValues.branch) {
                params.branch = filterValues.branch;
            }

            if (filterValues.fromDate) {
                params.fromDate = filterValues.fromDate;
            }

            if (filterValues.toDate) {
                params.toDate = filterValues.toDate;
            }

            const response = await api.get("/trial-balance", {
                params,
            });

            const responseData = response?.data;

            setData(
                Array.isArray(responseData?.data)
                    ? responseData.data
                    : []
            );

            setSummary({
                totalAccounts:
                    Number(
                        responseData?.summary?.totalAccounts
                    ) || 0,

                totalDebit:
                    Number(
                        responseData?.summary?.totalDebit
                    ) || 0,

                totalCredit:
                    Number(
                        responseData?.summary?.totalCredit
                    ) || 0,

                difference:
                    Number(
                        responseData?.summary?.difference
                    ) || 0,
            });

            setSuccess("Trial balance generated successfully.");
        } catch (err) {
            console.error("Trial Balance Error:", err);

            setData([]);

            setSummary({
                totalAccounts: 0,
                totalDebit: 0,
                totalCredit: 0,
                difference: 0,
            });

            setError(
                err?.response?.data?.message ||
                    "Failed to generate trial balance."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       FILTER CHANGE
    ========================= */

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "company") {
            setFilters((prev) => ({
                ...prev,
                company: value,
                branch: "",
            }));
        }
    };

    /* =========================
       APPLY FILTER
    ========================= */

    const handleApply = () => {
        setError("");
        setSuccess("");

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

        const nextFilters = {
            company: filters.company,
            branch: filters.branch,
            fromDate: filters.fromDate,
            toDate: filters.toDate,
        };

        setAppliedFilters(nextFilters);

        fetchTrialBalance(nextFilters);
    };

    /* =========================
       CLEAR FILTER
    ========================= */

    const handleClear = () => {
        setFilters({
            company: "",
            branch: "",
            fromDate: "",
            toDate: "",
            search: "",
        });

        setAppliedFilters({
            company: "",
            branch: "",
            fromDate: "",
            toDate: "",
        });

        setData([]);

        setSummary({
            totalAccounts: 0,
            totalDebit: 0,
            totalCredit: 0,
            difference: 0,
        });

        setError("");
        setSuccess("");
    };

    /* =========================
       REFRESH
    ========================= */

    const handleRefresh = () => {
        if (!appliedFilters.company) {
            fetchMasterData();
            return;
        }

        fetchTrialBalance(appliedFilters);
    };

    /* =========================
       SEARCH
    ========================= */

    const filteredData = useMemo(() => {
        const search = filters.search
            .trim()
            .toLowerCase();

        if (!search) {
            return data;
        }

        return data.filter((item) => {
            return (
                item.accountCode
                    ?.toLowerCase()
                    .includes(search) ||
                item.accountName
                    ?.toLowerCase()
                    .includes(search) ||
                item.accountType
                    ?.toLowerCase()
                    .includes(search)
            );
        });
    }, [data, filters.search]);

    /* =========================
       FORMAT MONEY
    ========================= */

    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    /* =========================
       BALANCE TYPE
    ========================= */

    const getBalanceType = (balance) => {
        const value = Number(balance || 0);

        if (value > 0) {
            return "DR";
        }

        if (value < 0) {
            return "CR";
        }

        return "—";
    };

    /* =========================
       SELECTED COMPANY / BRANCH
    ========================= */

    const selectedCompany = companies.find(
        (company) =>
            String(
                company._id || company.id
            ) === String(appliedFilters.company)
    );

    const selectedBranch = branches.find(
        (branch) =>
            String(
                branch._id || branch.id
            ) === String(appliedFilters.branch)
    );

    const isBalanced =
        Math.abs(Number(summary.difference || 0)) < 0.01;

    return (
        <div className="trial-balance-page">

            {/* ================= HEADER ================= */}

            <div className="trial-balance-header">

                <div className="trial-balance-header-left">
                    <div className="trial-balance-title-icon">
                        <FiBarChart2 />
                    </div>

                    <div>
                        <h1>Trial Balance</h1>

                        <p>
                            View account-wise debit and
                            credit balances
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="trial-balance-refresh-btn"
                    onClick={handleRefresh}
                    disabled={
                        loading || masterLoading
                    }
                >
                    <FiRefreshCw
                        className={
                            loading
                                ? "trial-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>
            </div>

            {/* ================= ALERTS ================= */}

            {error && (
                <div className="trial-alert trial-alert-error">
                    <FiAlertCircle />

                    <span>{error}</span>
                </div>
            )}

            {success && !error && (
                <div className="trial-alert trial-alert-success">
                    <FiCheckCircle />

                    <span>{success}</span>
                </div>
            )}

            {/* ================= FILTER CARD ================= */}

            <div className="trial-filter-card">

                <div className="trial-filter-title">
                    <FiFilter />

                    <span>Report Filters</span>
                </div>

                <div className="trial-filter-grid">

                    {/* COMPANY */}

                    <div className="trial-form-group">
                        <label>
                            Company
                            <span>*</span>
                        </label>

                        <select
                            name="company"
                            value={filters.company}
                            onChange={handleFilterChange}
                            disabled={masterLoading}
                        >
                            <option value="">
                                Select Company
                            </option>

                            {companies.map((company) => (
                                <option
                                    key={
                                        company._id ||
                                        company.id
                                    }
                                    value={
                                        company._id ||
                                        company.id
                                    }
                                >
                                    {company.name ||
                                        company.legalName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* BRANCH */}

                    <div className="trial-form-group">
                        <label>Branch</label>

                        <select
                            name="branch"
                            value={filters.branch}
                            onChange={handleFilterChange}
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
                                        key={
                                            branch._id ||
                                            branch.id
                                        }
                                        value={
                                            branch._id ||
                                            branch.id
                                        }
                                    >
                                        {branch.name}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* FROM DATE */}

                    <div className="trial-form-group">
                        <label>From Date</label>

                        <div className="trial-date-input">
                            <FiCalendar />

                            <input
                                type="date"
                                name="fromDate"
                                value={
                                    filters.fromDate
                                }
                                onChange={
                                    handleFilterChange
                                }
                            />
                        </div>
                    </div>

                    {/* TO DATE */}

                    <div className="trial-form-group">
                        <label>To Date</label>

                        <div className="trial-date-input">
                            <FiCalendar />

                            <input
                                type="date"
                                name="toDate"
                                value={
                                    filters.toDate
                                }
                                onChange={
                                    handleFilterChange
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="trial-filter-actions">

                    <button
                        type="button"
                        className="trial-btn trial-btn-primary"
                        onClick={handleApply}
                        disabled={loading}
                    >
                        <FiBarChart2 />

                        Generate Report
                    </button>

                    <button
                        type="button"
                        className="trial-btn trial-btn-secondary"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* ================= REPORT CONTEXT ================= */}

            {appliedFilters.company && (
                <div className="trial-report-context">

                    <div>
                        <strong>
                            {selectedCompany?.name ||
                                selectedCompany?.legalName ||
                                "Selected Company"}
                        </strong>

                        {selectedBranch && (
                            <span>
                                {" "}
                                • {selectedBranch.name}
                            </span>
                        )}
                    </div>

                    <div className="trial-report-period">
                        {appliedFilters.fromDate ||
                            appliedFilters.toDate
                            ? `${appliedFilters.fromDate || "Beginning"} → ${
                                  appliedFilters.toDate || "Today"
                              }`
                            : "All Posted Transactions"}
                    </div>
                </div>
            )}

            {/* ================= SUMMARY ================= */}

            {appliedFilters.company && (
                <div className="trial-summary-grid">

                    <div className="trial-summary-card">
                        <div className="trial-summary-icon">
                            <FiDatabase />
                        </div>

                        <div>
                            <span>
                                Total Accounts
                            </span>

                            <strong>
                                {summary.totalAccounts}
                            </strong>
                        </div>
                    </div>

                    <div className="trial-summary-card">
                        <div className="trial-summary-icon">
                            <FiDollarSign />
                        </div>

                        <div>
                            <span>Total Debit</span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    summary.totalDebit
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="trial-summary-card">
                        <div className="trial-summary-icon">
                            <FiDollarSign />
                        </div>

                        <div>
                            <span>Total Credit</span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    summary.totalCredit
                                )}
                            </strong>
                        </div>
                    </div>

                    <div
                        className={`trial-summary-card ${
                            isBalanced
                                ? "trial-summary-balanced"
                                : "trial-summary-warning"
                        }`}
                    >
                        <div className="trial-summary-icon">
                            {isBalanced ? (
                                <FiCheckCircle />
                            ) : (
                                <FiAlertCircle />
                            )}
                        </div>

                        <div>
                            <span>
                                Difference
                            </span>

                            <strong>
                                ₹{" "}
                                {formatAmount(
                                    Math.abs(
                                        summary.difference
                                    )
                                )}
                            </strong>

                            <small>
                                {isBalanced
                                    ? "Balanced"
                                    : "Difference Found"}
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= TABLE CARD ================= */}

            <div className="trial-table-card">

                <div className="trial-table-header">

                    <div>
                        <h2>Trial Balance</h2>

                        <p>
                            {filteredData.length} account
                            {filteredData.length !== 1
                                ? "s"
                                : ""}
                        </p>
                    </div>

                    <div className="trial-search-box">
                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search account..."
                            name="search"
                            value={filters.search}
                            onChange={
                                handleFilterChange
                            }
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="trial-loading">
                        <FiRefreshCw className="trial-spin" />

                        <span>
                            Generating trial balance...
                        </span>
                    </div>
                ) : !appliedFilters.company ? (
                    <div className="trial-empty">
                        <FiBarChart2 />

                        <h3>
                            Generate Trial Balance
                        </h3>

                        <p>
                            Select a company and generate
                            the report to view account
                            balances.
                        </p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="trial-empty">
                        <FiDatabase />

                        <h3>
                            No Trial Balance Data
                        </h3>

                        <p>
                            No ledger transactions were
                            found for the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="trial-table-wrapper">

                        <table className="trial-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Account Code</th>
                                    <th>Account Name</th>
                                    <th>Account Type</th>
                                    <th className="text-right">
                                        Debit
                                    </th>
                                    <th className="text-right">
                                        Credit
                                    </th>
                                    <th className="text-right">
                                        Balance
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredData.map(
                                    (item, index) => {
                                        const balance =
                                            Number(
                                                item.balance
                                            ) || 0;

                                        return (
                                            <tr
                                                key={
                                                    item.account ||
                                                    `${item.accountCode}-${index}`
                                                }
                                            >
                                                <td>
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    <span className="trial-account-code">
                                                        {
                                                            item.accountCode
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="trial-account-name">
                                                        {
                                                            item.accountName
                                                        }
                                                    </div>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`trial-type-badge trial-type-${String(
                                                            item.accountType ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {
                                                            item.accountType
                                                        }
                                                    </span>
                                                </td>

                                                <td className="text-right trial-amount debit">
                                                    ₹{" "}
                                                    {formatAmount(
                                                        item.totalDebit
                                                    )}
                                                </td>

                                                <td className="text-right trial-amount credit">
                                                    ₹{" "}
                                                    {formatAmount(
                                                        item.totalCredit
                                                    )}
                                                </td>

                                                <td className="text-right">
                                                    <div
                                                        className={`trial-balance-value ${
                                                            balance >
                                                            0
                                                                ? "balance-dr"
                                                                : balance <
                                                                  0
                                                                ? "balance-cr"
                                                                : "balance-zero"
                                                        }`}
                                                    >
                                                        ₹{" "}
                                                        {formatAmount(
                                                            Math.abs(
                                                                balance
                                                            )
                                                        )}

                                                        <span>
                                                            {getBalanceType(
                                                                balance
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>

                            <tfoot>
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="trial-total-label"
                                    >
                                        Grand Total
                                    </td>

                                    <td className="text-right trial-total-amount">
                                        ₹{" "}
                                        {formatAmount(
                                            summary.totalDebit
                                        )}
                                    </td>

                                    <td className="text-right trial-total-amount">
                                        ₹{" "}
                                        {formatAmount(
                                            summary.totalCredit
                                        )}
                                    </td>

                                    <td className="text-right">
                                        <span
                                            className={`trial-total-difference ${
                                                isBalanced
                                                    ? "balanced"
                                                    : "unbalanced"
                                            }`}
                                        >
                                            {isBalanced
                                                ? "BALANCED"
                                                : `₹ ${formatAmount(
                                                      Math.abs(
                                                          summary.difference
                                                      )
                                                  )}`}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrialBalance;