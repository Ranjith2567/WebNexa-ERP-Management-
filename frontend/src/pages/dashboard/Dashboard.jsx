import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import {
    FiDollarSign,
    FiShoppingCart,
    FiPackage,
    FiUsers,
    FiTruck,
    FiHome,
    FiAlertTriangle,
    FiTrendingUp,
    FiTrendingDown,
    FiRefreshCw,
    FiArrowRight,
    FiBox,
    FiCreditCard,
    FiActivity,
    FiBarChart2,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getDashboardData } from "../../services/dashboardService";

import "../../styles/dashboard.css";

// =====================================================
// CURRENCY FORMAT
// =====================================================

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
};

// =====================================================
// NUMBER FORMAT
// =====================================================

const formatNumber = (value = 0) => {
    return new Intl.NumberFormat("en-IN").format(
        Number(value) || 0
    );
};

// =====================================================
// CUSTOM TOOLTIP
// =====================================================

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const sales = payload.find(
        (item) => item.dataKey === "sales"
    );

    return (
        <div
            style={{
                background: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "10px",
                padding: "12px 14px",
                boxShadow:
                    "0 10px 30px rgba(0, 0, 0, 0.35)",
            }}
        >
            <p
                style={{
                    margin: 0,
                    marginBottom: "6px",
                    color: "#94a3b8",
                    fontSize: "12px",
                }}
            >
                {label}
            </p>

            {sales && (
                <p
                    style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 600,
                    }}
                >
                    Sales: {formatCurrency(sales.value)}
                </p>
            )}
        </div>
    );
};

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // =================================================
    // STATE
    // =================================================

    const [dashboard, setDashboard] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear()
    );

    // =================================================
    // COMPANY / BRANCH
    // =================================================

    const getCompanyId = () => {
        if (user?.company?._id) {
            return user.company._id;
        }

        if (user?.company) {
            return user.company;
        }

        return localStorage.getItem("companyId");
    };

    const getBranchId = () => {
        if (user?.branch?._id) {
            return user.branch._id;
        }

        if (user?.branch) {
            return user.branch;
        }

        return localStorage.getItem("branchId");
    };

    // =================================================
    // FETCH DASHBOARD
    // =================================================

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const companyId = getCompanyId();

            const branchId = getBranchId();

            if (!companyId) {
                throw new Error(
                    "Company information is not available."
                );
            }

            const response =
                await getDashboardData(
                    companyId,
                    branchId,
                    selectedYear
                );

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                        "Failed to load dashboard."
                );
            }

            setDashboard(response.data || {});
        } catch (err) {
            console.error(
                "Dashboard fetch error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // LOAD DASHBOARD
    // =================================================

    useEffect(() => {
        fetchDashboard();
    }, [selectedYear]);

    // =================================================
    // LOADING
    // =================================================

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="dashboard-loader">
                    <FiRefreshCw
                        size={28}
                        className="dashboardSpin"
                    />

                    <p>
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // =================================================
    // ERROR
    // =================================================

    if (error) {
        return (
            <div className="dashboard-error">
                <FiAlertTriangle size={36} />

                <h3>
                    Unable to load dashboard
                </h3>

                <p>{error}</p>

                <button
                    type="button"
                    onClick={fetchDashboard}
                    className="dashboard-report-btn"
                >
                    <FiRefreshCw size={16} />
                    Try Again
                </button>
            </div>
        );
    }

    // =================================================
    // SAFE DATA
    // =================================================

    const overview =
        dashboard?.overview || {};

    const sales =
        dashboard?.sales || {};

    const purchases =
        dashboard?.purchases || {};

    const expenses =
        dashboard?.expenses || {};

    const inventory =
        dashboard?.inventory || {};

    const finance =
        dashboard?.finance || {};

    const profitability =
        dashboard?.profitability || {};

    // =================================================
    // VALUES
    // =================================================

    const totalSales =
        Number(sales.totalSales) || 0;

    const totalInvoices =
        Number(sales.totalInvoices) || 0;

    const totalCustomers =
        Number(overview.totalCustomers) || 0;

    const totalProducts =
        Number(
            inventory.totalProducts ??
                overview.totalProducts ??
                0
        );

    const totalEmployees =
        Number(overview.totalEmployees) || 0;

    const totalSuppliers =
        Number(overview.totalSuppliers) || 0;

    const totalWarehouses =
        Number(
            inventory.totalWarehouses ??
                overview.totalWarehouses ??
                0
        );

    const totalStock =
        Number(
            inventory.totalAvailableQuantity ??
                inventory.totalQuantity ??
                0
        );

    const lowStockItems =
        Number(inventory.lowStockItems) || 0;

    const outOfStockItems =
        Number(inventory.outOfStockItems) || 0;

    const totalPurchases =
        Number(purchases.totalPurchases) || 0;

    const totalExpenses =
        Number(expenses.totalExpenses) || 0;

    const totalCOGS =
        Number(profitability.cogs) || 0;

    const grossProfit =
        Number(profitability.grossProfit) || 0;

    const netProfit =
        Number(profitability.netProfit) || 0;

    const totalDebit =
        Number(finance.totalDebit) || 0;

    const totalCredit =
        Number(finance.totalCredit) || 0;

    const ledgerDifference =
        Number(finance.difference) || 0;

    // =================================================
    // SALES CHART DATA
    // =================================================

    const salesChartData = Array.isArray(
        sales.monthlySales
    )
        ? sales.monthlySales
        : [];

    const hasSalesData = salesChartData.some(
        (item) =>
            Number(item.sales || 0) > 0
    );

    // =================================================
    // PROFIT STATUS
    // =================================================

    const isProfit = netProfit >= 0;

    // =================================================
    // RETURN UI
    // =================================================

    return (
        <div className="dashboard-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="dashboard-header">

                <div>
                    <h2>
                        Dashboard
                    </h2>

                    <p>
                        Welcome back! Here&apos;s
                        your business overview.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <select
                        className="chart-filter"
                        value={selectedYear}
                        onChange={(e) =>
                            setSelectedYear(
                                Number(e.target.value)
                            )
                        }
                    >
                        <option value={2026}>
                            2026
                        </option>

                        <option value={2025}>
                            2025
                        </option>

                        <option value={2024}>
                            2024
                        </option>

                        <option value={2023}>
                            2023
                        </option>
                    </select>

                    <button
                        type="button"
                        className="dashboard-report-btn"
                        onClick={() =>
                            navigate("/reports")
                        }
                    >
                        View Reports
                        <FiArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="dashboard-stats">

                {/* SALES */}

                <div className="stat-card">

                    <div className="stat-card-top">

                        <div className="stat-icon sales">
                            <FiDollarSign />
                        </div>

                        <span>
                            Sales
                        </span>
                    </div>

                    <div className="stat-content">

                        <div className="stat-title">
                            Total Sales
                        </div>

                        <h3>
                            {formatCurrency(
                                totalSales
                            )}
                        </h3>

                        <small>
                            {formatNumber(
                                totalInvoices
                            )}{" "}
                            issued invoices
                        </small>
                    </div>
                </div>

                {/* ORDERS */}

                <div className="stat-card">

                    <div className="stat-card-top">

                        <div className="stat-icon orders">
                            <FiShoppingCart />
                        </div>

                        <span>
                            Orders
                        </span>
                    </div>

                    <div className="stat-content">

                        <div className="stat-title">
                            Sales Invoices
                        </div>

                        <h3>
                            {formatNumber(
                                totalInvoices
                            )}
                        </h3>

                        <small>
                            Issued
                        </small>
                    </div>
                </div>

                {/* PRODUCTS */}

                <div className="stat-card">

                    <div className="stat-card-top">

                        <div className="stat-icon products">
                            <FiPackage />
                        </div>

                        <span>
                            Inventory
                        </span>
                    </div>

                    <div className="stat-content">

                        <div className="stat-title">
                            Products
                        </div>

                        <h3>
                            {formatNumber(
                                totalProducts
                            )}
                        </h3>

                        <small>
                            Active products
                        </small>
                    </div>
                </div>

                {/* CUSTOMERS */}

                <div className="stat-card">

                    <div className="stat-card-top">

                        <div className="stat-icon customers">
                            <FiUsers />
                        </div>

                        <span>
                            Customers
                        </span>
                    </div>

                    <div className="stat-content">

                        <div className="stat-title">
                            Customers
                        </div>

                        <h3>
                            {formatNumber(
                                totalCustomers
                            )}
                        </h3>

                        <small>
                            Active customers
                        </small>
                    </div>
                </div>
            </div>

            {/* =================================================
                FINANCE CARDS
            ================================================= */}

            <div className="dashboard-finance-grid">

                {/* REVENUE */}

                <div className="finance-card revenue-card">

                    <div className="finance-icon">
                        <FiTrendingUp />
                    </div>

                    <div className="finance-content">

                        <span>
                            Revenue
                        </span>

                        <h3>
                            {formatCurrency(
                                totalSales
                            )}
                        </h3>

                        <small>
                            Issued sales
                        </small>
                    </div>
                </div>

                {/* EXPENSE */}

                <div className="finance-card expense-card">

                    <div className="finance-icon">
                        <FiTrendingDown />
                    </div>

                    <div className="finance-content">

                        <span>
                            Expenses
                        </span>

                        <h3>
                            {formatCurrency(
                                totalExpenses
                            )}
                        </h3>

                        <small>
                            Approved / paid
                        </small>
                    </div>
                </div>

                {/* PROFIT */}

                <div className="finance-card profit-card">

                    <div className="finance-icon">
                        {isProfit ? (
                            <FiTrendingUp />
                        ) : (
                            <FiTrendingDown />
                        )}
                    </div>

                    <div className="finance-content">

                        <span>
                            Net Profit
                        </span>

                        <h3>
                            {formatCurrency(
                                netProfit
                            )}
                        </h3>

                        <small>
                            Revenue − COGS − Expenses
                        </small>
                    </div>
                </div>
            </div>

            {/* =================================================
                SALES CHART
            ================================================= */}

            <div className="dashboard-chart-card">

                <div className="dashboard-chart-header">

                    <div>
                        <h3>
                            Sales Overview
                        </h3>

                        <p>
                            Monthly sales for{" "}
                            {selectedYear}
                        </p>
                    </div>

                    <div className="chart-filter">
                        {selectedYear}
                    </div>
                </div>

                <div className="sales-chart">

                    {hasSalesData ? (
                        <ResponsiveContainer
                            width="100%"
                            height={320}
                        >
                            <AreaChart
                                data={
                                    salesChartData
                                }
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="salesGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#2563eb"
                                            stopOpacity={
                                                0.35
                                            }
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor="#2563eb"
                                            stopOpacity={
                                                0.02
                                            }
                                        />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(148,163,184,0.08)"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="month"
                                    stroke="#64748b"
                                    tick={{
                                        fill: "#94a3b8",
                                        fontSize: 12,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    stroke="#64748b"
                                    tick={{
                                        fill: "#94a3b8",
                                        fontSize: 12,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) =>
                                        `₹${Number(
                                            value
                                        ).toLocaleString(
                                            "en-IN"
                                        )}`
                                    }
                                />

                                <Tooltip
                                    content={
                                        <CustomTooltip />
                                    }
                                />

                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fill="url(#salesGradient)"
                                    dot={{
                                        r: 3,
                                        fill: "#2563eb",
                                    }}
                                    activeDot={{
                                        r: 6,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-empty-chart">

                            <FiBarChart2
                                size={42}
                            />

                            <h3>
                                No sales analytics available
                            </h3>

                            <p>
                                No issued sales invoices
                                were found for{" "}
                                {selectedYear}.
                            </p>

                            <span>
                                Issue a sales invoice to
                                start seeing sales analytics.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* =================================================
                BUSINESS OVERVIEW + INVENTORY
            ================================================= */}

            <div className="dashboard-bottom-grid">

                {/* BUSINESS OVERVIEW */}

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <div>
                            <h3>
                                Business Overview
                            </h3>

                            <p>
                                Current organisation
                                statistics
                            </p>
                        </div>
                    </div>

                    <div className="orders-list">

                        <div className="order-row">

                            <div className="order-info">

                                <div className="order-avatar">
                                    <FiUsers />
                                </div>

                                <div>
                                    <strong>
                                        Employees
                                    </strong>

                                    <span>
                                        Active employees
                                    </span>
                                </div>
                            </div>

                            <div className="order-amount">
                                {formatNumber(
                                    totalEmployees
                                )}
                            </div>
                        </div>

                        <div className="order-row">

                            <div className="order-info">

                                <div className="order-avatar">
                                    <FiTruck />
                                </div>

                                <div>
                                    <strong>
                                        Suppliers
                                    </strong>

                                    <span>
                                        Active suppliers
                                    </span>
                                </div>
                            </div>

                            <div className="order-amount">
                                {formatNumber(
                                    totalSuppliers
                                )}
                            </div>
                        </div>

                        <div className="order-row">

                            <div className="order-info">

                                <div className="order-avatar">
                                    <FiHome />
                                </div>

                                <div>
                                    <strong>
                                        Warehouses
                                    </strong>

                                    <span>
                                        Active warehouses
                                    </span>
                                </div>
                            </div>

                            <div className="order-amount">
                                {formatNumber(
                                    totalWarehouses
                                )}
                            </div>
                        </div>

                        <div className="order-row">

                            <div className="order-info">

                                <div className="order-avatar">
                                    <FiBox />
                                </div>

                                <div>
                                    <strong>
                                        Available Stock
                                    </strong>

                                    <span>
                                        Total available
                                        quantity
                                    </span>
                                </div>
                            </div>

                            <div className="order-amount">
                                {formatNumber(
                                    totalStock
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* INVENTORY ALERTS */}

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <div>
                            <h3>
                                Inventory Status
                            </h3>

                            <p>
                                Current stock health
                            </p>
                        </div>

                        <FiPackage size={20} />
                    </div>

                    <div className="low-stock-list">

                        <div className="low-stock-row">

                            <div className="product-mini-info">

                                <div className="product-mini-icon">
                                    <FiAlertTriangle />
                                </div>

                                <div>
                                    <strong>
                                        Low Stock
                                    </strong>

                                    <span>
                                        Products below
                                        minimum level
                                    </span>
                                </div>
                            </div>

                            <div className="stock-info">
                                {formatNumber(
                                    lowStockItems
                                )}
                            </div>
                        </div>

                        <div className="low-stock-row">

                            <div className="product-mini-info">

                                <div className="product-mini-icon">
                                    <FiPackage />
                                </div>

                                <div>
                                    <strong>
                                        Out of Stock
                                    </strong>

                                    <span>
                                        Products with zero
                                        available stock
                                    </span>
                                </div>
                            </div>

                            <div className="stock-info">
                                {formatNumber(
                                    outOfStockItems
                                )}
                            </div>
                        </div>

                        <div className="low-stock-row">

                            <div className="product-mini-info">

                                <div className="product-mini-icon">
                                    <FiHome />
                                </div>

                                <div>
                                    <strong>
                                        Stock Value
                                    </strong>

                                    <span>
                                        Current inventory
                                        value
                                    </span>
                                </div>
                            </div>

                            <div className="stock-info">
                                {formatCurrency(
                                    inventory.totalStockValue ||
                                        0
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                FINANCIAL SUMMARY
            ================================================= */}

            <div className="quick-actions-panel">

                <div className="panel-header">

                    <div>
                        <h3>
                            Financial Summary
                        </h3>

                        <p>
                            Current financial position
                        </p>
                    </div>
                </div>

                <div className="quick-actions-grid">

                    <div className="quick-action-card">

                        <div className="quick-action-icon blue">
                            <FiDollarSign />
                        </div>

                        <div>
                            <span>
                                Purchases
                            </span>

                            <strong>
                                {formatCurrency(
                                    totalPurchases
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="quick-action-card">

                        <div className="quick-action-icon green">
                            <FiTrendingUp />
                        </div>

                        <div>
                            <span>
                                Gross Profit
                            </span>

                            <strong>
                                {formatCurrency(
                                    grossProfit
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="quick-action-card">

                        <div className="quick-action-icon purple">
                            <FiCreditCard />
                        </div>

                        <div>
                            <span>
                                Total Debit
                            </span>

                            <strong>
                                {formatCurrency(
                                    totalDebit
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="quick-action-card">

                        <div className="quick-action-icon orange">
                            <FiCreditCard />
                        </div>

                        <div>
                            <span>
                                Total Credit
                            </span>

                            <strong>
                                {formatCurrency(
                                    totalCredit
                                )}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                ACCOUNTING POSITION
            ================================================= */}

            <div className="dashboard-panel">

                <div className="panel-header">

                    <div>
                        <h3>
                            Accounting Position
                        </h3>

                        <p>
                            Ledger debit and credit
                            position
                        </p>
                    </div>

                    <FiActivity size={20} />
                </div>

                <div className="orders-list">

                    <div className="order-row">

                        <div className="order-info">

                            <div className="order-avatar">
                                <FiTrendingUp />
                            </div>

                            <div>
                                <strong>
                                    Total Debit
                                </strong>

                                <span>
                                    Ledger debit entries
                                </span>
                            </div>
                        </div>

                        <div className="order-amount">
                            {formatCurrency(
                                totalDebit
                            )}
                        </div>
                    </div>

                    <div className="order-row">

                        <div className="order-info">

                            <div className="order-avatar">
                                <FiTrendingDown />
                            </div>

                            <div>
                                <strong>
                                    Total Credit
                                </strong>

                                <span>
                                    Ledger credit entries
                                </span>
                            </div>
                        </div>

                        <div className="order-amount">
                            {formatCurrency(
                                totalCredit
                            )}
                        </div>
                    </div>

                    <div className="order-row">

                        <div className="order-info">

                            <div className="order-avatar">
                                <FiActivity />
                            </div>

                            <div>
                                <strong>
                                    Ledger Difference
                                </strong>

                                <span>
                                    Debit − Credit
                                </span>
                            </div>
                        </div>

                        <div className="order-amount">
                            {formatCurrency(
                                ledgerDifference
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                SYSTEM STATUS
            ================================================= */}

            <div className="dashboard-system-status">

                <div className="system-status-left">

                    <span className="system-status-dot" />

                    <div>
                        <strong>
                            System Status
                        </strong>

                        <span>
                            Dashboard connected to
                            live ERP data
                        </span>
                    </div>
                </div>

                <div className="system-status-right">

                    <span>
                        {selectedYear}
                    </span>

                    <button
                        type="button"
                        onClick={fetchDashboard}
                        title="Refresh dashboard"
                    >
                        <FiRefreshCw size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;