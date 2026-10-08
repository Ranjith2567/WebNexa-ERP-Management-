import React, { useEffect, useState } from "react";
import {
    FiPackage,
    FiHome,
    FiBox,
    FiArchive,
    FiTrendingUp,
    FiDollarSign,
    FiAlertTriangle,
    FiRefreshCw,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiX,
    FiBarChart2,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/stockSummary.css";

const StockSummary = () => {
    // =====================================================
    // DATA
    // =====================================================

    const [stockSummary, setStockSummary] = useState([]);
    const [summary, setSummary] = useState({
        totalProducts: 0,
        totalWarehouses: 0,
        totalQuantity: 0,
        totalReservedQuantity: 0,
        totalAvailableQuantity: 0,
        totalStockValue: 0,
        totalSellingValue: 0,
        potentialProfit: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        overStockItems: 0,
    });

    // =====================================================
    // DROPDOWN DATA
    // =====================================================

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // =====================================================
    // FILTERS
    // =====================================================

    const [filters, setFilters] = useState({
        company: "",
        branch: "",
        warehouse: "",
        product: "",
        category: "",
        status: "all",
    });

    // =====================================================
    // PAGINATION
    // =====================================================

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });

    // =====================================================
    // UI STATES
    // =====================================================

    const [loading, setLoading] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [selectedStock, setSelectedStock] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // =====================================================
    // LOAD COMPANIES
    // =====================================================

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoadingCompanies(true);
            setError("");

            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            setCompanies(
                response.data?.companies ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error("Fetch Companies Error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load companies."
            );
        } finally {
            setLoadingCompanies(false);
        }
    };

    // =====================================================
    // LOAD BRANCHES
    // =====================================================

    useEffect(() => {
        if (!filters.company) {
            setBranches([]);
            return;
        }

        fetchBranches(filters.company);
    }, [filters.company]);

    const fetchBranches = async (companyId) => {
        try {
            setLoadingBranches(true);

            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setBranches(
                response.data?.branches ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error("Fetch Branches Error:", err);

            setBranches([]);

            setError(
                err.response?.data?.message ||
                "Failed to load branches."
            );
        } finally {
            setLoadingBranches(false);
        }
    };

    // =====================================================
    // LOAD WAREHOUSES
    // =====================================================

    useEffect(() => {
        if (!filters.company) {
            setWarehouses([]);
            return;
        }

        fetchWarehouses(
            filters.company,
            filters.branch
        );
    }, [filters.company, filters.branch]);

    const fetchWarehouses = async (
        companyId,
        branchId
    ) => {
        try {
            setLoadingWarehouses(true);

            let url =
                `/warehouses?company=${companyId}&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response = await api.get(url);

            setWarehouses(
                response.data?.warehouses ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error("Fetch Warehouses Error:", err);

            setWarehouses([]);

            setError(
                err.response?.data?.message ||
                "Failed to load warehouses."
            );
        } finally {
            setLoadingWarehouses(false);
        }
    };

    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    useEffect(() => {
        if (!filters.company) {
            setProducts([]);
            return;
        }

        fetchProducts(
            filters.company,
            filters.branch
        );
    }, [filters.company, filters.branch]);

    const fetchProducts = async (
        companyId,
        branchId
    ) => {
        try {
            setLoadingProducts(true);

            let url =
                `/products?company=${companyId}&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response = await api.get(url);

            setProducts(
                response.data?.products ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error("Fetch Products Error:", err);

            setProducts([]);

            setError(
                err.response?.data?.message ||
                "Failed to load products."
            );
        } finally {
            setLoadingProducts(false);
        }
    };

    // =====================================================
    // LOAD CATEGORIES
    // =====================================================

    useEffect(() => {
        if (!filters.company) {
            setCategories([]);
            return;
        }

        fetchCategories(filters.company);
    }, [filters.company]);

    const fetchCategories = async (companyId) => {
        try {
            setLoadingCategories(true);

            const response = await api.get(
                `/categories?company=${companyId}&page=1&limit=100`
            );

            setCategories(
                response.data?.categories ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error("Fetch Categories Error:", err);

            setCategories([]);

            setError(
                err.response?.data?.message ||
                "Failed to load categories."
            );
        } finally {
            setLoadingCategories(false);
        }
    };

    // =====================================================
    // FETCH STOCK SUMMARY
    // =====================================================

    useEffect(() => {
        if (filters.company) {
            fetchStockSummary();
        } else {
            setStockSummary([]);
            setSummary({
                totalProducts: 0,
                totalWarehouses: 0,
                totalQuantity: 0,
                totalReservedQuantity: 0,
                totalAvailableQuantity: 0,
                totalStockValue: 0,
                totalSellingValue: 0,
                potentialProfit: 0,
                lowStockItems: 0,
                outOfStockItems: 0,
                overStockItems: 0,
            });
        }
    }, [
        filters.company,
        filters.branch,
        filters.warehouse,
        filters.product,
        filters.category,
        filters.status,
        pagination.page,
        pagination.limit,
    ]);

    const fetchStockSummary = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                company: filters.company,
                page: pagination.page,
                limit: pagination.limit,
            };

            if (filters.branch) {
                params.branch = filters.branch;
            }

            if (filters.warehouse) {
                params.warehouse = filters.warehouse;
            }

            if (filters.product) {
                params.product = filters.product;
            }

            if (filters.category) {
                params.category = filters.category;
            }

            if (filters.status === "lowStock") {
                params.lowStock = true;
            }

            if (filters.status === "outOfStock") {
                params.outOfStock = true;
            }

            if (filters.status === "overStock") {
                params.overStock = true;
            }

            const response = await api.get(
                "/stock-summary",
                {
                    params,
                }
            );

            if (response.data?.success) {
                setStockSummary(
                    response.data?.data || []
                );

                setSummary(
                    response.data?.summary || {
                        totalProducts: 0,
                        totalWarehouses: 0,
                        totalQuantity: 0,
                        totalReservedQuantity: 0,
                        totalAvailableQuantity: 0,
                        totalStockValue: 0,
                        totalSellingValue: 0,
                        potentialProfit: 0,
                        lowStockItems: 0,
                        outOfStockItems: 0,
                        overStockItems: 0,
                    }
                );

                setPagination((prev) => ({
                    ...prev,
                    total:
                        response.data?.pagination?.total || 0,
                    page:
                        response.data?.pagination?.page ||
                        prev.page,
                    limit:
                        response.data?.pagination?.limit ||
                        prev.limit,
                    totalPages:
                        response.data?.pagination?.totalPages ||
                        0,
                }));
            }
        } catch (err) {
            console.error(
                "Fetch Stock Summary Error:",
                err
            );

            setStockSummary([]);

            setError(
                err.response?.data?.message ||
                "Failed to fetch stock summary."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FILTER CHANGE
    // =====================================================

    const handleFilterChange = (field, value) => {
        setFilters((prev) => {
            const updated = {
                ...prev,
                [field]: value,
            };

            if (field === "company") {
                updated.branch = "";
                updated.warehouse = "";
                updated.product = "";
                updated.category = "";
            }

            if (field === "branch") {
                updated.warehouse = "";
                updated.product = "";
            }

            return updated;
        });

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));

        setSuccess("");
        setError("");
    };

    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const clearFilters = () => {
        setFilters({
            company: "",
            branch: "",
            warehouse: "",
            product: "",
            category: "",
            status: "all",
        });

        setBranches([]);
        setWarehouses([]);
        setProducts([]);
        setCategories([]);

        setStockSummary([]);

        setSummary({
            totalProducts: 0,
            totalWarehouses: 0,
            totalQuantity: 0,
            totalReservedQuantity: 0,
            totalAvailableQuantity: 0,
            totalStockValue: 0,
            totalSellingValue: 0,
            potentialProfit: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            overStockItems: 0,
        });

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));

        setError("");
        setSuccess("");
    };

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = () => {
        if (!filters.company) {
            fetchCompanies();
            return;
        }

        fetchStockSummary();

        setSuccess("Stock summary refreshed successfully.");

        setTimeout(() => {
            setSuccess("");
        }, 2500);
    };

    // =====================================================
    // VIEW STOCK
    // =====================================================

    const handleView = (stock) => {
        setSelectedStock(stock);
        setShowViewModal(true);
    };

    // =====================================================
    // CLOSE VIEW MODAL
    // =====================================================

    const closeViewModal = () => {
        setSelectedStock(null);
        setShowViewModal(false);
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

    // =====================================================
    // FORMAT NUMBER
    // =====================================================

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2,
            }
        );
    };

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =====================================================
    // STOCK STATUS
    // =====================================================

    const getStockStatus = (stock) => {
        if (stock.isOutOfStock) {
            return {
                label: "Out of Stock",
                className: "stock-status-out",
            };
        }

        if (stock.isLowStock) {
            return {
                label: "Low Stock",
                className: "stock-status-low",
            };
        }

        if (stock.isOverStock) {
            return {
                label: "Over Stock",
                className: "stock-status-over",
            };
        }

        return {
            label: "Healthy",
            className: "stock-status-healthy",
        };
    };

    // =====================================================
    // SUMMARY CARD DATA
    // =====================================================

    const summaryCards = [
        {
            title: "Total Products",
            value: formatNumber(summary.totalProducts),
            icon: <FiPackage />,
            className: "summary-card-blue",
        },
        {
            title: "Warehouses",
            value: formatNumber(summary.totalWarehouses),
            icon: <FiHome />,
            className: "summary-card-purple",
        },
        {
            title: "Total Quantity",
            value: formatNumber(summary.totalQuantity),
            icon: <FiBox />,
            className: "summary-card-cyan",
        },
        {
            title: "Available Stock",
            value: formatNumber(
                summary.totalAvailableQuantity
            ),
            icon: <FiArchive />,
            className: "summary-card-green",
        },
        {
            title: "Reserved Stock",
            value: formatNumber(
                summary.totalReservedQuantity
            ),
            icon: <FiPackage />,
            className: "summary-card-orange",
        },
        {
            title: "Stock Value",
            value: formatCurrency(
                summary.totalStockValue
            ),
            icon: <FiDollarSign />,
            className: "summary-card-indigo",
        },
        {
            title: "Selling Value",
            value: formatCurrency(
                summary.totalSellingValue
            ),
            icon: <FiTrendingUp />,
            className: "summary-card-teal",
        },
        {
            title: "Potential Profit",
            value: formatCurrency(
                summary.potentialProfit
            ),
            icon: <FiBarChart2 />,
            className: "summary-card-profit",
        },
    ];

    return (
        <div className="stock-summary-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="stock-summary-header">

                <div>
                    <div className="stock-summary-title-row">
                        <div className="stock-summary-title-icon">
                            <FiBarChart2 />
                        </div>

                        <div>
                            <h1>Stock Summary</h1>

                            <p>
                                Monitor inventory levels,
                                stock values and stock status.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stock-summary-header-actions">

                    <button
                        type="button"
                        className="stock-summary-refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "refresh-spinning"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                </div>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="stock-summary-alert stock-summary-alert-error">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {success && (
                <div className="stock-summary-alert stock-summary-alert-success">
                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="stock-summary-cards">

                {summaryCards.map((card) => (
                    <div
                        className={`stock-summary-card ${card.className}`}
                        key={card.title}
                    >
                        <div className="stock-summary-card-icon">
                            {card.icon}
                        </div>

                        <div className="stock-summary-card-content">
                            <span>
                                {card.title}
                            </span>

                            <strong>
                                {card.value}
                            </strong>
                        </div>
                    </div>
                ))}

            </div>

            {/* =================================================
                STOCK STATUS CARDS
            ================================================= */}

            <div className="stock-status-overview">

                <div className="stock-status-overview-title">
                    <FiAlertTriangle />

                    <span>
                        Stock Alerts
                    </span>
                </div>

                <div className="stock-status-overview-items">

                    <button
                        type="button"
                        className={`stock-alert-item stock-alert-low ${
                            filters.status === "lowStock"
                                ? "stock-alert-active"
                                : ""
                        }`}
                        onClick={() =>
                            handleFilterChange(
                                "status",
                                filters.status ===
                                    "lowStock"
                                    ? "all"
                                    : "lowStock"
                            )
                        }
                    >
                        <span>
                            Low Stock
                        </span>

                        <strong>
                            {formatNumber(
                                summary.lowStockItems
                            )}
                        </strong>
                    </button>

                    <button
                        type="button"
                        className={`stock-alert-item stock-alert-out ${
                            filters.status === "outOfStock"
                                ? "stock-alert-active"
                                : ""
                        }`}
                        onClick={() =>
                            handleFilterChange(
                                "status",
                                filters.status ===
                                    "outOfStock"
                                    ? "all"
                                    : "outOfStock"
                            )
                        }
                    >
                        <span>
                            Out of Stock
                        </span>

                        <strong>
                            {formatNumber(
                                summary.outOfStockItems
                            )}
                        </strong>
                    </button>

                    <button
                        type="button"
                        className={`stock-alert-item stock-alert-over ${
                            filters.status === "overStock"
                                ? "stock-alert-active"
                                : ""
                        }`}
                        onClick={() =>
                            handleFilterChange(
                                "status",
                                filters.status ===
                                    "overStock"
                                    ? "all"
                                    : "overStock"
                            )
                        }
                    >
                        <span>
                            Over Stock
                        </span>

                        <strong>
                            {formatNumber(
                                summary.overStockItems
                            )}
                        </strong>
                    </button>

                </div>
            </div>

            {/* =================================================
                FILTER SECTION
            ================================================= */}

            <div className="stock-summary-filter-card">

                <div className="stock-summary-filter-header">

                    <div>
                        <div className="filter-title">
                            <FiFilter />

                            <span>
                                Inventory Filters
                            </span>
                        </div>

                        <p>
                            Select a company to view
                            inventory stock summary.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="clear-filter-btn"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>

                </div>

                <div className="stock-summary-filters">

                    {/* COMPANY */}

                    <div className="filter-group">

                        <label>
                            Company
                            <span>*</span>
                        </label>

                        <select
                            value={filters.company}
                            onChange={(e) =>
                                handleFilterChange(
                                    "company",
                                    e.target.value
                                )
                            }
                            disabled={loadingCompanies}
                        >
                            <option value="">
                                {loadingCompanies
                                    ? "Loading companies..."
                                    : "Select Company"}
                            </option>

                            {companies.map((company) => (
                                <option
                                    key={company._id}
                                    value={company._id}
                                >
                                    {company.name}
                                </option>
                            ))}
                        </select>

                    </div>

                    {/* BRANCH */}

                    <div className="filter-group">

                        <label>
                            Branch
                        </label>

                        <select
                            value={filters.branch}
                            onChange={(e) =>
                                handleFilterChange(
                                    "branch",
                                    e.target.value
                                )
                            }
                            disabled={
                                !filters.company ||
                                loadingBranches
                            }
                        >
                            <option value="">
                                {!filters.company
                                    ? "Select company first"
                                    : loadingBranches
                                    ? "Loading branches..."
                                    : "All Branches"}
                            </option>

                            {branches.map((branch) => (
                                <option
                                    key={branch._id}
                                    value={branch._id}
                                >
                                    {branch.name}
                                </option>
                            ))}
                        </select>

                    </div>

                    {/* WAREHOUSE */}

                    <div className="filter-group">

                        <label>
                            Warehouse
                        </label>

                        <select
                            value={filters.warehouse}
                            onChange={(e) =>
                                handleFilterChange(
                                    "warehouse",
                                    e.target.value
                                )
                            }
                            disabled={
                                !filters.company ||
                                loadingWarehouses
                            }
                        >
                            <option value="">
                                {!filters.company
                                    ? "Select company first"
                                    : loadingWarehouses
                                    ? "Loading warehouses..."
                                    : "All Warehouses"}
                            </option>

                            {warehouses.map(
                                (warehouse) => (
                                    <option
                                        key={
                                            warehouse._id
                                        }
                                        value={
                                            warehouse._id
                                        }
                                    >
                                        {warehouse.name}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    {/* PRODUCT */}

                    <div className="filter-group">

                        <label>
                            Product
                        </label>

                        <select
                            value={filters.product}
                            onChange={(e) =>
                                handleFilterChange(
                                    "product",
                                    e.target.value
                                )
                            }
                            disabled={
                                !filters.company ||
                                loadingProducts
                            }
                        >
                            <option value="">
                                {!filters.company
                                    ? "Select company first"
                                    : loadingProducts
                                    ? "Loading products..."
                                    : "All Products"}
                            </option>

                            {products.map((product) => (
                                <option
                                    key={product._id}
                                    value={product._id}
                                >
                                    {product.name}
                                    {product.sku
                                        ? ` (${product.sku})`
                                        : ""}
                                </option>
                            ))}
                        </select>

                    </div>

                    {/* CATEGORY */}

                    <div className="filter-group">

                        <label>
                            Category
                        </label>

                        <select
                            value={filters.category}
                            onChange={(e) =>
                                handleFilterChange(
                                    "category",
                                    e.target.value
                                )
                            }
                            disabled={
                                !filters.company ||
                                loadingCategories
                            }
                        >
                            <option value="">
                                {!filters.company
                                    ? "Select company first"
                                    : loadingCategories
                                    ? "Loading categories..."
                                    : "All Categories"}
                            </option>

                            {categories.map(
                                (category) => (
                                    <option
                                        key={
                                            category._id
                                        }
                                        value={
                                            category._id
                                        }
                                    >
                                        {category.name}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    {/* STATUS */}

                    <div className="filter-group">

                        <label>
                            Stock Status
                        </label>

                        <select
                            value={filters.status}
                            onChange={(e) =>
                                handleFilterChange(
                                    "status",
                                    e.target.value
                                )
                            }
                        >
                            <option value="all">
                                All Stock
                            </option>

                            <option value="lowStock">
                                Low Stock
                            </option>

                            <option value="outOfStock">
                                Out of Stock
                            </option>

                            <option value="overStock">
                                Over Stock
                            </option>
                        </select>

                    </div>

                </div>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="stock-summary-table-card">

                <div className="stock-summary-table-header">

                    <div>
                        <h2>
                            Inventory Stock
                        </h2>

                        <p>
                            {filters.company
                                ? `${formatNumber(
                                      pagination.total
                                  )} stock records`
                                : "Select a company to view stock"}
                        </p>
                    </div>

                    <div className="stock-summary-record-count">
                        {filters.company
                            ? `Page ${pagination.page} of ${
                                  pagination.totalPages ||
                                  1
                              }`
                            : "No company selected"}
                    </div>

                </div>

                {!filters.company ? (
                    <div className="stock-summary-empty">
                        <div className="empty-icon">
                            <FiPackage />
                        </div>

                        <h3>
                            Select a Company
                        </h3>

                        <p>
                            Choose a company from the
                            filters above to view
                            inventory stock summary.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="stock-summary-loading">
                        <FiRefreshCw className="refresh-spinning" />

                        <span>
                            Loading stock summary...
                        </span>
                    </div>
                ) : stockSummary.length === 0 ? (
                    <div className="stock-summary-empty">
                        <div className="empty-icon">
                            <FiArchive />
                        </div>

                        <h3>
                            No Stock Records Found
                        </h3>

                        <p>
                            No inventory stock records
                            match the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="stock-summary-table-wrapper">

                        <table className="stock-summary-table">

                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Warehouse</th>
                                    <th>Quantity</th>
                                    <th>Reserved</th>
                                    <th>Available</th>
                                    <th>Min / Max</th>
                                    <th>Purchase</th>
                                    <th>Selling</th>
                                    <th>Stock Value</th>
                                    <th>Profit</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {stockSummary.map(
                                    (stock) => {
                                        const status =
                                            getStockStatus(
                                                stock
                                            );

                                        return (
                                            <tr
                                                key={
                                                    stock._id
                                                }
                                            >

                                                {/* PRODUCT */}

                                                <td>
                                                    <div className="summary-product-cell">

                                                        <strong>
                                                            {
                                                                stock.productName
                                                            }
                                                        </strong>

                                                        {stock.sku && (
                                                            <span>
                                                                SKU:{" "}
                                                                {
                                                                    stock.sku
                                                                }
                                                            </span>
                                                        )}

                                                        {stock.barcode && (
                                                            <span>
                                                                Barcode:{" "}
                                                                {
                                                                    stock.barcode
                                                                }
                                                            </span>
                                                        )}

                                                    </div>
                                                </td>

                                                {/* CATEGORY */}

                                                <td>
                                                    <span className="summary-category">
                                                        {
                                                            stock.categoryName ||
                                                            "-"
                                                        }
                                                    </span>
                                                </td>

                                                {/* WAREHOUSE */}

                                                <td>
                                                    <div className="summary-warehouse-cell">

                                                        <strong>
                                                            {
                                                                stock.warehouseName
                                                            }
                                                        </strong>

                                                        {stock.warehouseCode && (
                                                            <span>
                                                                {
                                                                    stock.warehouseCode
                                                                }
                                                            </span>
                                                        )}

                                                    </div>
                                                </td>

                                                {/* QUANTITY */}

                                                <td>
                                                    <strong className="quantity-main">
                                                        {formatNumber(
                                                            stock.quantity
                                                        )}
                                                    </strong>
                                                </td>

                                                {/* RESERVED */}

                                                <td>
                                                    <span className="quantity-reserved">
                                                        {formatNumber(
                                                            stock.reservedQuantity
                                                        )}
                                                    </span>
                                                </td>

                                                {/* AVAILABLE */}

                                                <td>
                                                    <strong
                                                        className={
                                                            stock.isOutOfStock
                                                                ? "quantity-out"
                                                                : stock.isLowStock
                                                                ? "quantity-low"
                                                                : "quantity-available"
                                                        }
                                                    >
                                                        {formatNumber(
                                                            stock.availableQuantity
                                                        )}
                                                    </strong>
                                                </td>

                                                {/* MIN / MAX */}

                                                <td>
                                                    <div className="min-max-cell">
                                                        <span>
                                                            Min:{" "}
                                                            {
                                                                formatNumber(
                                                                    stock.minimumStock
                                                                )
                                                            }
                                                        </span>

                                                        <span>
                                                            Max:{" "}
                                                            {
                                                                stock.maximumStock > 0
                                                                    ? formatNumber(
                                                                          stock.maximumStock
                                                                      )
                                                                    : "—"
                                                            }
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* PURCHASE */}

                                                <td>
                                                    <span className="price-text">
                                                        {formatCurrency(
                                                            stock.purchasePrice
                                                        )}
                                                    </span>
                                                </td>

                                                {/* SELLING */}

                                                <td>
                                                    <span className="price-text selling-price">
                                                        {formatCurrency(
                                                            stock.sellingPrice
                                                        )}
                                                    </span>
                                                </td>

                                                {/* STOCK VALUE */}

                                                <td>
                                                    <strong className="value-text">
                                                        {formatCurrency(
                                                            stock.stockValue
                                                        )}
                                                    </strong>
                                                </td>

                                                {/* PROFIT */}

                                                <td>
                                                    <strong
                                                        className={
                                                            Number(
                                                                stock.potentialProfit
                                                            ) >=
                                                            0
                                                                ? "profit-positive"
                                                                : "profit-negative"
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            stock.potentialProfit
                                                        )}
                                                    </strong>
                                                </td>

                                                {/* STATUS */}

                                                <td>
                                                    <span
                                                        className={`stock-status-badge ${status.className}`}
                                                    >
                                                        {
                                                            status.label
                                                        }
                                                    </span>
                                                </td>

                                                {/* UPDATED */}

                                                <td>
                                                    <span className="date-text">
                                                        {formatDate(
                                                            stock.lastStockUpdate
                                                        )}
                                                    </span>
                                                </td>

                                                {/* ACTION */}

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="summary-view-btn"
                                                        onClick={() =>
                                                            handleView(
                                                                stock
                                                            )
                                                        }
                                                        title="View Stock"
                                                    >
                                                        <FiEye />
                                                    </button>
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

                {filters.company &&
                    pagination.totalPages > 0 &&
                    stockSummary.length > 0 && (
                        <div className="stock-summary-pagination">

                            <div className="pagination-info">
                                Showing{" "}
                                <strong>
                                    {pagination.total === 0
                                        ? 0
                                        : (pagination.page -
                                              1) *
                                              pagination.limit +
                                          1}
                                </strong>{" "}
                                to{" "}
                                <strong>
                                    {Math.min(
                                        pagination.page *
                                            pagination.limit,
                                        pagination.total
                                    )}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {pagination.total}
                                </strong>{" "}
                                records
                            </div>

                            <div className="pagination-controls">

                                <button
                                    type="button"
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

                                <span className="current-page">
                                    {pagination.page}
                                </span>

                                <span className="page-separator">
                                    of
                                </span>

                                <span>
                                    {pagination.totalPages}
                                </span>

                                <button
                                    type="button"
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
                selectedStock && (
                    <div
                        className="stock-summary-modal-overlay"
                        onClick={closeViewModal}
                    >
                        <div
                            className="stock-summary-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="stock-summary-modal-header">

                                <div>
                                    <h2>
                                        Stock Details
                                    </h2>

                                    <p>
                                        {
                                            selectedStock.productName
                                        }
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

                            <div className="stock-summary-modal-body">

                                {/* PRODUCT */}

                                <div className="detail-section">

                                    <h3>
                                        Product Information
                                    </h3>

                                    <div className="detail-grid">

                                        <div>
                                            <label>
                                                Product
                                            </label>

                                            <strong>
                                                {
                                                    selectedStock.productName ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                SKU
                                            </label>

                                            <strong>
                                                {
                                                    selectedStock.sku ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Barcode
                                            </label>

                                            <strong>
                                                {
                                                    selectedStock.barcode ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Category
                                            </label>

                                            <strong>
                                                {
                                                    selectedStock.categoryName ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* LOCATION */}

                                <div className="detail-section">

                                    <h3>
                                        Warehouse Information
                                    </h3>

                                    <div className="detail-grid">

                                        <div>
                                            <label>
                                                Warehouse
                                            </label>

                                            <strong>
                                                {
                                                    selectedStock.warehouseName ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Warehouse Code
                                            </label>

                                            <strong>
                                                {
                                                    selectedStock.warehouseCode ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* STOCK */}

                                <div className="detail-section">

                                    <h3>
                                        Stock Information
                                    </h3>

                                    <div className="detail-grid">

                                        <div>
                                            <label>
                                                Total Quantity
                                            </label>

                                            <strong>
                                                {formatNumber(
                                                    selectedStock.quantity
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Reserved Quantity
                                            </label>

                                            <strong>
                                                {formatNumber(
                                                    selectedStock.reservedQuantity
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Available Quantity
                                            </label>

                                            <strong>
                                                {formatNumber(
                                                    selectedStock.availableQuantity
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Minimum Stock
                                            </label>

                                            <strong>
                                                {formatNumber(
                                                    selectedStock.minimumStock
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Maximum Stock
                                            </label>

                                            <strong>
                                                {selectedStock.maximumStock >
                                                0
                                                    ? formatNumber(
                                                          selectedStock.maximumStock
                                                      )
                                                    : "No Limit"}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Status
                                            </label>

                                            <span
                                                className={`stock-status-badge ${
                                                    getStockStatus(
                                                        selectedStock
                                                    ).className
                                                }`}
                                            >
                                                {
                                                    getStockStatus(
                                                        selectedStock
                                                    ).label
                                                }
                                            </span>
                                        </div>

                                    </div>

                                </div>

                                {/* PRICING */}

                                <div className="detail-section">

                                    <h3>
                                        Pricing & Value
                                    </h3>

                                    <div className="detail-grid">

                                        <div>
                                            <label>
                                                Purchase Price
                                            </label>

                                            <strong>
                                                {formatCurrency(
                                                    selectedStock.purchasePrice
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Selling Price
                                            </label>

                                            <strong>
                                                {formatCurrency(
                                                    selectedStock.sellingPrice
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Stock Value
                                            </label>

                                            <strong>
                                                {formatCurrency(
                                                    selectedStock.stockValue
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Selling Value
                                            </label>

                                            <strong>
                                                {formatCurrency(
                                                    selectedStock.sellingValue
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Potential Profit
                                            </label>

                                            <strong className="modal-profit">
                                                {formatCurrency(
                                                    selectedStock.potentialProfit
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* DATES */}

                                <div className="detail-section">

                                    <h3>
                                        Record Information
                                    </h3>

                                    <div className="detail-grid">

                                        <div>
                                            <label>
                                                Last Stock Update
                                            </label>

                                            <strong>
                                                {formatDate(
                                                    selectedStock.lastStockUpdate
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Created At
                                            </label>

                                            <strong>
                                                {formatDate(
                                                    selectedStock.createdAt
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <label>
                                                Updated At
                                            </label>

                                            <strong>
                                                {formatDate(
                                                    selectedStock.updatedAt
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            <div className="stock-summary-modal-footer">

                                <button
                                    type="button"
                                    className="modal-close-btn"
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

export default StockSummary;