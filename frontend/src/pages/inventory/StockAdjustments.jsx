import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit3,
    FiEye,
    FiRefreshCw,
    FiTrendingUp,
    FiTrendingDown,
    FiPackage,
    FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/stockAdjustments.css";

const initialForm = {
    company: "",
    branch: "",
    warehouse: "",
    product: "",
    adjustmentType: "INCREASE",
    quantity: "",
    reason: "",
    notes: "",
};

const StockAdjustments = () => {
    // =====================================================
    // STATE
    // =====================================================

    const [adjustments, setAdjustments] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [dropdownLoading, setDropdownLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("");

    const [filterCompany, setFilterCompany] =
        useState("");
    const [filterBranch, setFilterBranch] =
        useState("");
    const [filterWarehouse, setFilterWarehouse] =
        useState("");
    const [filterProduct, setFilterProduct] =
        useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedAdjustment, setSelectedAdjustment] =
        useState(null);

    const [formData, setFormData] =
        useState(initialForm);

    // =====================================================
    // HELPERS
    // =====================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const getErrorMessage = (err, fallback) => {
        return (
            err?.response?.data?.message ||
            err?.message ||
            fallback
        );
    };

    // =====================================================
    // LOAD COMPANIES
    // =====================================================

    const loadCompanies = async () => {
        try {
            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            setCompanies(
                response.data?.companies ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error(
                "Load Companies Error:",
                err
            );
        }
    };

    // =====================================================
    // LOAD BRANCHES
    // =====================================================

    const loadBranches = async (companyId) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            setDropdownLoading(true);

            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setBranches(
                response.data?.branches ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error(
                "Load Branches Error:",
                err
            );

            setBranches([]);
        } finally {
            setDropdownLoading(false);
        }
    };

    // =====================================================
    // LOAD WAREHOUSES
    // =====================================================

    const loadWarehouses = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setWarehouses([]);
            return;
        }

        try {
            setDropdownLoading(true);

            const response = await api.get(
                `/warehouses?company=${companyId}&branch=${branchId}&page=1&limit=100`
            );

            setWarehouses(
                response.data?.warehouses ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error(
                "Load Warehouses Error:",
                err
            );

            setWarehouses([]);
        } finally {
            setDropdownLoading(false);
        }
    };

    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    const loadProducts = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setProducts([]);
            return;
        }

        try {
            setDropdownLoading(true);

            const response = await api.get(
                `/products?company=${companyId}&branch=${branchId}&page=1&limit=100`
            );

            setProducts(
                response.data?.products ||
                response.data?.data ||
                []
            );
        } catch (err) {
            console.error(
                "Load Products Error:",
                err
            );

            setProducts([]);
        } finally {
            setDropdownLoading(false);
        }
    };

    // =====================================================
    // LOAD ADJUSTMENTS
    // =====================================================

    const loadAdjustments = async (
        requestedPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            params.append(
                "page",
                requestedPage
            );

            params.append(
                "limit",
                limit
            );

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            if (filterType) {
                params.append(
                    "adjustmentType",
                    filterType
                );
            }

            if (filterCompany) {
                params.append(
                    "company",
                    filterCompany
                );
            }

            if (filterBranch) {
                params.append(
                    "branch",
                    filterBranch
                );
            }

            if (filterWarehouse) {
                params.append(
                    "warehouse",
                    filterWarehouse
                );
            }

            if (filterProduct) {
                params.append(
                    "product",
                    filterProduct
                );
            }

            const response = await api.get(
                `/stock-adjustments?${params.toString()}`
            );

            setAdjustments(
                response.data?.data || []
            );

            setPagination(
                response.data?.pagination || {
                    total: 0,
                    page: requestedPage,
                    limit,
                    totalPages: 0,
                }
            );
        } catch (err) {
            console.error(
                "Load Stock Adjustments Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to load stock adjustments"
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        loadAdjustments(page);
    }, [
        page,
        filterType,
        filterCompany,
        filterBranch,
        filterWarehouse,
        filterProduct,
    ]);

    // =====================================================
    // COMPANY CHANGE
    // =====================================================

    const handleCompanyChange = async (
        value,
        isFilter = false
    ) => {
        if (isFilter) {
            setFilterCompany(value);
            setFilterBranch("");
            setFilterWarehouse("");
            setFilterProduct("");

            setBranches([]);
            setWarehouses([]);
            setProducts([]);

            if (value) {
                await loadBranches(value);
            }

            setPage(1);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            company: value,
            branch: "",
            warehouse: "",
            product: "",
        }));

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        if (value) {
            await loadBranches(value);
        }
    };

    // =====================================================
    // BRANCH CHANGE
    // =====================================================

    const handleBranchChange = async (
        value,
        isFilter = false
    ) => {
        if (isFilter) {
            setFilterBranch(value);
            setFilterWarehouse("");
            setFilterProduct("");

            setWarehouses([]);
            setProducts([]);

            if (value && filterCompany) {
                await Promise.all([
                    loadWarehouses(
                        filterCompany,
                        value
                    ),
                    loadProducts(
                        filterCompany,
                        value
                    ),
                ]);
            }

            setPage(1);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            branch: value,
            warehouse: "",
            product: "",
        }));

        setWarehouses([]);
        setProducts([]);

        if (
            value &&
            formData.company
        ) {
            await Promise.all([
                loadWarehouses(
                    formData.company,
                    value
                ),
                loadProducts(
                    formData.company,
                    value
                ),
            ]);
        }
    };

    // =====================================================
    // FILTER WAREHOUSE CHANGE
    // =====================================================

    const handleFilterWarehouseChange = (
        value
    ) => {
        setFilterWarehouse(value);
        setPage(1);
    };

    // =====================================================
    // FILTER PRODUCT CHANGE
    // =====================================================

    const handleFilterProductChange = (
        value
    ) => {
        setFilterProduct(value);
        setPage(1);
    };

    // =====================================================
    // FORM INPUT
    // =====================================================

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // OPEN CREATE MODAL
    // =====================================================

    const openCreateModal = () => {
        clearMessages();

        setFormData(initialForm);

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        setShowModal(true);
    };

    // =====================================================
    // CLOSE CREATE MODAL
    // =====================================================

    const closeCreateModal = () => {
        setShowModal(false);
        setFormData(initialForm);

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        clearMessages();
    };

    // =====================================================
    // CREATE ADJUSTMENT
    // =====================================================

    const handleCreateAdjustment = async (
        e
    ) => {
        e.preventDefault();

        clearMessages();

        if (
            !formData.company ||
            !formData.branch ||
            !formData.warehouse ||
            !formData.product ||
            !formData.adjustmentType ||
            !formData.quantity ||
            !formData.reason.trim()
        ) {
            setError(
                "Please fill all required fields"
            );
            return;
        }

        const quantity =
            Number(formData.quantity);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            setError(
                "Quantity must be greater than 0"
            );
            return;
        }

        const payload = {
            company: formData.company,
            branch: formData.branch,
            warehouse:
                formData.warehouse,
            product: formData.product,
            adjustmentType:
                formData.adjustmentType,
            quantity,
            reason:
                formData.reason.trim(),
            notes:
                formData.notes.trim(),
        };

        try {
            setLoading(true);

            const response =
                await api.post(
                    "/stock-adjustments",
                    payload
                );

            setSuccess(
                response.data?.message ||
                "Stock adjustment created successfully"
            );

            setShowModal(false);

            setFormData(initialForm);

            setBranches([]);
            setWarehouses([]);
            setProducts([]);

            setPage(1);

            await loadAdjustments(1);
        } catch (err) {
            console.error(
                "Create Stock Adjustment Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to create stock adjustment"
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // VIEW ADJUSTMENT
    // =====================================================

    const handleViewAdjustment = async (
        adjustment
    ) => {
        try {
            clearMessages();

            const response =
                await api.get(
                    `/stock-adjustments/${adjustment._id}`
                );

            setSelectedAdjustment(
                response.data?.data ||
                adjustment
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View Stock Adjustment Error:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Failed to load stock adjustment"
                )
            );
        }
    };

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = () => {
        clearMessages();
        loadAdjustments(page);
    };

    // =====================================================
    // RESET FILTERS
    // =====================================================

    const resetFilters = () => {
        setSearch("");

        setFilterType("");
        setFilterCompany("");
        setFilterBranch("");
        setFilterWarehouse("");
        setFilterProduct("");

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        setPage(1);
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        setPage(1);
        loadAdjustments(1);
    };

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary = useMemo(() => {
        const increaseCount =
            adjustments.filter(
                (item) =>
                    item.adjustmentType ===
                    "INCREASE"
            ).length;

        const decreaseCount =
            adjustments.filter(
                (item) =>
                    item.adjustmentType ===
                    "DECREASE"
            ).length;

        return {
            total: pagination.total || 0,
            increase: increaseCount,
            decrease: decreaseCount,
            visible: adjustments.length,
        };
    }, [
        adjustments,
        pagination.total,
    ]);

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // =====================================================
    // PAGE NUMBERS
    // =====================================================

    const getPageNumbers = () => {
        const totalPages =
            pagination.totalPages || 0;

        if (totalPages <= 1) {
            return [];
        }

        const pages = [];

        const start = Math.max(
            1,
            page - 2
        );

        const end = Math.min(
            totalPages,
            page + 2
        );

        for (
            let i = start;
            i <= end;
            i++
        ) {
            pages.push(i);
        }

        return pages;
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="stock-adjustments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="stock-adjustments-header">

                <div>
                    <div className="stock-adjustments-title-row">
                        <div className="stock-adjustments-title-icon">
                            <FiEdit3 />
                        </div>

                        <div>
                            <h1>
                                Stock Adjustments
                            </h1>

                            <p>
                                Manage manual inventory
                                quantity adjustments
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="stock-adjustments-primary-btn"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus />
                    New Adjustment
                </button>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="stock-adjustments-alert error">
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
                <div className="stock-adjustments-alert success">
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
                SUMMARY
            ================================================= */}

            <div className="stock-adjustments-summary">

                <div className="stock-adjustments-summary-card">
                    <div className="summary-icon blue">
                        <FiPackage />
                    </div>

                    <div>
                        <span>
                            Total Adjustments
                        </span>

                        <strong>
                            {summary.total}
                        </strong>
                    </div>
                </div>

                <div className="stock-adjustments-summary-card">
                    <div className="summary-icon green">
                        <FiTrendingUp />
                    </div>

                    <div>
                        <span>
                            Increase
                        </span>

                        <strong>
                            {summary.increase}
                        </strong>
                    </div>
                </div>

                <div className="stock-adjustments-summary-card">
                    <div className="summary-icon red">
                        <FiTrendingDown />
                    </div>

                    <div>
                        <span>
                            Decrease
                        </span>

                        <strong>
                            {summary.decrease}
                        </strong>
                    </div>
                </div>

                <div className="stock-adjustments-summary-card">
                    <div className="summary-icon purple">
                        <FiEdit3 />
                    </div>

                    <div>
                        <span>
                            Current Page
                        </span>

                        <strong>
                            {summary.visible}
                        </strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="stock-adjustments-filter-card">

                <form
                    className="stock-adjustments-filter-row"
                    onSubmit={
                        handleSearchSubmit
                    }
                >

                    <div className="stock-adjustments-search">
                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search adjustment no, product, warehouse, reason..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <select
                        value={filterCompany}
                        onChange={(e) =>
                            handleCompanyChange(
                                e.target.value,
                                true
                            )
                        }
                    >
                        <option value="">
                            All Companies
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
                                    {company.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={filterBranch}
                        onChange={(e) =>
                            handleBranchChange(
                                e.target.value,
                                true
                            )
                        }
                        disabled={
                            !filterCompany
                        }
                    >
                        <option value="">
                            All Branches
                        </option>

                        {branches.map(
                            (branch) => (
                                <option
                                    key={
                                        branch._id
                                    }
                                    value={
                                        branch._id
                                    }
                                >
                                    {branch.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={filterWarehouse}
                        onChange={(e) =>
                            handleFilterWarehouseChange(
                                e.target.value
                            )
                        }
                        disabled={
                            !filterBranch
                        }
                    >
                        <option value="">
                            All Warehouses
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

                    <select
                        value={filterProduct}
                        onChange={(e) =>
                            handleFilterProductChange(
                                e.target.value
                            )
                        }
                        disabled={
                            !filterBranch
                        }
                    >
                        <option value="">
                            All Products
                        </option>

                        {products.map(
                            (product) => (
                                <option
                                    key={
                                        product._id
                                    }
                                    value={
                                        product._id
                                    }
                                >
                                    {product.name}
                                    {product.sku
                                        ? ` (${product.sku})`
                                        : ""}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Types
                        </option>

                        <option value="INCREASE">
                            Increase
                        </option>

                        <option value="DECREASE">
                            Decrease
                        </option>
                    </select>

                    <button
                        type="submit"
                        className="filter-search-btn"
                    >
                        <FiSearch />
                        Search
                    </button>

                    <button
                        type="button"
                        className="filter-reset-btn"
                        onClick={
                            resetFilters
                        }
                    >
                        Reset
                    </button>

                    <button
                        type="button"
                        className="filter-refresh-btn"
                        onClick={
                            handleRefresh
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "spin"
                                    : ""
                            }
                        />
                    </button>

                </form>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="stock-adjustments-table-card">

                <div className="stock-adjustments-table-wrapper">

                    <table className="stock-adjustments-table">

                        <thead>
                            <tr>
                                <th>
                                    Adjustment No
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Product
                                </th>

                                <th>
                                    Warehouse
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Previous
                                </th>

                                <th>
                                    New Stock
                                </th>

                                <th>
                                    Reason
                                </th>

                                <th>
                                    Created By
                                </th>

                                <th>
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="11"
                                        className="stock-adjustments-empty"
                                    >
                                        <div className="table-loader">
                                            <div className="loader-circle"></div>
                                            <span>
                                                Loading stock
                                                adjustments...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : adjustments.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="11"
                                        className="stock-adjustments-empty"
                                    >
                                        <FiPackage />

                                        <strong>
                                            No stock
                                            adjustments
                                            found
                                        </strong>

                                        <span>
                                            Create your
                                            first stock
                                            adjustment
                                            to see it
                                            here.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.map(
                                    (
                                        adjustment
                                    ) => (
                                        <tr
                                            key={
                                                adjustment._id
                                            }
                                        >

                                            <td>
                                                <span className="adjustment-number">
                                                    {
                                                        adjustment.adjustmentNumber
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="date-text">
                                                    {formatDate(
                                                        adjustment.adjustmentDate
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="product-cell">
                                                    <strong>
                                                        {
                                                            adjustment
                                                                .product
                                                                ?.name
                                                        }
                                                    </strong>

                                                    {adjustment
                                                        .product
                                                        ?.sku && (
                                                            <small>
                                                                SKU:{" "}
                                                                {
                                                                    adjustment
                                                                        .product
                                                                        .sku
                                                                }
                                                            </small>
                                                        )}

                                                    {adjustment
                                                        .product
                                                        ?.barcode && (
                                                            <small>
                                                                Barcode:{" "}
                                                                {
                                                                    adjustment
                                                                        .product
                                                                        .barcode
                                                                }
                                                            </small>
                                                        )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="warehouse-cell">
                                                    <strong>
                                                        {
                                                            adjustment
                                                                .warehouse
                                                                ?.name
                                                        }
                                                    </strong>

                                                    {adjustment
                                                        .warehouse
                                                        ?.code && (
                                                            <small>
                                                                {
                                                                    adjustment
                                                                        .warehouse
                                                                        .code
                                                                }
                                                            </small>
                                                        )}
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`adjustment-type ${adjustment.adjustmentType ===
                                                            "INCREASE"
                                                            ? "increase"
                                                            : "decrease"
                                                        }`}
                                                >
                                                    {adjustment.adjustmentType ===
                                                        "INCREASE" ? (
                                                        <FiTrendingUp />
                                                    ) : (
                                                        <FiTrendingDown />
                                                    )}

                                                    {
                                                        adjustment.adjustmentType
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <strong
                                                    className={
                                                        adjustment.adjustmentType ===
                                                            "INCREASE"
                                                            ? "quantity-increase"
                                                            : "quantity-decrease"
                                                    }
                                                >
                                                    {adjustment.adjustmentType ===
                                                        "INCREASE"
                                                        ? "+"
                                                        : "-"}
                                                    {
                                                        adjustment.quantity
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="quantity-box">
                                                    {
                                                        adjustment.previousQuantity
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="quantity-box new">
                                                    {
                                                        adjustment.newQuantity
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="reason-cell">
                                                    {
                                                        adjustment.reason
                                                    }
                                                </div>
                                            </td>

                                            <td>
                                                <div className="created-by-cell">
                                                    <strong>
                                                        {
                                                            adjustment
                                                                .createdBy
                                                                ?.name
                                                        }
                                                    </strong>

                                                    {adjustment.createdBy?.email && (
                                                        <small>
                                                            {adjustment.createdBy.email}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <button
                                                    className="table-view-btn"
                                                    onClick={() =>
                                                        handleViewAdjustment(
                                                            adjustment
                                                        )
                                                    }
                                                    title="View"
                                                >
                                                    <FiEye />
                                                </button>
                                            </td>

                                        </tr>
                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {pagination.totalPages >
                    1 && (
                        <div className="stock-adjustments-pagination">

                            <span>
                                Showing{" "}
                                {adjustments.length}{" "}
                                of{" "}
                                {pagination.total}{" "}
                                adjustments
                            </span>

                            <div className="pagination-buttons">

                                <button
                                    disabled={
                                        page <= 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (prev) =>
                                                Math.max(
                                                    prev -
                                                    1,
                                                    1
                                                )
                                        )
                                    }
                                >
                                    Previous
                                </button>

                                {getPageNumbers().map(
                                    (pageNumber) => (
                                        <button
                                            key={
                                                pageNumber
                                            }
                                            className={
                                                page ===
                                                    pageNumber
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setPage(
                                                    pageNumber
                                                )
                                            }
                                        >
                                            {
                                                pageNumber
                                            }
                                        </button>
                                    )
                                )}

                                <button
                                    disabled={
                                        page >=
                                        pagination.totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (prev) =>
                                                Math.min(
                                                    prev +
                                                    1,
                                                    pagination.totalPages
                                                )
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
                CREATE MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="stock-adjustments-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeCreateModal();
                        }
                    }}
                >

                    <div className="stock-adjustments-modal">

                        <div className="modal-header">

                            <div>
                                <h2>
                                    New Stock Adjustment
                                </h2>

                                <p>
                                    Adjust inventory
                                    quantity manually
                                </p>
                            </div>

                            <button
                                onClick={
                                    closeCreateModal
                                }
                            >
                                <FiX />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleCreateAdjustment
                            }
                        >

                            <div className="modal-body">

                                {/* COMPANY */}

                                <div className="form-group">
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
                                            handleCompanyChange(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select
                                            Company
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

                                <div className="form-group">
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
                                            handleBranchChange(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            !formData.company
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select
                                            Branch
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
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* WAREHOUSE */}

                                <div className="form-group">
                                    <label>
                                        Warehouse{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        value={
                                            formData.warehouse
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setFormData(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    warehouse:
                                                        e
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        disabled={
                                            !formData.branch
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select
                                            Warehouse
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
                                                    }
                                                    {warehouse.code
                                                        ? ` (${warehouse.code})`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* PRODUCT */}

                                <div className="form-group">
                                    <label>
                                        Product{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        value={
                                            formData.product
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setFormData(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    product:
                                                        e
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        disabled={
                                            !formData.branch
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select
                                            Product
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
                                                    }
                                                    {product.sku
                                                        ? ` (${product.sku})`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* TYPE */}

                                <div className="form-group">
                                    <label>
                                        Adjustment
                                        Type{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="adjustmentType"
                                        value={
                                            formData.adjustmentType
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    >
                                        <option value="INCREASE">
                                            Increase
                                        </option>

                                        <option value="DECREASE">
                                            Decrease
                                        </option>
                                    </select>
                                </div>

                                {/* QUANTITY */}

                                <div className="form-group">
                                    <label>
                                        Quantity{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="number"
                                        name="quantity"
                                        min="0.000001"
                                        step="any"
                                        placeholder="Enter quantity"
                                        value={
                                            formData.quantity
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />
                                </div>

                                {/* REASON */}

                                <div className="form-group full">
                                    <label>
                                        Reason{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        name="reason"
                                        maxLength="500"
                                        placeholder="Enter adjustment reason"
                                        value={
                                            formData.reason
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        required
                                    />
                                </div>

                                {/* NOTES */}

                                <div className="form-group full">
                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        rows="4"
                                        maxLength="1000"
                                        placeholder="Additional notes..."
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                    />
                                </div>

                            </div>

                            {/* MODAL FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={
                                        closeCreateModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-submit-btn"
                                    disabled={
                                        loading
                                    }
                                >
                                    {loading
                                        ? "Creating..."
                                        : "Create Adjustment"}
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
                selectedAdjustment && (
                    <div
                        className="stock-adjustments-modal-overlay"
                        onMouseDown={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                setShowViewModal(
                                    false
                                );
                            }
                        }}
                    >

                        <div className="stock-adjustments-view-modal">

                            <div className="modal-header">

                                <div>
                                    <h2>
                                        Stock Adjustment
                                    </h2>

                                    <p>
                                        Adjustment
                                        details
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

                            <div className="view-modal-body">

                                <div className="view-adjustment-number">
                                    {
                                        selectedAdjustment.adjustmentNumber
                                    }
                                </div>

                                <div className="view-status-row">

                                    <span
                                        className={`adjustment-type ${selectedAdjustment.adjustmentType ===
                                                "INCREASE"
                                                ? "increase"
                                                : "decrease"
                                            }`}
                                    >
                                        {selectedAdjustment.adjustmentType ===
                                            "INCREASE" ? (
                                            <FiTrendingUp />
                                        ) : (
                                            <FiTrendingDown />
                                        )}

                                        {
                                            selectedAdjustment.adjustmentType
                                        }
                                    </span>

                                    <span className="view-date">
                                        {formatDate(
                                            selectedAdjustment.adjustmentDate
                                        )}
                                    </span>

                                </div>

                                <div className="view-details-grid">

                                    <div className="view-detail">
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {
                                                selectedAdjustment
                                                    .company
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {
                                                selectedAdjustment
                                                    .branch
                                                    ?.name
                                            }
                                        </strong>

                                        {selectedAdjustment
                                            .branch
                                            ?.branchCode && (
                                                <small>
                                                    {
                                                        selectedAdjustment
                                                            .branch
                                                            .branchCode
                                                    }
                                                </small>
                                            )}
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            Warehouse
                                        </span>

                                        <strong>
                                            {
                                                selectedAdjustment
                                                    .warehouse
                                                    ?.name
                                            }
                                        </strong>

                                        {selectedAdjustment
                                            .warehouse
                                            ?.code && (
                                                <small>
                                                    {
                                                        selectedAdjustment
                                                            .warehouse
                                                            .code
                                                    }
                                                </small>
                                            )}
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            Product
                                        </span>

                                        <strong>
                                            {
                                                selectedAdjustment
                                                    .product
                                                    ?.name
                                            }
                                        </strong>

                                        {selectedAdjustment
                                            .product
                                            ?.sku && (
                                                <small>
                                                    SKU:{" "}
                                                    {
                                                        selectedAdjustment
                                                            .product
                                                            .sku
                                                    }
                                                </small>
                                            )}
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            Quantity
                                        </span>

                                        <strong
                                            className={
                                                selectedAdjustment.adjustmentType ===
                                                    "INCREASE"
                                                    ? "quantity-increase"
                                                    : "quantity-decrease"
                                            }
                                        >
                                            {selectedAdjustment.adjustmentType ===
                                                "INCREASE"
                                                ? "+"
                                                : "-"}
                                            {
                                                selectedAdjustment.quantity
                                            }
                                        </strong>
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            Previous
                                            Quantity
                                        </span>

                                        <strong>
                                            {
                                                selectedAdjustment.previousQuantity
                                            }
                                        </strong>
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            New Quantity
                                        </span>

                                        <strong className="new-quantity">
                                            {
                                                selectedAdjustment.newQuantity
                                            }
                                        </strong>
                                    </div>

                                    <div className="view-detail">
                                        <span>
                                            Created By
                                        </span>

                                        <strong>
                                            {
                                                selectedAdjustment
                                                    .createdBy
                                                    ?.name
                                            }
                                        </strong>

                                        {selectedAdjustment
                                            .createdBy
                                            ?.email && (
                                                <small>
                                                    {
                                                        selectedAdjustment
                                                            .createdBy
                                                            .email
                                                    }
                                                </small>
                                            )}
                                    </div>

                                </div>

                                <div className="view-text-section">
                                    <span>
                                        Reason
                                    </span>

                                    <p>
                                        {
                                            selectedAdjustment.reason
                                        }
                                    </p>
                                </div>

                                <div className="view-text-section">
                                    <span>
                                        Notes
                                    </span>

                                    <p>
                                        {
                                            selectedAdjustment
                                                .notes ||
                                            "No additional notes"
                                        }
                                    </p>
                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="modal-cancel-btn"
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

export default StockAdjustments;