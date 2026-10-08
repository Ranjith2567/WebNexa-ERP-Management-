import React, { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiRefreshCw,
    FiEye,
    FiCreditCard,
    FiRotateCcw,
    FiX,
    FiUser,
    FiFileText,
    FiDollarSign,
    FiArrowUpCircle,
    FiArrowDownCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/customerCreditLedger.css";

const TRANSACTION_TYPES = [
    { value: "", label: "All Transactions" },
    { value: "CREDIT_NOTE", label: "Credit Note" },
    { value: "CREDIT_APPLIED", label: "Credit Applied" },
    { value: "CREDIT_REVERSAL", label: "Credit Reversal" },
    { value: "MANUAL_CREDIT", label: "Manual Credit" },
    { value: "MANUAL_DEBIT", label: "Manual Debit" },
];

const CustomerCreditLedger = () => {
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [customers, setCustomers] = useState([]);

    const [search, setSearch] = useState("");
    const [customerFilter, setCustomerFilter] = useState("");
    const [transactionType, setTransactionType] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerBalance, setCustomerBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showReverseModal, setShowReverseModal] = useState(false);

    const [applyAmount, setApplyAmount] = useState("");
    const [reverseAmount, setReverseAmount] = useState("");

    const [applyLoading, setApplyLoading] = useState(false);
    const [reverseLoading, setReverseLoading] = useState(false);

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    // =====================================================
    // Helpers
    // =====================================================

    const showMessage = (type, text) => {
        setMessage({ type, text });

        setTimeout(() => {
            setMessage({
                type: "",
                text: "",
            });
        }, 4000);
    };

    const getCustomerId = (customer) => {
        if (!customer) return "";
        return customer._id || customer.id || "";
    };

    const getCustomerName = (customer) => {
        if (!customer) return "-";
        return customer.name || customer.customerName || "-";
    };

    const formatCurrency = (value) => {
        const amount = Number(value || 0);

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

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

    const getTransactionLabel = (type) => {
        const found = TRANSACTION_TYPES.find(
            (item) => item.value === type
        );

        return found?.label || type || "-";
    };

    const isCreditTransaction = (type) => {
        return (
            type === "CREDIT_NOTE" ||
            type === "CREDIT_REVERSAL" ||
            type === "MANUAL_CREDIT"
        );
    };

    const isDebitTransaction = (type) => {
        return (
            type === "CREDIT_APPLIED" ||
            type === "MANUAL_DEBIT"
        );
    };

    // =====================================================
    // Fetch Customers
    // =====================================================

    const fetchCustomers = async () => {
        try {
            const response = await api.get(
                "/customers?limit=100&isActive=true"
            );

            const responseData = response?.data;

            let customerList = [];

            if (Array.isArray(responseData)) {
                customerList = responseData;
            } else if (Array.isArray(responseData?.data)) {
                customerList = responseData.data;
            } else if (
                Array.isArray(responseData?.customers)
            ) {
                customerList = responseData.customers;
            } else if (
                Array.isArray(responseData?.data?.customers)
            ) {
                customerList =
                    responseData.data.customers;
            }

            setCustomers(customerList);
        } catch (error) {
            console.error(
                "Fetch Customers Error:",
                error
            );
        }
    };

    // =====================================================
    // Fetch Ledger
    // =====================================================

    const fetchLedger = async (
        currentPage = page,
        showRefresh = false
    ) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const params = new URLSearchParams();

            if (customerFilter) {
                params.append(
                    "customer",
                    customerFilter
                );
            }

            if (transactionType) {
                params.append(
                    "transactionType",
                    transactionType
                );
            }

            params.append("page", currentPage);
            params.append("limit", 10);

            const response = await api.get(
                `/customer-credit-ledger?${params.toString()}`
            );

            const responseData = response?.data;

            const data =
                responseData?.data || {};

            const entries = Array.isArray(
                data?.ledgerEntries
            )
                ? data.ledgerEntries
                : [];

            setLedgerEntries(entries);

            setPagination(
                data?.pagination || {
                    total: entries.length,
                    page: currentPage,
                    limit: 10,
                    totalPages: 1,
                }
            );

            setPage(currentPage);
        } catch (error) {
            console.error(
                "Fetch Customer Credit Ledger Error:",
                error
            );

            showMessage(
                "error",
                error?.response?.data?.message ||
                    "Failed to fetch customer credit ledger"
            );

            setLedgerEntries([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // Fetch Customer Balance
    // =====================================================

    const fetchCustomerBalance = async (
        customerId
    ) => {
        if (!customerId) {
            setCustomerBalance(0);
            setSelectedCustomer(null);
            return;
        }

        try {
            setBalanceLoading(true);

            const response = await api.get(
                `/customer-credit-ledger/balance/${customerId}`
            );

            const data = response?.data?.data;

            setSelectedCustomer(
                data?.customer || null
            );

            setCustomerBalance(
                Number(data?.creditBalance || 0)
            );
        } catch (error) {
            console.error(
                "Fetch Customer Balance Error:",
                error
            );

            setSelectedCustomer(null);
            setCustomerBalance(0);

            showMessage(
                "error",
                error?.response?.data?.message ||
                    "Failed to fetch customer credit balance"
            );
        } finally {
            setBalanceLoading(false);
        }
    };

    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {
        fetchCustomers();
        fetchLedger(1);
    }, []);

    // =====================================================
    // Customer Filter Change
    // =====================================================

    useEffect(() => {
        if (customerFilter) {
            fetchCustomerBalance(customerFilter);
        } else {
            setSelectedCustomer(null);
            setCustomerBalance(0);
        }

        setPage(1);
        fetchLedger(1);
    }, [customerFilter]);

    // =====================================================
    // Transaction Filter Change
    // =====================================================

    useEffect(() => {
        setPage(1);
        fetchLedger(1);
    }, [transactionType]);

    // =====================================================
    // Search
    // =====================================================

    const filteredEntries = useMemo(() => {
        const keyword = search
            .trim()
            .toLowerCase();

        if (!keyword) {
            return ledgerEntries;
        }

        return ledgerEntries.filter((entry) => {
            const customerName =
                getCustomerName(entry.customer);

            const customerCode =
                entry.customer?.customerCode || "";

            const creditNoteNumber =
                entry.creditNote
                    ?.creditNoteNumber || "";

            const invoiceNumber =
                entry.salesInvoice
                    ?.invoiceNumber || "";

            const referenceNumber =
                entry.referenceNumber || "";

            const description =
                entry.description || "";

            const transaction =
                getTransactionLabel(
                    entry.transactionType
                );

            return [
                customerName,
                customerCode,
                creditNoteNumber,
                invoiceNumber,
                referenceNumber,
                description,
                transaction,
            ].some((value) =>
                String(value)
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [ledgerEntries, search]);

    // =====================================================
    // View Entry
    // =====================================================

    const handleView = (entry) => {
        setSelectedEntry(entry);
        setShowViewModal(true);
    };

    // =====================================================
    // Open Apply Modal
    // =====================================================

    const handleOpenApply = (entry) => {
        if (
            entry.transactionType !==
            "CREDIT_NOTE"
        ) {
            showMessage(
                "error",
                "Credit can only be applied from a Credit Note entry."
            );
            return;
        }

        if (!entry.creditNote) {
            showMessage(
                "error",
                "Credit Note information is not available."
            );
            return;
        }

        if (
            Number(
                entry.creditNote.remainingAmount
            ) <= 0
        ) {
            showMessage(
                "error",
                "This Credit Note has no remaining credit."
            );
            return;
        }

        setSelectedEntry(entry);

        setApplyAmount(
            Number(
                entry.creditNote.remainingAmount
            ).toFixed(2)
        );

        setShowApplyModal(true);
    };

    // =====================================================
    // Apply Credit
    // =====================================================

    const handleApplyCredit = async () => {
        if (!selectedEntry) return;

        const creditNote =
            selectedEntry.creditNote;

        const invoice =
            selectedEntry.salesInvoice;

        if (!creditNote?._id) {
            showMessage(
                "error",
                "Credit Note information is missing."
            );
            return;
        }

        if (!invoice?._id) {
            showMessage(
                "error",
                "Sales Invoice information is missing."
            );
            return;
        }

        const amount = Number(applyAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage(
                "error",
                "Enter a valid application amount."
            );
            return;
        }

        const remainingCredit = Number(
            creditNote.remainingAmount || 0
        );

        const invoiceBalance = Number(
            invoice.balanceDue || 0
        );

        if (amount > remainingCredit) {
            showMessage(
                "error",
                `Credit Note remaining amount is only ${formatCurrency(
                    remainingCredit
                )}.`
            );
            return;
        }

        if (amount > invoiceBalance) {
            showMessage(
                "error",
                `Invoice outstanding balance is only ${formatCurrency(
                    invoiceBalance
                )}.`
            );
            return;
        }

        try {
            setApplyLoading(true);

            const response = await api.post(
                "/customer-credit-ledger/apply",
                {
                    creditNote: creditNote._id,
                    salesInvoice: invoice._id,
                    amount,
                }
            );

            showMessage(
                "success",
                response?.data?.message ||
                    "Customer credit applied successfully."
            );

            setShowApplyModal(false);
            setApplyAmount("");

            await fetchLedger(page);

            if (customerFilter) {
                await fetchCustomerBalance(
                    customerFilter
                );
            }
        } catch (error) {
            console.error(
                "Apply Credit Error:",
                error
            );

            showMessage(
                "error",
                error?.response?.data?.message ||
                    "Failed to apply customer credit."
            );
        } finally {
            setApplyLoading(false);
        }
    };

    // =====================================================
    // Open Reverse Modal
    // =====================================================

    const handleOpenReverse = (entry) => {
        if (
            entry.transactionType !==
            "CREDIT_APPLIED"
        ) {
            showMessage(
                "error",
                "Only applied credit can be reversed."
            );
            return;
        }

        if (!entry.creditNote?._id) {
            showMessage(
                "error",
                "Credit Note information is missing."
            );
            return;
        }

        if (!entry.salesInvoice?._id) {
            showMessage(
                "error",
                "Sales Invoice information is missing."
            );
            return;
        }

        setSelectedEntry(entry);

        setReverseAmount(
            Number(entry.amount || 0).toFixed(2)
        );

        setShowReverseModal(true);
    };

    // =====================================================
    // Reverse Credit
    // =====================================================

    const handleReverseCredit = async () => {
        if (!selectedEntry) return;

        const creditNote =
            selectedEntry.creditNote;

        const invoice =
            selectedEntry.salesInvoice;

        const amount = Number(reverseAmount);

        if (!creditNote?._id) {
            showMessage(
                "error",
                "Credit Note information is missing."
            );
            return;
        }

        if (!invoice?._id) {
            showMessage(
                "error",
                "Sales Invoice information is missing."
            );
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage(
                "error",
                "Enter a valid reversal amount."
            );
            return;
        }

        if (amount > Number(selectedEntry.amount || 0)) {
            showMessage(
                "error",
                "Reversal amount cannot exceed the applied amount."
            );
            return;
        }

        try {
            setReverseLoading(true);

            const response = await api.post(
                "/customer-credit-ledger/reverse",
                {
                    creditNote: creditNote._id,
                    salesInvoice: invoice._id,
                    amount,
                }
            );

            showMessage(
                "success",
                response?.data?.message ||
                    "Customer credit application reversed successfully."
            );

            setShowReverseModal(false);
            setReverseAmount("");

            await fetchLedger(page);

            if (customerFilter) {
                await fetchCustomerBalance(
                    customerFilter
                );
            }
        } catch (error) {
            console.error(
                "Reverse Credit Error:",
                error
            );

            showMessage(
                "error",
                error?.response?.data?.message ||
                    "Failed to reverse customer credit."
            );
        } finally {
            setReverseLoading(false);
        }
    };

    // =====================================================
    // Pagination
    // =====================================================

    const goToPage = (nextPage) => {
        if (
            nextPage < 1 ||
            nextPage > pagination.totalPages
        ) {
            return;
        }

        fetchLedger(nextPage);
    };

    // =====================================================
    // Stats
    // =====================================================

    const creditTotal = useMemo(() => {
        return ledgerEntries
            .filter((entry) =>
                isCreditTransaction(
                    entry.transactionType
                )
            )
            .reduce(
                (sum, entry) =>
                    sum + Number(entry.amount || 0),
                0
            );
    }, [ledgerEntries]);

    const debitTotal = useMemo(() => {
        return ledgerEntries
            .filter((entry) =>
                isDebitTransaction(
                    entry.transactionType
                )
            )
            .reduce(
                (sum, entry) =>
                    sum + Number(entry.amount || 0),
                0
            );
    }, [ledgerEntries]);

    // =====================================================
    // Render
    // =====================================================

    return (
        <div className="customer-credit-ledger-page">

            {/* =================================================
                Header
            ================================================= */}

            <div className="customer-credit-ledger-header">
                <div>
                    <div className="customer-credit-ledger-title">
                        <div className="customer-credit-ledger-title-icon">
                            <FiCreditCard />
                        </div>

                        <div>
                            <h1>
                                Customer Credit Ledger
                            </h1>

                            <p>
                                Manage customer credits,
                                applications and reversals
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="customer-credit-refresh-btn"
                    onClick={() =>
                        fetchLedger(
                            page,
                            true
                        )
                    }
                    disabled={loading || refreshing}
                >
                    <FiRefreshCw
                        className={
                            refreshing
                                ? "spin"
                                : ""
                        }
                    />

                    Refresh
                </button>
            </div>

            {/* =================================================
                Message
            ================================================= */}

            {message.text && (
                <div
                    className={`customer-credit-message ${message.type}`}
                >
                    <span>
                        {message.text}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setMessage({
                                type: "",
                                text: "",
                            })
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* =================================================
                Summary Cards
            ================================================= */}

            <div className="customer-credit-summary-grid">

                <div className="customer-credit-summary-card">
                    <div className="customer-credit-summary-icon blue">
                        <FiDollarSign />
                    </div>

                    <div>
                        <span>
                            Available Credit
                        </span>

                        <strong>
                            {balanceLoading
                                ? "Loading..."
                                : formatCurrency(
                                      customerBalance
                                  )}
                        </strong>
                    </div>
                </div>

                <div className="customer-credit-summary-card">
                    <div className="customer-credit-summary-icon green">
                        <FiArrowUpCircle />
                    </div>

                    <div>
                        <span>
                            Credits
                        </span>

                        <strong>
                            {formatCurrency(
                                creditTotal
                            )}
                        </strong>
                    </div>
                </div>

                <div className="customer-credit-summary-card">
                    <div className="customer-credit-summary-icon orange">
                        <FiArrowDownCircle />
                    </div>

                    <div>
                        <span>
                            Credits Applied
                        </span>

                        <strong>
                            {formatCurrency(
                                debitTotal
                            )}
                        </strong>
                    </div>
                </div>

                <div className="customer-credit-summary-card">
                    <div className="customer-credit-summary-icon purple">
                        <FiFileText />
                    </div>

                    <div>
                        <span>
                            Total Entries
                        </span>

                        <strong>
                            {pagination.total || 0}
                        </strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                Customer Balance
            ================================================= */}

            {selectedCustomer && (
                <div className="customer-credit-selected-card">

                    <div className="customer-credit-selected-left">
                        <div className="customer-credit-customer-avatar">
                            <FiUser />
                        </div>

                        <div>
                            <span>
                                Selected Customer
                            </span>

                            <strong>
                                {getCustomerName(
                                    selectedCustomer
                                )}
                            </strong>

                            <small>
                                {selectedCustomer.customerCode ||
                                    "-"}
                            </small>
                        </div>
                    </div>

                    <div className="customer-credit-selected-balance">
                        <span>
                            Available Credit
                        </span>

                        <strong>
                            {formatCurrency(
                                customerBalance
                            )}
                        </strong>
                    </div>

                </div>
            )}

            {/* =================================================
                Filters
            ================================================= */}

            <div className="customer-credit-filter-card">

                <div className="customer-credit-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search customer, credit note, invoice, reference..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="customer-credit-filter-field">
                    <label>
                        Customer
                    </label>

                    <select
                        value={customerFilter}
                        onChange={(e) =>
                            setCustomerFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="">
                            All Customers
                        </option>

                        {customers.map(
                            (customer) => (
                                <option
                                    key={
                                        getCustomerId(
                                            customer
                                        )
                                    }
                                    value={getCustomerId(
                                        customer
                                    )}
                                >
                                    {getCustomerName(
                                        customer
                                    )}{" "}
                                    {customer.customerCode
                                        ? `(${customer.customerCode})`
                                        : ""}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="customer-credit-filter-field">
                    <label>
                        Transaction Type
                    </label>

                    <select
                        value={transactionType}
                        onChange={(e) =>
                            setTransactionType(
                                e.target.value
                            )
                        }
                    >
                        {TRANSACTION_TYPES.map(
                            (item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <button
                    type="button"
                    className="customer-credit-clear-btn"
                    onClick={() => {
                        setSearch("");
                        setCustomerFilter("");
                        setTransactionType("");
                    }}
                >
                    Clear
                </button>

            </div>

            {/* =================================================
                Table
            ================================================= */}

            <div className="customer-credit-table-card">

                <div className="customer-credit-table-header">
                    <div>
                        <h2>
                            Credit Transactions
                        </h2>

                        <p>
                            Customer credit accounting
                            history
                        </p>
                    </div>

                    <span>
                        {pagination.total || 0} entries
                    </span>
                </div>

                {loading ? (
                    <div className="customer-credit-loading">
                        <div className="customer-credit-loader" />

                        <p>
                            Loading credit ledger...
                        </p>
                    </div>
                ) : filteredEntries.length ===
                  0 ? (
                    <div className="customer-credit-empty">
                        <div className="customer-credit-empty-icon">
                            <FiCreditCard />
                        </div>

                        <h3>
                            No Credit Transactions
                        </h3>

                        <p>
                            No customer credit ledger
                            entries found.
                        </p>
                    </div>
                ) : (
                    <div className="customer-credit-table-wrapper">
                        <table className="customer-credit-table">

                            <thead>
                                <tr>
                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Transaction
                                    </th>

                                    <th>
                                        Reference
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Balance
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEntries.map(
                                    (entry) => (
                                        <tr
                                            key={
                                                entry._id
                                            }
                                        >
                                            <td>
                                                <div className="customer-credit-date">
                                                    <strong>
                                                        {formatDate(
                                                            entry.transactionDate
                                                        )}
                                                    </strong>

                                                    <small>
                                                        {new Date(
                                                            entry.transactionDate
                                                        ).toLocaleTimeString(
                                                            "en-IN",
                                                            {
                                                                hour:
                                                                    "2-digit",
                                                                minute:
                                                                    "2-digit",
                                                            }
                                                        )}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="customer-credit-customer">
                                                    <strong>
                                                        {getCustomerName(
                                                            entry.customer
                                                        )}
                                                    </strong>

                                                    <small>
                                                        {entry
                                                            .customer
                                                            ?.customerCode ||
                                                            "-"}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`customer-credit-type ${entry.transactionType
                                                        ?.toLowerCase()
                                                        .replace(
                                                            /_/g,
                                                            "-"
                                                        )}`}
                                                >
                                                    {getTransactionLabel(
                                                        entry.transactionType
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="customer-credit-reference">
                                                    {entry
                                                        .creditNote
                                                        ?.creditNoteNumber && (
                                                        <span>
                                                            {
                                                                entry
                                                                    .creditNote
                                                                    .creditNoteNumber
                                                            }
                                                        </span>
                                                    )}

                                                    {entry
                                                        .salesInvoice
                                                        ?.invoiceNumber && (
                                                        <small>
                                                            {
                                                                entry
                                                                    .salesInvoice
                                                                    .invoiceNumber
                                                            }
                                                        </small>
                                                    )}

                                                    {!entry
                                                        .creditNote
                                                        ?.creditNoteNumber &&
                                                        !entry
                                                            .salesInvoice
                                                            ?.invoiceNumber && (
                                                            <span>
                                                                {entry.referenceNumber ||
                                                                    "-"}
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            <td>
                                                <strong
                                                    className={
                                                        isCreditTransaction(
                                                            entry.transactionType
                                                        )
                                                            ? "credit-amount"
                                                            : "debit-amount"
                                                    }
                                                >
                                                    {isCreditTransaction(
                                                        entry.transactionType
                                                    )
                                                        ? "+"
                                                        : "-"}
                                                    {formatCurrency(
                                                        entry.amount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <strong className="customer-credit-balance">
                                                    {formatCurrency(
                                                        entry.balanceAfter
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="customer-credit-actions">

                                                    <button
                                                        type="button"
                                                        className="credit-action view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                entry
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    {entry.transactionType ===
                                                        "CREDIT_NOTE" &&
                                                        entry
                                                            .creditNote
                                                            ?.remainingAmount >
                                                            0 && (
                                                            <button
                                                                type="button"
                                                                className="credit-action apply"
                                                                title="Apply Credit"
                                                                onClick={() =>
                                                                    handleOpenApply(
                                                                        entry
                                                                    )
                                                                }
                                                            >
                                                                <FiCreditCard />
                                                            </button>
                                                        )}

                                                    {entry.transactionType ===
                                                        "CREDIT_APPLIED" && (
                                                        <button
                                                            type="button"
                                                            className="credit-action reverse"
                                                            title="Reverse Credit"
                                                            onClick={() =>
                                                                handleOpenReverse(
                                                                    entry
                                                                )
                                                            }
                                                        >
                                                            <FiRotateCcw />
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
                )}

                {/* =================================================
                    Pagination
                ================================================= */}

                {!loading &&
                    pagination.totalPages > 0 && (
                        <div className="customer-credit-pagination">

                            <div>
                                Showing{" "}
                                <strong>
                                    {filteredEntries.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {pagination.total}
                                </strong>{" "}
                                entries
                            </div>

                            <div className="customer-credit-pagination-buttons">

                                <button
                                    type="button"
                                    disabled={
                                        page <= 1
                                    }
                                    onClick={() =>
                                        goToPage(
                                            page - 1
                                        )
                                    }
                                >
                                    Previous
                                </button>

                                <span>
                                    Page{" "}
                                    <strong>
                                        {pagination.page ||
                                            page}
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
                                        goToPage(
                                            page + 1
                                        )
                                    }
                                >
                                    Next
                                </button>

                            </div>
                        </div>
                    )}
            </div>

            {/* =====================================================
                View Modal
            ===================================================== */}

            {showViewModal &&
                selectedEntry && (
                    <div
                        className="customer-credit-modal-overlay"
                        onClick={() =>
                            setShowViewModal(false)
                        }
                    >
                        <div
                            className="customer-credit-modal customer-credit-view-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="customer-credit-modal-header">
                                <div>
                                    <div className="customer-credit-modal-icon">
                                        <FiCreditCard />
                                    </div>

                                    <div>
                                        <h2>
                                            Credit Ledger
                                            Details
                                        </h2>

                                        <p>
                                            Transaction
                                            information
                                        </p>
                                    </div>
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

                            <div className="customer-credit-modal-body">

                                <div className="customer-credit-detail-grid">

                                    <div className="customer-credit-detail-card">
                                        <span>
                                            Transaction
                                            Type
                                        </span>

                                        <strong>
                                            {getTransactionLabel(
                                                selectedEntry.transactionType
                                            )}
                                        </strong>
                                    </div>

                                    <div className="customer-credit-detail-card">
                                        <span>
                                            Transaction
                                            Date
                                        </span>

                                        <strong>
                                            {formatDateTime(
                                                selectedEntry.transactionDate
                                            )}
                                        </strong>
                                    </div>

                                    <div className="customer-credit-detail-card">
                                        <span>
                                            Customer
                                        </span>

                                        <strong>
                                            {getCustomerName(
                                                selectedEntry.customer
                                            )}
                                        </strong>

                                        <small>
                                            {selectedEntry
                                                .customer
                                                ?.customerCode ||
                                                "-"}
                                        </small>
                                    </div>

                                    <div className="customer-credit-detail-card">
                                        <span>
                                            Amount
                                        </span>

                                        <strong
                                            className={
                                                isCreditTransaction(
                                                    selectedEntry.transactionType
                                                )
                                                    ? "credit-amount"
                                                    : "debit-amount"
                                            }
                                        >
                                            {formatCurrency(
                                                selectedEntry.amount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="customer-credit-detail-card">
                                        <span>
                                            Balance Before
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                selectedEntry.balanceBefore
                                            )}
                                        </strong>
                                    </div>

                                    <div className="customer-credit-detail-card">
                                        <span>
                                            Balance After
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                selectedEntry.balanceAfter
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <div className="customer-credit-reference-section">

                                    <h3>
                                        References
                                    </h3>

                                    <div className="customer-credit-reference-grid">

                                        <div>
                                            <span>
                                                Credit Note
                                            </span>

                                            <strong>
                                                {selectedEntry
                                                    .creditNote
                                                    ?.creditNoteNumber ||
                                                    "-"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Sales Invoice
                                            </span>

                                            <strong>
                                                {selectedEntry
                                                    .salesInvoice
                                                    ?.invoiceNumber ||
                                                    "-"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Reference
                                                Number
                                            </span>

                                            <strong>
                                                {selectedEntry.referenceNumber ||
                                                    "-"}
                                            </strong>
                                        </div>

                                    </div>
                                </div>

                                <div className="customer-credit-description-section">

                                    <h3>
                                        Description
                                    </h3>

                                    <p>
                                        {selectedEntry.description ||
                                            "No description available."}
                                    </p>

                                    {selectedEntry.notes && (
                                        <>
                                            <h3>
                                                Notes
                                            </h3>

                                            <p>
                                                {
                                                    selectedEntry.notes
                                                }
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="customer-credit-created-section">

                                    <span>
                                        Created By
                                    </span>

                                    <strong>
                                        {selectedEntry
                                            .createdBy
                                            ?.name ||
                                            "-"}
                                    </strong>

                                    <small>
                                        {selectedEntry
                                            .createdBy
                                            ?.email ||
                                            "-"}
                                    </small>

                                </div>

                            </div>

                            <div className="customer-credit-modal-footer">
                                <button
                                    type="button"
                                    className="customer-credit-secondary-btn"
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

            {/* =====================================================
                Apply Modal
            ===================================================== */}

            {showApplyModal &&
                selectedEntry && (
                    <div
                        className="customer-credit-modal-overlay"
                        onClick={() =>
                            !applyLoading &&
                            setShowApplyModal(
                                false
                            )
                        }
                    >
                        <div
                            className="customer-credit-modal customer-credit-action-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="customer-credit-modal-header">
                                <div>
                                    <div className="customer-credit-modal-icon green">
                                        <FiCreditCard />
                                    </div>

                                    <div>
                                        <h2>
                                            Apply Customer
                                            Credit
                                        </h2>

                                        <p>
                                            Apply credit to
                                            sales invoice
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        applyLoading
                                    }
                                    onClick={() =>
                                        setShowApplyModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="customer-credit-modal-body">

                                <div className="customer-credit-action-summary">

                                    <div>
                                        <span>
                                            Credit Note
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .creditNote
                                                ?.creditNoteNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Customer
                                        </span>

                                        <strong>
                                            {getCustomerName(
                                                selectedEntry.customer
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Available Credit
                                        </span>

                                        <strong className="credit-amount">
                                            {formatCurrency(
                                                selectedEntry
                                                    .creditNote
                                                    ?.remainingAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Invoice
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .salesInvoice
                                                ?.invoiceNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Invoice Balance
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                selectedEntry
                                                    .salesInvoice
                                                    ?.balanceDue
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <div className="customer-credit-input-group">

                                    <label>
                                        Application Amount
                                    </label>

                                    <div className="customer-credit-money-input">
                                        <span>
                                            ₹
                                        </span>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                applyAmount
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setApplyAmount(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="0.00"
                                            disabled={
                                                applyLoading
                                            }
                                        />
                                    </div>

                                </div>

                            </div>

                            <div className="customer-credit-modal-footer">

                                <button
                                    type="button"
                                    className="customer-credit-secondary-btn"
                                    disabled={
                                        applyLoading
                                    }
                                    onClick={() =>
                                        setShowApplyModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="customer-credit-primary-btn"
                                    disabled={
                                        applyLoading
                                    }
                                    onClick={
                                        handleApplyCredit
                                    }
                                >
                                    {applyLoading ? (
                                        <>
                                            <span className="button-spinner" />
                                            Applying...
                                        </>
                                    ) : (
                                        <>
                                            <FiCreditCard />
                                            Apply Credit
                                        </>
                                    )}
                                </button>

                            </div>

                        </div>
                    </div>
                )}

            {/* =====================================================
                Reverse Modal
            ===================================================== */}

            {showReverseModal &&
                selectedEntry && (
                    <div
                        className="customer-credit-modal-overlay"
                        onClick={() =>
                            !reverseLoading &&
                            setShowReverseModal(
                                false
                            )
                        }
                    >
                        <div
                            className="customer-credit-modal customer-credit-action-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="customer-credit-modal-header">
                                <div>
                                    <div className="customer-credit-modal-icon orange">
                                        <FiRotateCcw />
                                    </div>

                                    <div>
                                        <h2>
                                            Reverse Credit
                                            Application
                                        </h2>

                                        <p>
                                            Restore customer
                                            credit
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        reverseLoading
                                    }
                                    onClick={() =>
                                        setShowReverseModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="customer-credit-modal-body">

                                <div className="customer-credit-warning">
                                    <FiRotateCcw />

                                    <div>
                                        <strong>
                                            Reverse this
                                            transaction?
                                        </strong>

                                        <p>
                                            This will restore
                                            the customer
                                            credit and reduce
                                            the paid amount of
                                            the sales invoice.
                                        </p>
                                    </div>
                                </div>

                                <div className="customer-credit-action-summary">

                                    <div>
                                        <span>
                                            Credit Note
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .creditNote
                                                ?.creditNoteNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Invoice
                                        </span>

                                        <strong>
                                            {selectedEntry
                                                .salesInvoice
                                                ?.invoiceNumber ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Applied Amount
                                        </span>

                                        <strong className="debit-amount">
                                            {formatCurrency(
                                                selectedEntry.amount
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <div className="customer-credit-input-group">

                                    <label>
                                        Reversal Amount
                                    </label>

                                    <div className="customer-credit-money-input">
                                        <span>
                                            ₹
                                        </span>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                reverseAmount
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setReverseAmount(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="0.00"
                                            disabled={
                                                reverseLoading
                                            }
                                        />
                                    </div>

                                </div>

                            </div>

                            <div className="customer-credit-modal-footer">

                                <button
                                    type="button"
                                    className="customer-credit-secondary-btn"
                                    disabled={
                                        reverseLoading
                                    }
                                    onClick={() =>
                                        setShowReverseModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="customer-credit-danger-btn"
                                    disabled={
                                        reverseLoading
                                    }
                                    onClick={
                                        handleReverseCredit
                                    }
                                >
                                    {reverseLoading ? (
                                        <>
                                            <span className="button-spinner" />
                                            Reversing...
                                        </>
                                    ) : (
                                        <>
                                            <FiRotateCcw />
                                            Reverse Credit
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

export default CustomerCreditLedger;