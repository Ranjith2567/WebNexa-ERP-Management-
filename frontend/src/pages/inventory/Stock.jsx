import React, { useEffect, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiPackage,
    FiAlertTriangle,
    FiBox,
    FiLock,
    FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/stock.css";

const initialForm = {
    company: "",
    branch: "",
    warehouse: "",
    product: "",
    quantity: 0,
    reservedQuantity: 0,
    minimumStock: 0,
    maximumStock: 0,
    isActive: true,
};

const Stock = () => {
    const [stocks, setStocks] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [lowStock, setLowStock] = useState(false);

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [editingStock, setEditingStock] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    // =====================================================
    // ALERT
    // =====================================================

    const clearAlerts = () => {
        setError("");
        setSuccess("");
    };

    const showSuccess = (message) => {
        setSuccess(message);

        setTimeout(() => {
            setSuccess("");
        }, 3000);
    };

    // =====================================================
    // FETCH COMPANIES
    // =====================================================

    const fetchCompanies = async () => {
        try {
            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            setCompanies(
                response.data.companies ||
                response.data.data ||
                []
            );
        } catch (err) {
            console.error(
                "Fetch companies error:",
                err
            );
        }
    };

    // =====================================================
    // FETCH BRANCHES
    // =====================================================

    const fetchBranches = async (companyId) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setBranches(
                response.data.branches ||
                response.data.data ||
                []
            );
        } catch (err) {
            console.error(
                "Fetch branches error:",
                err
            );

            setBranches([]);
        }
    };

    // =====================================================
    // FETCH WAREHOUSES
    // =====================================================

    const fetchWarehouses = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setWarehouses([]);
            return;
        }

        try {
            const response = await api.get(
                `/warehouses?company=${companyId}&branch=${branchId}&page=1&limit=100`
            );

            setWarehouses(
                response.data.warehouses ||
                response.data.data ||
                []
            );
        } catch (err) {
            console.error(
                "Fetch warehouses error:",
                err
            );

            setWarehouses([]);
        }
    };

    // =====================================================
    // FETCH PRODUCTS
    // =====================================================

    const fetchProducts = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setProducts([]);
            return;
        }

        try {
            const response = await api.get(
                `/products?company=${companyId}&branch=${branchId}&page=1&limit=100`
            );

            setProducts(
                response.data.products ||
                response.data.data ||
                []
            );
        } catch (err) {
            console.error(
                "Fetch products error:",
                err
            );

            setProducts([]);
        }
    };

    // =====================================================
    // FETCH STOCKS
    // =====================================================

    const fetchStocks = async (
        currentPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            params.append(
                "page",
                currentPage
            );

            params.append(
                "limit",
                "10"
            );

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            if (
                statusFilter ===
                "active"
            ) {
                params.append(
                    "isActive",
                    "true"
                );
            }

            if (
                statusFilter ===
                "inactive"
            ) {
                params.append(
                    "isActive",
                    "false"
                );
            }

            if (lowStock) {
                params.append(
                    "lowStock",
                    "true"
                );
            }

            const response = await api.get(
                `/stocks?${params.toString()}`
            );

            setStocks(
                response.data.data || []
            );

            setPagination(
                response.data.pagination || {
                    page: currentPage,
                    limit: 10,
                    total: 0,
                    pages: 1,
                }
            );
        } catch (err) {
            console.error(
                "Fetch stocks error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to fetch stocks"
            );

            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        fetchStocks(page);
    }, [
        page,
        statusFilter,
        lowStock,
    ]);

    // =====================================================
    // SEARCH
    // =====================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchStocks(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // =====================================================
    // COMPANY CHANGE
    // =====================================================

    const handleCompanyChange = async (
        companyId
    ) => {
        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            warehouse: "",
            product: "",
        }));

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        if (companyId) {
            await fetchBranches(
                companyId
            );
        }
    };

    // =====================================================
    // BRANCH CHANGE
    // =====================================================

    const handleBranchChange = async (
        branchId
    ) => {
        setFormData((prev) => ({
            ...prev,
            branch: branchId,
            warehouse: "",
            product: "",
        }));

        setWarehouses([]);
        setProducts([]);

        if (
            formData.company &&
            branchId
        ) {
            await Promise.all([
                fetchWarehouses(
                    formData.company,
                    branchId
                ),
                fetchProducts(
                    formData.company,
                    branchId
                ),
            ]);
        }
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // =====================================================
    // OPEN CREATE
    // =====================================================

    const openCreateModal = () => {
        clearAlerts();

        setEditingStock(null);

        setFormData(initialForm);

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================

    const openEditModal = async (
        stock
    ) => {
        clearAlerts();

        try {
            setLoading(true);

            const response =
                await api.get(
                    `/stocks/${stock._id}`
                );

            const data =
                response.data.data;

            setEditingStock(data);

            const companyId =
                data.company?._id ||
                data.company;

            const branchId =
                data.branch?._id ||
                data.branch;

            setFormData({
                company:
                    companyId || "",
                branch:
                    branchId || "",
                warehouse:
                    data.warehouse?._id ||
                    data.warehouse ||
                    "",
                product:
                    data.product?._id ||
                    data.product ||
                    "",
                quantity:
                    data.quantity || 0,
                reservedQuantity:
                    data.reservedQuantity ||
                    0,
                minimumStock:
                    data.minimumStock ||
                    0,
                maximumStock:
                    data.maximumStock ||
                    0,
                isActive:
                    data.isActive !== false,
            });

            await fetchBranches(
                companyId
            );

            await Promise.all([
                fetchWarehouses(
                    companyId,
                    branchId
                ),
                fetchProducts(
                    companyId,
                    branchId
                ),
            ]);

            setShowModal(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load stock"
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // SAVE STOCK
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        clearAlerts();

        try {
            setSaving(true);

            if (!editingStock) {
                const payload = {
                    company:
                        formData.company,
                    branch:
                        formData.branch,
                    warehouse:
                        formData.warehouse,
                    product:
                        formData.product,
                    quantity:
                        Number(
                            formData.quantity
                        ),
                    reservedQuantity:
                        Number(
                            formData.reservedQuantity
                        ),
                    minimumStock:
                        Number(
                            formData.minimumStock
                        ),
                    maximumStock:
                        Number(
                            formData.maximumStock
                        ),
                    isActive:
                        formData.isActive,
                };

                const response =
                    await api.post(
                        "/stocks",
                        payload
                    );

                showSuccess(
                    response.data.message ||
                    "Stock created successfully"
                );
            } else {
                const payload = {
                    reservedQuantity:
                        Number(
                            formData.reservedQuantity
                        ),
                    minimumStock:
                        Number(
                            formData.minimumStock
                        ),
                    maximumStock:
                        Number(
                            formData.maximumStock
                        ),
                    isActive:
                        formData.isActive,
                };

                const response =
                    await api.put(
                        `/stocks/${editingStock._id}`,
                        payload
                    );

                showSuccess(
                    response.data.message ||
                    "Stock updated successfully"
                );
            }

            setShowModal(false);
            setEditingStock(null);
            setFormData(initialForm);

            await fetchStocks(page);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to save stock"
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // VIEW STOCK
    // =====================================================

    const openViewModal = async (
        stock
    ) => {
        clearAlerts();

        try {
            setLoading(true);

            const response =
                await api.get(
                    `/stocks/${stock._id}`
                );

            setSelectedStock(
                response.data.data
            );

            setShowViewModal(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load stock details"
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const openDeleteModal = (
        stock
    ) => {
        clearAlerts();

        setSelectedStock(stock);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedStock) return;

        try {
            setSaving(true);
            clearAlerts();

            const response =
                await api.delete(
                    `/stocks/${selectedStock._id}`
                );

            showSuccess(
                response.data.message ||
                "Stock deleted successfully"
            );

            setShowDeleteModal(false);
            setSelectedStock(null);

            await fetchStocks(page);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete stock"
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const getAvailableQuantity = (
        stock
    ) => {
        if (
            stock.availableQuantity !==
            undefined
        ) {
            return stock.availableQuantity;
        }

        return Math.max(
            Number(
                stock.quantity || 0
            ) -
            Number(
                stock.reservedQuantity ||
                0
            ),
            0
        );
    };

    const isLowStock = (stock) => {
        const available =
            getAvailableQuantity(
                stock
            );

        const minimum =
            Number(
                stock.product
                    ?.minimumStock ??
                stock.minimumStock ??
                0
            );

        return (
            stock.isActive &&
            available <= minimum
        );
    };

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString(
            "en-IN"
        );

    // =====================================================
    // SUMMARY
    // =====================================================

    const totalQuantity =
        stocks.reduce(
            (sum, stock) =>
                sum +
                Number(
                    stock.quantity || 0
                ),
            0
        );

    const totalReserved =
        stocks.reduce(
            (sum, stock) =>
                sum +
                Number(
                    stock.reservedQuantity ||
                    0
                ),
            0
        );

    const totalAvailable =
        stocks.reduce(
            (sum, stock) =>
                sum +
                getAvailableQuantity(
                    stock
                ),
            0
        );

    const lowStockCount =
        stocks.filter(isLowStock)
            .length;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="stock-page">

            {/* HEADER */}
            <div className="stock-header">
                <div>
                    <div className="stock-title-row">
                        <div className="stock-title-icon">
                            <FiPackage />
                        </div>

                        <div>
                            <h1>
                                Stock Management
                            </h1>

                            <p>
                                Monitor and manage
                                warehouse stock
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="stock-primary-btn"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus />
                    Add Stock
                </button>
            </div>

            {/* ALERTS */}
            {error && (
                <div className="stock-alert stock-alert-error">
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
                <div className="stock-alert stock-alert-success">
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

            {/* SUMMARY */}
            <div className="stock-summary-grid">

                <div className="stock-summary-card">
                    <div className="stock-summary-icon blue">
                        <FiPackage />
                    </div>

                    <div>
                        <span>
                            Stock Records
                        </span>

                        <strong>
                            {pagination.total}
                        </strong>
                    </div>
                </div>

                <div className="stock-summary-card">
                    <div className="stock-summary-icon green">
                        <FiBox />
                    </div>

                    <div>
                        <span>
                            Available
                        </span>

                        <strong>
                            {formatNumber(
                                totalAvailable
                            )}
                        </strong>
                    </div>
                </div>

                <div className="stock-summary-card">
                    <div className="stock-summary-icon orange">
                        <FiLock />
                    </div>

                    <div>
                        <span>
                            Reserved
                        </span>

                        <strong>
                            {formatNumber(
                                totalReserved
                            )}
                        </strong>
                    </div>
                </div>

                <div className="stock-summary-card">
                    <div className="stock-summary-icon red">
                        <FiAlertTriangle />
                    </div>

                    <div>
                        <span>
                            Low Stock
                        </span>

                        <strong>
                            {lowStockCount}
                        </strong>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="stock-toolbar">

                <div className="stock-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search product, SKU, barcode or warehouse..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="stock-filter-group">

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(e) => {
                            setPage(1);

                            setStatusFilter(
                                e.target.value
                            );
                        }}
                    >
                        <option value="all">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>
                    </select>

                    <button
                        className={
                            lowStock
                                ? "stock-filter-btn active"
                                : "stock-filter-btn"
                        }
                        onClick={() => {
                            setPage(1);

                            setLowStock(
                                !lowStock
                            );
                        }}
                    >
                        <FiAlertTriangle />
                        Low Stock
                    </button>

                    <button
                        className="stock-refresh-btn"
                        onClick={() =>
                            fetchStocks(
                                page
                            )
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw />
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="stock-table-card">

                <div className="stock-table-wrapper">

                    <table className="stock-table">

                        <thead>
                            <tr>
                                <th>
                                    Product
                                </th>

                                <th>
                                    Warehouse
                                </th>

                                <th>
                                    SKU
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Reserved
                                </th>

                                <th>
                                    Available
                                </th>

                                <th>
                                    Stock Level
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

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="stock-empty"
                                    >
                                        Loading stocks...
                                    </td>
                                </tr>
                            ) : stocks.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="stock-empty"
                                    >
                                        <FiPackage />

                                        <span>
                                            No stock
                                            records
                                            found
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                stocks.map(
                                    (
                                        stock
                                    ) => {
                                        const available =
                                            getAvailableQuantity(
                                                stock
                                            );

                                        const low =
                                            isLowStock(
                                                stock
                                            );

                                        return (
                                            <tr
                                                key={
                                                    stock._id
                                                }
                                            >
                                                <td>
                                                    <div className="stock-product-cell">
                                                        <div className="stock-product-icon">
                                                            <FiPackage />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    stock
                                                                        .product
                                                                        ?.name
                                                                }
                                                            </strong>
                                                            {stock.product?.barcode && (
                                                                <small>
                                                                    Barcode:{" "}
                                                                    {stock.product.barcode}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="stock-warehouse-cell">
                                                        <strong>
                                                            {
                                                                stock
                                                                    .warehouse
                                                                    ?.name
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                stock
                                                                    .warehouse
                                                                    ?.code
                                                            }
                                                        </small>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="stock-code">
                                                        {
                                                            stock
                                                                .product
                                                                ?.sku
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {formatNumber(
                                                            stock.quantity
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className="stock-reserved">
                                                        {formatNumber(
                                                            stock.reservedQuantity
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong
                                                        className={
                                                            low
                                                                ? "stock-low-value"
                                                                : "stock-available-value"
                                                        }
                                                    >
                                                        {formatNumber(
                                                            available
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <div className="stock-level-cell">

                                                        <span
                                                            className={
                                                                low
                                                                    ? "stock-level-badge low"
                                                                    : "stock-level-badge normal"
                                                            }
                                                        >
                                                            {low
                                                                ? "Low"
                                                                : "Normal"}
                                                        </span>

                                                        <small>
                                                            Min:{" "}
                                                            {
                                                                stock
                                                                    .product
                                                                    ?.minimumStock
                                                            }
                                                        </small>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            stock.isActive
                                                                ? "stock-status active"
                                                                : "stock-status inactive"
                                                        }
                                                    >
                                                        {stock.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="stock-actions">

                                                        <button
                                                            className="stock-action view"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    stock
                                                                )
                                                            }
                                                            title="View"
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        <button
                                                            className="stock-action edit"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    stock
                                                                )
                                                            }
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 />
                                                        </button>

                                                        <button
                                                            className="stock-action delete"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    stock
                                                                )
                                                            }
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            )}

                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {pagination.pages >
                    1 && (
                        <div className="stock-pagination">

                            <span>
                                Page{" "}
                                {
                                    pagination.page
                                }{" "}
                                of{" "}
                                {
                                    pagination.pages
                                }
                            </span>

                            <div>

                                <button
                                    disabled={
                                        page <=
                                        1
                                    }
                                    onClick={() =>
                                        setPage(
                                            page -
                                            1
                                        )
                                    }
                                >
                                    Previous
                                </button>

                                <button
                                    disabled={
                                        page >=
                                        pagination.pages
                                    }
                                    onClick={() =>
                                        setPage(
                                            page +
                                            1
                                        )
                                    }
                                >
                                    Next
                                </button>

                            </div>
                        </div>
                    )}
            </div>

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="stock-modal-overlay"
                    onClick={() =>
                        setShowModal(false)
                    }
                >
                    <div
                        className="stock-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="stock-modal-header">

                            <div>
                                <h2>
                                    {editingStock
                                        ? "Edit Stock"
                                        : "Add Stock"}
                                </h2>

                                <p>
                                    {editingStock
                                        ? "Update stock settings"
                                        : "Create stock for a product and warehouse"}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setShowModal(
                                        false
                                    )
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

                            <div className="stock-form-grid">

                                {/* COMPANY */}
                                <div className="stock-form-group">

                                    <label>
                                        Company *
                                    </label>

                                    <select
                                        name="company"
                                        value={
                                            formData.company
                                        }
                                        onChange={(e) =>
                                            handleCompanyChange(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            !!editingStock
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
                                                    {
                                                        company.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* BRANCH */}
                                <div className="stock-form-group">

                                    <label>
                                        Branch *
                                    </label>

                                    <select
                                        name="branch"
                                        value={
                                            formData.branch
                                        }
                                        onChange={(e) =>
                                            handleBranchChange(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            !!editingStock ||
                                            !formData.company
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Branch
                                        </option>

                                        {branches.map(
                                            (
                                                branch
                                            ) => (
                                                <option
                                                    key={
                                                        branch._id
                                                    }
                                                    value={
                                                        branch._id
                                                    }
                                                >
                                                    {
                                                        branch.name
                                                    }{" "}
                                                    {branch.branchCode
                                                        ? `(${branch.branchCode})`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* WAREHOUSE */}
                                <div className="stock-form-group">

                                    <label>
                                        Warehouse *
                                    </label>

                                    <select
                                        name="warehouse"
                                        value={
                                            formData.warehouse
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !!editingStock ||
                                            !formData.branch
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Warehouse
                                        </option>

                                        {warehouses.map(
                                            (
                                                warehouse
                                            ) => (
                                                <option
                                                    key={
                                                        warehouse._id
                                                    }
                                                    value={
                                                        warehouse._id
                                                    }
                                                >
                                                    {
                                                        warehouse.name
                                                    }{" "}
                                                    {warehouse.code
                                                        ? `(${warehouse.code})`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* PRODUCT */}
                                <div className="stock-form-group">

                                    <label>
                                        Product *
                                    </label>

                                    <select
                                        name="product"
                                        value={
                                            formData.product
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !!editingStock ||
                                            !formData.branch
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Product
                                        </option>

                                        {products.map(
                                            (
                                                product
                                            ) => (
                                                <option
                                                    key={
                                                        product._id
                                                    }
                                                    value={
                                                        product._id
                                                    }
                                                >
                                                    {
                                                        product.name
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        product.sku
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* QUANTITY */}
                                <div className="stock-form-group">

                                    <label>
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="quantity"
                                        value={
                                            formData.quantity
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !!editingStock
                                        }
                                    />

                                    {editingStock && (
                                        <small className="stock-help">
                                            Quantity cannot
                                            be changed here.
                                            Use Stock
                                            Movements,
                                            Adjustments or
                                            Transfers.
                                        </small>
                                    )}
                                </div>

                                {/* RESERVED */}
                                <div className="stock-form-group">

                                    <label>
                                        Reserved Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="reservedQuantity"
                                        value={
                                            formData.reservedQuantity
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>

                                {/* MIN */}
                                <div className="stock-form-group">

                                    <label>
                                        Minimum Stock
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="minimumStock"
                                        value={
                                            formData.minimumStock
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>

                                {/* MAX */}
                                <div className="stock-form-group">

                                    <label>
                                        Maximum Stock
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="maximumStock"
                                        value={
                                            formData.maximumStock
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>

                            </div>

                            {/* ACTIVE */}
                            <label className="stock-checkbox">

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
                                    Active Stock
                                </span>

                            </label>

                            <div className="stock-modal-footer">

                                <button
                                    type="button"
                                    className="stock-secondary-btn"
                                    onClick={() =>
                                        setShowModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="stock-primary-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingStock
                                            ? "Update Stock"
                                            : "Create Stock"}
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
                selectedStock && (
                    <div
                        className="stock-modal-overlay"
                        onClick={() =>
                            setShowViewModal(
                                false
                            )
                        }
                    >
                        <div
                            className="stock-modal stock-view-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="stock-modal-header">

                                <div>
                                    <h2>
                                        Stock Details
                                    </h2>

                                    <p>
                                        Complete stock
                                        information
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>

                            </div>

                            <div className="stock-detail-grid">

                                <div className="stock-detail-card">
                                    <span>
                                        Product
                                    </span>

                                    <strong>
                                        {
                                            selectedStock
                                                .product
                                                ?.name
                                        }
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        SKU
                                    </span>

                                    <strong>
                                        {
                                            selectedStock
                                                .product
                                                ?.sku
                                        }
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Company
                                    </span>

                                    <strong>
                                        {
                                            selectedStock
                                                .company
                                                ?.name
                                        }
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Branch
                                    </span>

                                    <strong>
                                        {
                                            selectedStock
                                                .branch
                                                ?.name
                                        }
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Warehouse
                                    </span>

                                    <strong>
                                        {
                                            selectedStock
                                                .warehouse
                                                ?.name
                                        }
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Quantity
                                    </span>

                                    <strong>
                                        {formatNumber(
                                            selectedStock.quantity
                                        )}
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Reserved
                                    </span>

                                    <strong>
                                        {formatNumber(
                                            selectedStock.reservedQuantity
                                        )}
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Available
                                    </span>

                                    <strong className="stock-available-value">
                                        {formatNumber(
                                            getAvailableQuantity(
                                                selectedStock
                                            )
                                        )}
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Minimum Stock
                                    </span>

                                    <strong>
                                        {formatNumber(
                                            selectedStock
                                                .product
                                                ?.minimumStock ??
                                            selectedStock.minimumStock
                                        )}
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Maximum Stock
                                    </span>

                                    <strong>
                                        {formatNumber(
                                            selectedStock
                                                .product
                                                ?.maximumStock ??
                                            selectedStock.maximumStock
                                        )}
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {selectedStock.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </strong>
                                </div>

                                <div className="stock-detail-card">
                                    <span>
                                        Last Stock Update
                                    </span>

                                    <strong>
                                        {selectedStock.lastStockUpdate
                                            ? new Date(
                                                selectedStock.lastStockUpdate
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                            : "-"}
                                    </strong>
                                </div>

                            </div>

                            <div className="stock-modal-footer">

                                <button
                                    className="stock-secondary-btn"
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

            {/* =================================================
                DELETE MODAL
            ================================================= */}

            {showDeleteModal &&
                selectedStock && (
                    <div
                        className="stock-modal-overlay"
                        onClick={() =>
                            setShowDeleteModal(
                                false
                            )
                        }
                    >
                        <div
                            className="stock-delete-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="stock-delete-icon">
                                <FiTrash2 />
                            </div>

                            <h2>
                                Delete Stock?
                            </h2>

                            <p>
                                Are you sure you want
                                to delete stock for{" "}
                                <strong>
                                    {
                                        selectedStock
                                            .product
                                            ?.name
                                    }
                                </strong>
                                ?
                            </p>

                            {Number(
                                selectedStock.quantity ||
                                0
                            ) > 0 ||
                                Number(
                                    selectedStock.reservedQuantity ||
                                    0
                                ) > 0 ? (
                                <div className="stock-delete-warning">
                                    This stock cannot
                                    be deleted because
                                    quantity or reserved
                                    quantity exists.
                                </div>
                            ) : null}

                            <div className="stock-modal-footer">

                                <button
                                    className="stock-secondary-btn"
                                    onClick={() =>
                                        setShowDeleteModal(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="stock-danger-btn"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        saving ||
                                        Number(
                                            selectedStock.quantity ||
                                            0
                                        ) > 0 ||
                                        Number(
                                            selectedStock.reservedQuantity ||
                                            0
                                        ) > 0
                                    }
                                >
                                    {saving
                                        ? "Deleting..."
                                        : "Delete Stock"}
                                </button>

                            </div>

                        </div>
                    </div>
                )}

        </div>
    );
};

export default Stock;