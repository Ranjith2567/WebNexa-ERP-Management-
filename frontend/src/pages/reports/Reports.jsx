// src/pages/reports/Reports.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
    FiBarChart2,
    FiDownload,
    FiFileText,
    FiPackage,
    FiRefreshCw,
    FiSearch,
    FiShoppingBag,
    FiTrendingUp,
    FiDollarSign,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/reports.css";

const REPORT_TYPES = {
    SALES: "sales",
    PURCHASES: "purchases",
    INVENTORY: "inventory",
    EXPENSES: "expenses",
};

const initialFilters = {
    company: "",
    branch: "",
    customer: "",
    salesPerson: "",
    supplier: "",
    purchaseOrder: "",
    goodsReceipt: "",
    product: "",
    category: "",
    warehouse: "",
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    lowStock: false,
    outOfStock: false,
    overStock: false,
    fromDate: "",
    toDate: "",
};

const Reports = () => {
    const [activeReport, setActiveReport] = useState(REPORT_TYPES.SALES);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [filters, setFilters] = useState(initialFilters);

    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({});
    const [paymentStatusSummary, setPaymentStatusSummary] = useState([]);
    const [statusSummary, setStatusSummary] = useState([]);
    const [paymentMethodSummary, setPaymentMethodSummary] = useState([]);
    const [categorySummary, setCategorySummary] = useState([]);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState("");
    const [error, setError] = useState("");

    /* =========================
       LOAD COMPANIES
    ========================= */

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies");

            const data =
                response?.data?.data?.companies ||
                response?.data?.data ||
                response?.data?.companies ||
                [];

            setCompanies(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Company fetch error:", err);
        }
    };

    /* =========================
       LOAD BRANCHES
    ========================= */

    useEffect(() => {
        if (!filters.company) {
            setBranches([]);
            return;
        }

        fetchBranches(filters.company);
    }, [filters.company]);

    const fetchBranches = async (companyId) => {
        try {
            const response = await api.get("/branches", {
                params: {
                    company: companyId,
                },
            });

            const data =
                response?.data?.data?.branches ||
                response?.data?.data ||
                response?.data?.branches ||
                [];

            setBranches(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Branch fetch error:", err);
            setBranches([]);
        }
    };

    /* =========================
       RESET REPORT STATE
    ========================= */

    const resetReportState = () => {
        setReportData([]);
        setSummary({});
        setPaymentStatusSummary([]);
        setStatusSummary([]);
        setPaymentMethodSummary([]);
        setCategorySummary([]);

        setPagination({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        });

        setError("");
    };

    /* =========================
       CHANGE REPORT
    ========================= */

    const handleReportChange = (type) => {
        setActiveReport(type);
        resetReportState();
    };

    /* =========================
       FILTER CHANGE
    ========================= */

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFilters((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    /* =========================
       BUILD API PARAMS
    ========================= */

    const buildParams = (page = pagination.page) => {
        const params = {
            company: filters.company,
            page,
            limit: pagination.limit,
        };

        Object.keys(filters).forEach((key) => {
            if (key === "company") return;

            const value = filters[key];

            if (
                value !== "" &&
                value !== null &&
                value !== undefined &&
                value !== false
            ) {
                params[key] = value;
            }
        });

        return params;
    };

    /* =========================
       FETCH REPORT
    ========================= */

    const fetchReport = async (page = 1) => {
        if (!filters.company) {
            setError("Please select a company.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const params = buildParams(page);

            const response = await api.get(`/reports/${activeReport}`, {
                params,
            });

            const responseData = response?.data?.data || {};

            if (activeReport === REPORT_TYPES.SALES) {
                setReportData(responseData.invoices || []);
                setSummary(responseData.summary || {});
                setPaymentStatusSummary(
                    responseData.paymentStatusSummary || []
                );
                setStatusSummary([]);
                setPaymentMethodSummary([]);
                setCategorySummary([]);
            }

            if (activeReport === REPORT_TYPES.PURCHASES) {
                setReportData(responseData.invoices || []);
                setSummary(responseData.summary || {});
                setPaymentStatusSummary(
                    responseData.paymentStatusSummary || []
                );
                setStatusSummary([]);
                setPaymentMethodSummary([]);
                setCategorySummary([]);
            }

            if (activeReport === REPORT_TYPES.INVENTORY) {
                setReportData(responseData.stocks || []);
                setSummary(responseData.summary || {});
                setPaymentStatusSummary([]);
                setStatusSummary([]);
                setPaymentMethodSummary([]);
                setCategorySummary([]);
            }

            if (activeReport === REPORT_TYPES.EXPENSES) {
                setReportData(responseData.expenses || []);
                setSummary(responseData.summary || {});
                setPaymentStatusSummary([]);
                setStatusSummary(responseData.statusSummary || []);
                setPaymentMethodSummary(
                    responseData.paymentMethodSummary || []
                );
                setCategorySummary(responseData.categorySummary || []);
            }

            setPagination({
                page: response?.data?.pagination?.page || page,
                limit: response?.data?.pagination?.limit || pagination.limit,
                total: response?.data?.pagination?.total || 0,
                totalPages: response?.data?.pagination?.totalPages || 0,
            });
        } catch (err) {
            console.error("Report fetch error:", err);

            setError(
                err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to load report."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       EXPORT
    ========================= */

    const exportReport = async (format) => {
        if (!filters.company) {
            setError("Please select a company before exporting.");
            return;
        }

        try {
            setExporting(format);
            setError("");

            const params = buildParams(1);

            delete params.page;
            delete params.limit;

            const response = await api.get(
                `/reports/${activeReport}/${format}`,
                {
                    params,
                    responseType: "blob",
                }
            );

            const blob = response.data;

            if (!blob || blob.size === 0) {
                throw new Error("Empty file received.");
            }

            const contentType = response.headers["content-type"] || "";

            if (contentType.includes("application/json")) {
                const text = await blob.text();

                try {
                    const json = JSON.parse(text);
                    throw new Error(json.message || "Export failed.");
                } catch {
                    throw new Error("Export failed.");
                }
            }

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            const extension = format === "excel" ? "xlsx" : "pdf";

            link.download = `webnexa-${activeReport}-report.${extension}`;

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export error:", err);

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    `Failed to export ${format.toUpperCase()} report.`
            );
        } finally {
            setExporting("");
        }
    };

    /* =========================
       FORMAT CURRENCY
    ========================= */

    const currency = (value) => {
        const number = Number(value || 0);

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(number);
    };

    const number = (value) => {
        return new Intl.NumberFormat("en-IN").format(
            Number(value || 0)
        );
    };

    const dateFormat = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "-";

        return date.toLocaleDateString("en-IN");
    };

    /* =========================
       COMPANY NAME
    ========================= */

    const getCompanyName = (company) => {
        if (!company) return "-";

        if (typeof company === "string") return company;

        return company.name || company.companyName || "-";
    };

    /* =========================
       SELECTED COMPANY
    ========================= */

    const selectedCompanyName = useMemo(() => {
        const company = companies.find(
            (item) =>
                String(item._id || item.id) ===
                String(filters.company)
        );

        return getCompanyName(company);
    }, [companies, filters.company]);

    /* =========================
       PAGE CHANGE
    ========================= */

    const changePage = (page) => {
        if (page < 1 || page > pagination.totalPages) return;

        fetchReport(page);
    };

    /* =========================
       SUMMARY CARDS
    ========================= */

    const renderSummaryCards = () => {
        if (activeReport === REPORT_TYPES.SALES) {
            return (
                <div className="reports-summary-grid">
                    <SummaryCard
                        icon={<FiFileText />}
                        title="Total Invoices"
                        value={number(summary.totalInvoices)}
                    />

                    <SummaryCard
                        icon={<FiDollarSign />}
                        title="Subtotal"
                        value={currency(summary.subtotal)}
                    />

                    <SummaryCard
                        icon={<FiTrendingUp />}
                        title="Tax"
                        value={currency(summary.taxAmount)}
                    />

                    <SummaryCard
                        icon={<FiBarChart2 />}
                        title="Grand Total"
                        value={currency(summary.grandTotal)}
                    />

                    <SummaryCard
                        icon={<FiDollarSign />}
                        title="Paid"
                        value={currency(summary.paidAmount)}
                    />

                    <SummaryCard
                        icon={<FiTrendingUp />}
                        title="Balance Due"
                        value={currency(summary.balanceDue)}
                    />
                </div>
            );
        }

        if (activeReport === REPORT_TYPES.PURCHASES) {
            return (
                <div className="reports-summary-grid">
                    <SummaryCard
                        icon={<FiFileText />}
                        title="Total Invoices"
                        value={number(summary.totalInvoices)}
                    />

                    <SummaryCard
                        icon={<FiDollarSign />}
                        title="Subtotal"
                        value={currency(summary.subtotal)}
                    />

                    <SummaryCard
                        icon={<FiTrendingUp />}
                        title="Tax"
                        value={currency(summary.taxAmount)}
                    />

                    <SummaryCard
                        icon={<FiPackage />}
                        title="Total Amount"
                        value={currency(summary.totalAmount)}
                    />

                    <SummaryCard
                        icon={<FiDollarSign />}
                        title="Paid"
                        value={currency(summary.paidAmount)}
                    />

                    <SummaryCard
                        icon={<FiTrendingUp />}
                        title="Due"
                        value={currency(summary.dueAmount)}
                    />
                </div>
            );
        }

        if (activeReport === REPORT_TYPES.INVENTORY) {
            return (
                <div className="reports-summary-grid">
                    <SummaryCard
                        icon={<FiPackage />}
                        title="Total Items"
                        value={number(summary.totalItems)}
                    />

                    <SummaryCard
                        icon={<FiBarChart2 />}
                        title="Total Quantity"
                        value={number(summary.totalQuantity)}
                    />

                    <SummaryCard
                        icon={<FiPackage />}
                        title="Available"
                        value={number(summary.totalAvailableQuantity)}
                    />

                    <SummaryCard
                        icon={<FiDollarSign />}
                        title="Stock Value"
                        value={currency(summary.totalStockValue)}
                    />

                    <SummaryCard
                        icon={<FiTrendingUp />}
                        title="Selling Value"
                        value={currency(summary.totalSellingValue)}
                    />

                    <SummaryCard
                        icon={<FiTrendingUp />}
                        title="Potential Profit"
                        value={currency(summary.totalPotentialProfit)}
                    />

                    <SummaryCard
                        icon={<FiPackage />}
                        title="Low Stock"
                        value={number(summary.lowStockItems)}
                    />

                    <SummaryCard
                        icon={<FiPackage />}
                        title="Out of Stock"
                        value={number(summary.outOfStockItems)}
                    />
                </div>
            );
        }

        return (
            <div className="reports-summary-grid">
                <SummaryCard
                    icon={<FiFileText />}
                    title="Total Expenses"
                    value={number(summary.totalExpenses)}
                />

                <SummaryCard
                    icon={<FiDollarSign />}
                    title="Total Amount"
                    value={currency(summary.totalAmount)}
                />

                <SummaryCard
                    icon={<FiBarChart2 />}
                    title="Average"
                    value={currency(summary.averageAmount)}
                />

                <SummaryCard
                    icon={<FiTrendingUp />}
                    title="Maximum"
                    value={currency(summary.maximumAmount)}
                />

                <SummaryCard
                    icon={<FiTrendingUp />}
                    title="Minimum"
                    value={currency(summary.minimumAmount)}
                />
            </div>
        );
    };

    /* =========================
       FILTERS
    ========================= */

    const renderFilters = () => {
        return (
            <div className="reports-filter-card">
                <div className="reports-filter-header">
                    <div>
                        <h3>Report Filters</h3>
                        <span>
                            {selectedCompanyName !== "-"
                                ? selectedCompanyName
                                : "Select company"}
                        </span>
                    </div>

                    <button
                        className="reports-refresh-btn"
                        onClick={() => fetchReport(1)}
                        disabled={loading}
                    >
                        <FiRefreshCw
                            className={loading ? "spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                <div className="reports-filter-grid">
                    <div className="reports-field">
                        <label>Company *</label>

                        <select
                            name="company"
                            value={filters.company}
                            onChange={(e) => {
                                handleFilterChange(e);

                                setFilters((prev) => ({
                                    ...prev,
                                    branch: "",
                                }));
                            }}
                        >
                            <option value="">
                                Select Company
                            </option>

                            {companies.map((company) => (
                                <option
                                    key={company._id || company.id}
                                    value={
                                        company._id || company.id
                                    }
                                >
                                    {company.name ||
                                        company.companyName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="reports-field">
                        <label>Branch</label>

                        <select
                            name="branch"
                            value={filters.branch}
                            onChange={handleFilterChange}
                            disabled={!filters.company}
                        >
                            <option value="">
                                All Branches
                            </option>

                            {branches.map((branch) => (
                                <option
                                    key={branch._id || branch.id}
                                    value={
                                        branch._id || branch.id
                                    }
                                >
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeReport === REPORT_TYPES.SALES && (
                        <>
                            <div className="reports-field">
                                <label>Customer ID</label>
                                <input
                                    name="customer"
                                    value={filters.customer}
                                    onChange={handleFilterChange}
                                    placeholder="Customer ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Sales Person ID</label>
                                <input
                                    name="salesPerson"
                                    value={filters.salesPerson}
                                    onChange={handleFilterChange}
                                    placeholder="Sales Person ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Status</option>
                                    <option value="DRAFT">
                                        Draft
                                    </option>
                                    <option value="ISSUED">
                                        Issued
                                    </option>
                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>
                                </select>
                            </div>

                            <div className="reports-field">
                                <label>Payment Status</label>
                                <select
                                    name="paymentStatus"
                                    value={filters.paymentStatus}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">
                                        All Payment Status
                                    </option>
                                    <option value="UNPAID">
                                        Unpaid
                                    </option>
                                    <option value="PARTIALLY_PAID">
                                        Partially Paid
                                    </option>
                                    <option value="PAID">
                                        Paid
                                    </option>
                                    <option value="OVERDUE">
                                        Overdue
                                    </option>
                                </select>
                            </div>
                        </>
                    )}

                    {activeReport === REPORT_TYPES.PURCHASES && (
                        <>
                            <div className="reports-field">
                                <label>Supplier ID</label>
                                <input
                                    name="supplier"
                                    value={filters.supplier}
                                    onChange={handleFilterChange}
                                    placeholder="Supplier ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Purchase Order ID</label>
                                <input
                                    name="purchaseOrder"
                                    value={filters.purchaseOrder}
                                    onChange={handleFilterChange}
                                    placeholder="Purchase Order ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Goods Receipt ID</label>
                                <input
                                    name="goodsReceipt"
                                    value={filters.goodsReceipt}
                                    onChange={handleFilterChange}
                                    placeholder="Goods Receipt ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Status</option>
                                    <option value="DRAFT">
                                        Draft
                                    </option>
                                    <option value="POSTED">
                                        Posted
                                    </option>
                                    <option value="PARTIALLY_PAID">
                                        Partially Paid
                                    </option>
                                    <option value="PAID">
                                        Paid
                                    </option>
                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>
                                </select>
                            </div>

                            <div className="reports-field">
                                <label>Payment Status</label>
                                <select
                                    name="paymentStatus"
                                    value={filters.paymentStatus}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">
                                        All Payment Status
                                    </option>
                                    <option value="UNPAID">
                                        Unpaid
                                    </option>
                                    <option value="PARTIALLY_PAID">
                                        Partially Paid
                                    </option>
                                    <option value="PAID">
                                        Paid
                                    </option>
                                    <option value="OVERDUE">
                                        Overdue
                                    </option>
                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>
                                </select>
                            </div>
                        </>
                    )}

                    {activeReport === REPORT_TYPES.INVENTORY && (
                        <>
                            <div className="reports-field">
                                <label>Warehouse ID</label>
                                <input
                                    name="warehouse"
                                    value={filters.warehouse}
                                    onChange={handleFilterChange}
                                    placeholder="Warehouse ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Product ID</label>
                                <input
                                    name="product"
                                    value={filters.product}
                                    onChange={handleFilterChange}
                                    placeholder="Product ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Category ID</label>
                                <input
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    placeholder="Category ID"
                                />
                            </div>
                        </>
                    )}

                    {activeReport === REPORT_TYPES.EXPENSES && (
                        <>
                            <div className="reports-field">
                                <label>Category ID</label>
                                <input
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    placeholder="Category ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Supplier ID</label>
                                <input
                                    name="supplier"
                                    value={filters.supplier}
                                    onChange={handleFilterChange}
                                    placeholder="Supplier ID"
                                />
                            </div>

                            <div className="reports-field">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Status</option>
                                    <option value="DRAFT">
                                        Draft
                                    </option>
                                    <option value="PENDING">
                                        Pending
                                    </option>
                                    <option value="APPROVED">
                                        Approved
                                    </option>
                                    <option value="REJECTED">
                                        Rejected
                                    </option>
                                    <option value="PAID">
                                        Paid
                                    </option>
                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>
                                </select>
                            </div>

                            <div className="reports-field">
                                <label>Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={filters.paymentMethod}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">
                                        All Payment Methods
                                    </option>
                                    <option value="CASH">
                                        Cash
                                    </option>
                                    <option value="BANK_TRANSFER">
                                        Bank Transfer
                                    </option>
                                    <option value="UPI">
                                        UPI
                                    </option>
                                    <option value="CARD">
                                        Card
                                    </option>
                                    <option value="CHEQUE">
                                        Cheque
                                    </option>
                                    <option value="OTHER">
                                        Other
                                    </option>
                                </select>
                            </div>
                        </>
                    )}

                    {activeReport === REPORT_TYPES.INVENTORY && (
                        <div className="reports-checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="lowStock"
                                    checked={filters.lowStock}
                                    onChange={handleFilterChange}
                                />
                                Low Stock
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    name="outOfStock"
                                    checked={filters.outOfStock}
                                    onChange={handleFilterChange}
                                />
                                Out of Stock
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    name="overStock"
                                    checked={filters.overStock}
                                    onChange={handleFilterChange}
                                />
                                Over Stock
                            </label>
                        </div>
                    )}

                    {activeReport !== REPORT_TYPES.INVENTORY && (
                        <>
                            <div className="reports-field">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    name="fromDate"
                                    value={filters.fromDate}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="reports-field">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    name="toDate"
                                    value={filters.toDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </>
                    )}

                    <div className="reports-filter-actions">
                        <button
                            className="reports-primary-btn"
                            onClick={() => fetchReport(1)}
                            disabled={loading}
                        >
                            <FiSearch />
                            {loading ? "Loading..." : "Generate Report"}
                        </button>

                        <button
                            className="reports-secondary-btn"
                            onClick={() => {
                                setFilters(initialFilters);
                                resetReportState();
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    /* =========================
       SALES TABLE
    ========================= */

    const renderSalesTable = () => (
        <div className="reports-table-wrapper">
            <table className="reports-table">
                <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Sales Person</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Grand Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                    </tr>
                </thead>

                <tbody>
                    {reportData.map((invoice) => (
                        <tr key={invoice._id}>
                            <td>
                                {invoice.invoiceNumber || "-"}
                            </td>

                            <td>
                                {dateFormat(invoice.invoiceDate)}
                            </td>

                            <td>
                                {invoice.customer?.name || "-"}
                            </td>

                            <td>
                                {invoice.salesPerson?.name || "-"}
                            </td>

                            <td>
                                {invoice.branch?.name || "-"}
                            </td>

                            <td>
                                <StatusBadge
                                    value={invoice.status}
                                />
                            </td>

                            <td>
                                <StatusBadge
                                    value={invoice.paymentStatus}
                                />
                            </td>

                            <td>
                                {currency(invoice.grandTotal)}
                            </td>

                            <td>
                                {currency(invoice.paidAmount)}
                            </td>

                            <td>
                                {currency(invoice.balanceDue)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    /* =========================
       PURCHASE TABLE
    ========================= */

    const renderPurchaseTable = () => (
        <div className="reports-table-wrapper">
            <table className="reports-table">
                <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Branch</th>
                        <th>Purchase Order</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Due</th>
                    </tr>
                </thead>

                <tbody>
                    {reportData.map((invoice) => (
                        <tr key={invoice._id}>
                            <td>
                                {invoice.invoiceNumber || "-"}
                            </td>

                            <td>
                                {dateFormat(invoice.invoiceDate)}
                            </td>

                            <td>
                                {invoice.supplier?.name || "-"}
                            </td>

                            <td>
                                {invoice.branch?.name || "-"}
                            </td>

                            <td>
                                {invoice.purchaseOrder?.orderNumber ||
                                    "-"}
                            </td>

                            <td>
                                <StatusBadge
                                    value={invoice.status}
                                />
                            </td>

                            <td>
                                <StatusBadge
                                    value={invoice.paymentStatus}
                                />
                            </td>

                            <td>
                                {currency(invoice.totalAmount)}
                            </td>

                            <td>
                                {currency(invoice.paidAmount)}
                            </td>

                            <td>
                                {currency(invoice.dueAmount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    /* =========================
       INVENTORY TABLE
    ========================= */

    const renderInventoryTable = () => (
        <div className="reports-table-wrapper">
            <table className="reports-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Warehouse</th>
                        <th>Qty</th>
                        <th>Reserved</th>
                        <th>Available</th>
                        <th>Status</th>
                        <th>Purchase Price</th>
                        <th>Selling Price</th>
                        <th>Stock Value</th>
                        <th>Potential Profit</th>
                    </tr>
                </thead>

                <tbody>
                    {reportData.map((stock) => (
                        <tr key={stock._id}>
                            <td>
                                {stock.product?.name || "-"}
                            </td>

                            <td>
                                {stock.product?.sku || "-"}
                            </td>

                            <td>
                                {stock.category?.name || "-"}
                            </td>

                            <td>
                                {stock.warehouse?.name || "-"}
                            </td>

                            <td>
                                {number(stock.quantity)}
                            </td>

                            <td>
                                {number(stock.reservedQuantity)}
                            </td>

                            <td>
                                {number(stock.availableQuantity)}
                            </td>

                            <td>
                                <StatusBadge
                                    value={stock.stockStatus}
                                />
                            </td>

                            <td>
                                {currency(
                                    stock.purchasePrice ??
                                        stock.product?.purchasePrice
                                )}
                            </td>

                            <td>
                                {currency(
                                    stock.sellingPrice ??
                                        stock.product?.sellingPrice
                                )}
                            </td>

                            <td>
                                {currency(stock.stockValue)}
                            </td>

                            <td>
                                {currency(stock.potentialProfit)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    /* =========================
       EXPENSE TABLE
    ========================= */

    const renderExpenseTable = () => (
        <div className="reports-table-wrapper">
            <table className="reports-table">
                <thead>
                    <tr>
                        <th>Expense No.</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Supplier</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Amount</th>
                    </tr>
                </thead>

                <tbody>
                    {reportData.map((expense) => (
                        <tr key={expense._id}>
                            <td>
                                {expense.expenseNumber || "-"}
                            </td>

                            <td>
                                {dateFormat(expense.expenseDate)}
                            </td>

                            <td>
                                {expense.description || "-"}
                            </td>

                            <td>
                                {expense.category?.name || "-"}
                            </td>

                            <td>
                                {expense.supplier?.name || "-"}
                            </td>

                            <td>
                                {expense.branch?.name || "-"}
                            </td>

                            <td>
                                <StatusBadge
                                    value={expense.status}
                                />
                            </td>

                            <td>
                                {expense.paymentMethod || "-"}
                            </td>

                            <td>
                                {currency(expense.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    /* =========================
       SUMMARY BREAKDOWN
    ========================= */

    const renderBreakdowns = () => {
        if (
            activeReport === REPORT_TYPES.SALES ||
            activeReport === REPORT_TYPES.PURCHASES
        ) {
            if (!paymentStatusSummary.length) return null;

            return (
                <div className="reports-breakdown-card">
                    <div className="reports-section-title">
                        <h3>Payment Status Summary</h3>
                    </div>

                    <div className="reports-mini-table">
                        {paymentStatusSummary.map((item, index) => (
                            <div
                                className="reports-mini-row"
                                key={index}
                            >
                                <span>
                                    <StatusBadge
                                        value={item.paymentStatus}
                                    />
                                </span>

                                <span>
                                    {number(item.count)} records
                                </span>

                                <strong>
                                    {currency(item.amount)}
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeReport === REPORT_TYPES.EXPENSES) {
            return (
                <div className="reports-breakdown-grid">
                    {statusSummary.length > 0 && (
                        <BreakdownCard
                            title="Status Summary"
                            data={statusSummary}
                            labelKey="status"
                            currency={currency}
                        />
                    )}

                    {paymentMethodSummary.length > 0 && (
                        <BreakdownCard
                            title="Payment Method Summary"
                            data={paymentMethodSummary}
                            labelKey="paymentMethod"
                            currency={currency}
                        />
                    )}

                    {categorySummary.length > 0 && (
                        <BreakdownCard
                            title="Category Summary"
                            data={categorySummary}
                            labelKey="categoryName"
                            currency={currency}
                        />
                    )}
                </div>
            );
        }

        return null;
    };

    /* =========================
       TABLE
    ========================= */

    const renderTable = () => {
        if (loading) {
            return (
                <div className="reports-empty-state">
                    <FiRefreshCw className="spin large" />
                    <p>Loading report...</p>
                </div>
            );
        }

        if (!reportData.length) {
            return (
                <div className="reports-empty-state">
                    <FiSearch />
                    <h3>No report data</h3>
                    <p>
                        Select filters and click Generate Report.
                    </p>
                </div>
            );
        }

        if (activeReport === REPORT_TYPES.SALES) {
            return renderSalesTable();
        }

        if (activeReport === REPORT_TYPES.PURCHASES) {
            return renderPurchaseTable();
        }

        if (activeReport === REPORT_TYPES.INVENTORY) {
            return renderInventoryTable();
        }

        return renderExpenseTable();
    };

    return (
        <div className="reports-page">
            {/* HEADER */}

            <div className="reports-page-header">
                <div>
                    <div className="reports-title-row">
                        <FiBarChart2 />

                        <h1>Reports</h1>
                    </div>

                    <p>
                        Analyze sales, purchases, inventory and
                        expenses.
                    </p>
                </div>

                <div className="reports-export-buttons">
                    <button
                        className="reports-excel-btn"
                        onClick={() => exportReport("excel")}
                        disabled={!!exporting}
                    >
                        <FiDownload />

                        {exporting === "excel"
                            ? "Exporting..."
                            : "Excel"}
                    </button>

                    <button
                        className="reports-pdf-btn"
                        onClick={() => exportReport("pdf")}
                        disabled={!!exporting}
                    >
                        <FiFileText />

                        {exporting === "pdf"
                            ? "Exporting..."
                            : "PDF"}
                    </button>
                </div>
            </div>

            {/* REPORT TABS */}

            <div className="reports-tabs">
                <button
                    className={
                        activeReport === REPORT_TYPES.SALES
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        handleReportChange(REPORT_TYPES.SALES)
                    }
                >
                    <FiTrendingUp />
                    Sales
                </button>

                <button
                    className={
                        activeReport === REPORT_TYPES.PURCHASES
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        handleReportChange(
                            REPORT_TYPES.PURCHASES
                        )
                    }
                >
                    <FiShoppingBag />
                    Purchases
                </button>

                <button
                    className={
                        activeReport === REPORT_TYPES.INVENTORY
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        handleReportChange(
                            REPORT_TYPES.INVENTORY
                        )
                    }
                >
                    <FiPackage />
                    Inventory
                </button>

                <button
                    className={
                        activeReport === REPORT_TYPES.EXPENSES
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        handleReportChange(
                            REPORT_TYPES.EXPENSES
                        )
                    }
                >
                    <FiDollarSign />
                    Expenses
                </button>
            </div>

            {/* ERROR */}

            {error && (
                <div className="reports-error">
                    {error}
                </div>
            )}

            {/* FILTERS */}

            {renderFilters()}

            {/* SUMMARY */}

            {reportData.length > 0 && renderSummaryCards()}

            {/* BREAKDOWNS */}

            {reportData.length > 0 && renderBreakdowns()}

            {/* REPORT TABLE */}

            <div className="reports-data-card">
                <div className="reports-data-header">
                    <div>
                        <h2>
                            {activeReport === REPORT_TYPES.SALES &&
                                "Sales Report"}

                            {activeReport ===
                                REPORT_TYPES.PURCHASES &&
                                "Purchase Report"}

                            {activeReport ===
                                REPORT_TYPES.INVENTORY &&
                                "Inventory Report"}

                            {activeReport ===
                                REPORT_TYPES.EXPENSES &&
                                "Expense Report"}
                        </h2>

                        <span>
                            {pagination.total} records found
                        </span>
                    </div>
                </div>

                {renderTable()}

                {/* PAGINATION */}

                {pagination.totalPages > 1 && (
                    <div className="reports-pagination">
                        <button
                            onClick={() =>
                                changePage(pagination.page - 1)
                            }
                            disabled={pagination.page <= 1}
                        >
                            <FiChevronLeft />
                        </button>

                        <span>
                            Page{" "}
                            <strong>{pagination.page}</strong>{" "}
                            of{" "}
                            <strong>
                                {pagination.totalPages}
                            </strong>
                        </span>

                        <button
                            onClick={() =>
                                changePage(pagination.page + 1)
                            }
                            disabled={
                                pagination.page >=
                                pagination.totalPages
                            }
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* =========================================
   SUMMARY CARD
========================================= */

const SummaryCard = ({ icon, title, value }) => {
    return (
        <div className="reports-summary-card">
            <div className="reports-summary-icon">
                {icon}
            </div>

            <div>
                <span>{title}</span>
                <strong>{value}</strong>
            </div>
        </div>
    );
};

/* =========================================
   STATUS BADGE
========================================= */

const StatusBadge = ({ value }) => {
    if (!value) return <span>-</span>;

    const normalized = String(value)
        .toLowerCase()
        .replaceAll("_", "-");

    return (
        <span
            className={`reports-status-badge status-${normalized}`}
        >
            {String(value).replaceAll("_", " ")}
        </span>
    );
};

/* =========================================
   BREAKDOWN CARD
========================================= */

const BreakdownCard = ({
    title,
    data,
    labelKey,
    currency,
}) => {
    return (
        <div className="reports-breakdown-card">
            <div className="reports-section-title">
                <h3>{title}</h3>
            </div>

            <div className="reports-mini-table">
                {data.map((item, index) => (
                    <div
                        className="reports-mini-row"
                        key={index}
                    >
                        <span>
                            {item[labelKey] ||
                                item.status ||
                                "-"}
                        </span>

                        <span>
                            {item.count || 0} records
                        </span>

                        <strong>
                            {currency(item.amount)}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;