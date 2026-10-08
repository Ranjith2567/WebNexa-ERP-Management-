import { useEffect, useMemo, useState } from "react";
import {
    FiActivity,
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiEye,
    FiFilter,
    FiHash,
    FiPackage,
    FiRefreshCw,
    FiSearch,
    FiX,
    FiArrowDown,
    FiArrowUp,
    FiLayers,
    FiDollarSign,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/stockMovements.css";

const MOVEMENT_TYPES = [
    "PURCHASE",
    "PURCHASE_RETURN",
    "SALE",
    "SALES_RETURN",
    "STOCK_ADJUSTMENT_IN",
    "STOCK_ADJUSTMENT_OUT",
    "STOCK_TRANSFER_IN",
    "STOCK_TRANSFER_OUT",
    "OPENING_STOCK",
    "DAMAGE",
    "EXPIRY",
    "OTHER",
];

const REFERENCE_TYPES = [
    "GOODS_RECEIPT",
    "PURCHASE_RETURN",
    "SALES_INVOICE",
    "SALES_RETURN",
    "STOCK_ADJUSTMENT",
    "STOCK_TRANSFER",
    "PRODUCT",
    "OTHER",
];

const initialFilters = {
    search: "",
    movementType: "",
    referenceType: "",
    fromDate: "",
    toDate: "",
};

const emptyForm = {
    company: "",
    branch: "",
    warehouse: "",
    product: "",
    movementType: "OPENING_STOCK",
    referenceType: "PRODUCT",
    referenceId: "",
    referenceNumber: "",
    quantityBefore: "",
    quantityChange: "",
    quantityAfter: "",
    unitPrice: "",
    reason: "",
    notes: "",
};

const formatLabel = (value = "") => {
    return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
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

const formatNumber = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("en-IN", {
        maximumFractionDigits: 6,
    });
};

const formatMoney = (value) => {
    const number = Number(value || 0);

    return `₹${number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

function StockMovements() {
    const [movements, setMovements] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [filters, setFilters] =
        useState(initialFilters);

    const [formData, setFormData] =
        useState(emptyForm);

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1,
        limit: 20,
    });

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [loadingOptions, setLoadingOptions] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [showModal, setShowModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedMovement, setSelectedMovement] =
        useState(null);

    const [showFilters, setShowFilters] =
        useState(false);

    // ======================================================
    // FETCH MOVEMENTS
    // ======================================================

    const fetchMovements = async (
        requestedPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: requestedPage,
                limit: 20,
            };

            if (filters.search.trim()) {
                params.search =
                    filters.search.trim();
            }

            if (filters.movementType) {
                params.movementType =
                    filters.movementType;
            }

            if (filters.referenceType) {
                params.referenceType =
                    filters.referenceType;
            }

            if (filters.fromDate) {
                params.fromDate =
                    filters.fromDate;
            }

            if (filters.toDate) {
                params.toDate =
                    filters.toDate;
            }

            const response = await api.get(
                "/stock-movements",
                { params }
            );

            const data =
                response.data?.data || [];

            setMovements(
                Array.isArray(data)
                    ? data
                    : []
            );

            setPagination({
                total:
                    Number(
                        response.data?.total
                    ) || 0,

                totalPages:
                    Number(
                        response.data?.totalPages
                    ) || 1,

                limit:
                    Number(
                        response.data?.limit
                    ) || 20,
            });

            setPage(
                Number(
                    response.data?.page
                ) || requestedPage
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load stock movements"
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // FETCH COMPANIES
    // ======================================================

    const fetchCompanies = async () => {
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
                "Failed to fetch companies:",
                err
            );
        }
    };

    // ======================================================
    // FETCH BRANCHES
    // ======================================================

    const fetchBranches = async (
        companyId
    ) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response =
                await api.get(
                    `/branches?company=${companyId}&page=1&limit=100`
                );

            setBranches(
                response.data?.branches ||
                    response.data?.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to fetch branches:",
                err
            );

            setBranches([]);
        }
    };

    // ======================================================
    // FETCH WAREHOUSES
    // ======================================================

    const fetchWarehouses = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setWarehouses([]);
            return;
        }

        try {
            const response =
                await api.get(
                    `/warehouses?company=${companyId}&branch=${branchId}&page=1&limit=100`
                );

            setWarehouses(
                response.data?.warehouses ||
                    response.data?.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to fetch warehouses:",
                err
            );

            setWarehouses([]);
        }
    };

    // ======================================================
    // FETCH PRODUCTS
    // ======================================================

    const fetchProducts = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setProducts([]);
            return;
        }

        try {
            const response =
                await api.get(
                    `/products?company=${companyId}&branch=${branchId}&page=1&limit=100`
                );

            setProducts(
                response.data?.products ||
                    response.data?.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to fetch products:",
                err
            );

            setProducts([]);
        }
    };

    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        fetchMovements(1);
    }, [
        filters.movementType,
        filters.referenceType,
        filters.fromDate,
        filters.toDate,
    ]);

    // ======================================================
    // SEARCH
    // ======================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMovements(1);
        }, 450);

        return () => clearTimeout(timer);
    }, [filters.search]);

    // ======================================================
    // COMPANY CHANGE
    // ======================================================

    useEffect(() => {
        if (!formData.company) {
            setBranches([]);
            setWarehouses([]);
            setProducts([]);
            return;
        }

        fetchBranches(formData.company);
        setWarehouses([]);
        setProducts([]);

        setFormData((previous) => ({
            ...previous,
            branch: "",
            warehouse: "",
            product: "",
            quantityBefore: "",
            quantityAfter: "",
        }));
    }, [formData.company]);

    // ======================================================
    // BRANCH CHANGE
    // ======================================================

    useEffect(() => {
        if (
            !formData.company ||
            !formData.branch
        ) {
            setWarehouses([]);
            setProducts([]);
            return;
        }

        fetchWarehouses(
            formData.company,
            formData.branch
        );

        fetchProducts(
            formData.company,
            formData.branch
        );

        setFormData((previous) => ({
            ...previous,
            warehouse: "",
            product: "",
            quantityBefore: "",
            quantityAfter: "",
        }));
    }, [formData.branch]);

    // ======================================================
    // PRODUCT CHANGE
    // ======================================================

    useEffect(() => {
        if (!formData.product) {
            setFormData((previous) => ({
                ...previous,
                quantityBefore: "",
                quantityAfter: "",
            }));

            return;
        }

        const product = products.find(
            (item) =>
                item._id === formData.product ||
                item.id === formData.product
        );

        if (!product) return;

        setFormData((previous) => ({
            ...previous,
            unitPrice:
                previous.unitPrice ||
                product.purchasePrice ||
                product.sellingPrice ||
                "",
        }));
    }, [formData.product]);

    // ======================================================
    // CALCULATE AFTER
    // ======================================================

    useEffect(() => {
        const before =
            Number(formData.quantityBefore);

        const change =
            Number(formData.quantityChange);

        if (
            Number.isFinite(before) &&
            Number.isFinite(change) &&
            formData.quantityBefore !== "" &&
            formData.quantityChange !== ""
        ) {
            setFormData((previous) => ({
                ...previous,
                quantityAfter:
                    before + change,
            }));
        }
    }, [
        formData.quantityBefore,
        formData.quantityChange,
    ]);

    // ======================================================
    // HANDLERS
    // ======================================================

    const handleFilterChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setFilters((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const clearFilters = () => {
        setFilters(initialFilters);
        setPage(1);
    };

    const handleFormChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const openCreateModal = () => {
        setError("");
        setSuccess("");

        setFormData({
            ...emptyForm,
        });

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setFormData({
            ...emptyForm,
        });
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedMovement(null);
    };

    // ======================================================
    // CREATE MOVEMENT
    // ======================================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (
                !formData.company ||
                !formData.branch ||
                !formData.warehouse ||
                !formData.product
            ) {
                setError(
                    "Company, branch, warehouse and product are required"
                );

                setSaving(false);
                return;
            }

            if (
                !formData.quantityBefore ||
                !formData.quantityChange
            ) {
                setError(
                    "Quantity before and quantity change are required"
                );

                setSaving(false);
                return;
            }

            const quantityBefore =
                Number(
                    formData.quantityBefore
                );

            const quantityChange =
                Number(
                    formData.quantityChange
                );

            const quantityAfter =
                Number(
                    formData.quantityAfter
                );

            if (
                !Number.isFinite(
                    quantityBefore
                ) ||
                quantityBefore < 0
            ) {
                setError(
                    "Invalid quantity before"
                );

                setSaving(false);
                return;
            }

            if (
                !Number.isFinite(
                    quantityChange
                ) ||
                quantityChange === 0
            ) {
                setError(
                    "Quantity change cannot be zero"
                );

                setSaving(false);
                return;
            }

            if (
                !Number.isFinite(
                    quantityAfter
                ) ||
                quantityAfter < 0
            ) {
                setError(
                    "Invalid quantity after"
                );

                setSaving(false);
                return;
            }

            const payload = {
                company:
                    formData.company,

                branch:
                    formData.branch,

                warehouse:
                    formData.warehouse,

                product:
                    formData.product,

                movementType:
                    formData.movementType,

                referenceType:
                    formData.referenceType,

                referenceId:
                    formData.referenceId ||
                    null,

                referenceNumber:
                    formData.referenceNumber.trim(),

                quantityBefore,

                quantityChange,

                quantityAfter,

                unitPrice:
                    Number(
                        formData.unitPrice || 0
                    ),

                reason:
                    formData.reason.trim(),

                notes:
                    formData.notes.trim(),
            };

            await api.post(
                "/stock-movements",
                payload
            );

            setSuccess(
                "Stock movement recorded successfully"
            );

            setShowModal(false);

            setFormData({
                ...emptyForm,
            });

            setPage(1);

            await fetchMovements(1);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to create stock movement"
            );
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // VIEW MOVEMENT
    // ======================================================

    const handleView = async (
        movement
    ) => {
        try {
            setError("");

            const id =
                movement._id ||
                movement.id;

            const response =
                await api.get(
                    `/stock-movements/${id}`
                );

            setSelectedMovement(
                response.data?.data ||
                    movement
            );

            setShowViewModal(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load stock movement"
            );
        }
    };

    // ======================================================
    // PAGINATION
    // ======================================================

    const goToPage = (
        nextPage
    ) => {
        if (
            nextPage < 1 ||
            nextPage >
                pagination.totalPages
        ) {
            return;
        }

        fetchMovements(nextPage);
    };

    // ======================================================
    // SUMMARY
    // ======================================================

    const summary = useMemo(() => {
        let totalIn = 0;
        let totalOut = 0;
        let totalValue = 0;

        movements.forEach(
            (movement) => {
                const change =
                    Number(
                        movement.quantityChange
                    ) || 0;

                if (change > 0) {
                    totalIn += change;
                }

                if (change < 0) {
                    totalOut += Math.abs(
                        change
                    );
                }

                totalValue +=
                    Number(
                        movement.totalValue
                    ) || 0;
            }
        );

        return {
            count:
                pagination.total,

            totalIn,

            totalOut,

            net:
                totalIn - totalOut,

            totalValue,
        };
    }, [
        movements,
        pagination.total,
    ]);

    // ======================================================
    // MOVEMENT CLASS
    // ======================================================

    const getMovementClass = (
        type
    ) => {
        if (!type) return "neutral";

        if (
            type.includes("_IN") ||
            type === "PURCHASE" ||
            type === "SALES_RETURN" ||
            type === "OPENING_STOCK"
        ) {
            return "in";
        }

        if (
            type.includes("_OUT") ||
            type === "SALE" ||
            type === "PURCHASE_RETURN" ||
            type === "DAMAGE" ||
            type === "EXPIRY"
        ) {
            return "out";
        }

        return "neutral";
    };

    return (
        <div className="stock-movements-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="stock-movements-header">

                <div className="stock-movements-title-row">

                    <div className="stock-movements-title-icon">
                        <FiActivity />
                    </div>

                    <div>
                        <h1>
                            Stock Movements
                        </h1>

                        <p>
                            Track every stock movement and inventory transaction
                        </p>
                    </div>

                </div>

                <button
                    className="stock-movements-primary-btn"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiActivity />
                    Record Movement
                </button>

            </div>

            {/* ==================================================
                ALERTS
            ================================================== */}

            {error && (
                <div className="stock-movements-alert stock-movements-alert-error">

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
                <div className="stock-movements-alert stock-movements-alert-success">

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

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="stock-movements-summary-grid">

                <div className="stock-movements-summary-card">

                    <div className="stock-movements-summary-icon blue">
                        <FiActivity />
                    </div>

                    <div>
                        <span>
                            Total Movements
                        </span>

                        <strong>
                            {summary.count}
                        </strong>
                    </div>

                </div>

                <div className="stock-movements-summary-card">

                    <div className="stock-movements-summary-icon green">
                        <FiArrowUp />
                    </div>

                    <div>
                        <span>
                            Stock In
                        </span>

                        <strong>
                            {formatNumber(
                                summary.totalIn
                            )}
                        </strong>
                    </div>

                </div>

                <div className="stock-movements-summary-card">

                    <div className="stock-movements-summary-icon red">
                        <FiArrowDown />
                    </div>

                    <div>
                        <span>
                            Stock Out
                        </span>

                        <strong>
                            {formatNumber(
                                summary.totalOut
                            )}
                        </strong>
                    </div>

                </div>

                <div className="stock-movements-summary-card">

                    <div className="stock-movements-summary-icon orange">
                        <FiLayers />
                    </div>

                    <div>
                        <span>
                            Net Movement
                        </span>

                        <strong
                            className={
                                summary.net >= 0
                                    ? "movement-positive"
                                    : "movement-negative"
                            }
                        >
                            {summary.net >= 0
                                ? "+"
                                : ""}
                            {formatNumber(
                                summary.net
                            )}
                        </strong>
                    </div>

                </div>

            </div>

            {/* ==================================================
                TOOLBAR
            ================================================== */}

            <div className="stock-movements-toolbar">

                <div className="stock-movements-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search reference, reason or notes..."
                        name="search"
                        value={
                            filters.search
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                </div>

                <div className="stock-movements-filter-group">

                    <button
                        className={`stock-movements-filter-btn ${
                            showFilters
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setShowFilters(
                                (value) =>
                                    !value
                            )
                        }
                    >
                        <FiFilter />
                        Filters
                    </button>

                    <button
                        className="stock-movements-refresh-btn"
                        onClick={() =>
                            fetchMovements(
                                page
                            )
                        }
                        disabled={loading}
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>

                </div>

            </div>

            {/* ==================================================
                FILTER PANEL
            ================================================== */}

            {showFilters && (
                <div className="stock-movements-filter-panel">

                    <div className="stock-movement-filter-field">

                        <label>
                            Movement Type
                        </label>

                        <select
                            name="movementType"
                            value={
                                filters.movementType
                            }
                            onChange={
                                handleFilterChange
                            }
                        >
                            <option value="">
                                All Movement Types
                            </option>

                            {MOVEMENT_TYPES.map(
                                (type) => (
                                    <option
                                        key={
                                            type
                                        }
                                        value={
                                            type
                                        }
                                    >
                                        {formatLabel(
                                            type
                                        )}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    <div className="stock-movement-filter-field">

                        <label>
                            Reference Type
                        </label>

                        <select
                            name="referenceType"
                            value={
                                filters.referenceType
                            }
                            onChange={
                                handleFilterChange
                            }
                        >
                            <option value="">
                                All Reference Types
                            </option>

                            {REFERENCE_TYPES.map(
                                (type) => (
                                    <option
                                        key={
                                            type
                                        }
                                        value={
                                            type
                                        }
                                    >
                                        {formatLabel(
                                            type
                                        )}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    <div className="stock-movement-filter-field">

                        <label>
                            From Date
                        </label>

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

                    <div className="stock-movement-filter-field">

                        <label>
                            To Date
                        </label>

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

                    <button
                        className="stock-movements-clear-filter"
                        onClick={
                            clearFilters
                        }
                    >
                        Clear
                    </button>

                </div>
            )}

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="stock-movements-table-card">

                <div className="stock-movements-table-wrapper">

                    <table className="stock-movements-table">

                        <thead>
                            <tr>
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
                                    Movement
                                </th>

                                <th>
                                    Reference
                                </th>

                                <th>
                                    Before
                                </th>

                                <th>
                                    Change
                                </th>

                                <th>
                                    After
                                </th>

                                <th>
                                    Value
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
                                        colSpan="10"
                                        className="stock-movements-empty"
                                    >
                                        <FiRefreshCw className="spin" />

                                        <span>
                                            Loading stock movements...
                                        </span>
                                    </td>
                                </tr>
                            ) : movements.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="stock-movements-empty"
                                    >
                                        <FiActivity />

                                        <span>
                                            No stock movements found
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                movements.map(
                                    (
                                        movement
                                    ) => {
                                        const movementClass =
                                            getMovementClass(
                                                movement.movementType
                                            );

                                        const change =
                                            Number(
                                                movement.quantityChange
                                            ) ||
                                            0;

                                        return (
                                            <tr
                                                key={
                                                    movement._id ||
                                                    movement.id
                                                }
                                            >

                                                <td>

                                                    <div className="movement-date-cell">

                                                        <strong>
                                                            {formatDateTime(
                                                                movement.createdAt
                                                            )}
                                                        </strong>

                                                        <small>
                                                            {movement.createdBy
                                                                ?.name ||
                                                                "System"}
                                                        </small>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="movement-product-cell">

                                                        <div className="movement-product-icon">
                                                            <FiPackage />
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {movement.product
                                                                    ?.name ||
                                                                    "-"}
                                                            </strong>

                                                            <small>
                                                                SKU:{" "}
                                                                {movement.product
                                                                    ?.sku ||
                                                                    "-"}
                                                            </small>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="movement-warehouse-cell">

                                                        <strong>
                                                            {movement.warehouse
                                                                ?.name ||
                                                                "-"}
                                                        </strong>

                                                        <small>
                                                            {movement.warehouse
                                                                ?.code ||
                                                                "-"}
                                                        </small>

                                                    </div>

                                                </td>

                                                <td>

                                                    <span
                                                        className={`movement-type-badge ${movementClass}`}
                                                    >
                                                        {change >
                                                        0 ? (
                                                            <FiArrowUp />
                                                        ) : (
                                                            <FiArrowDown />
                                                        )}

                                                        {formatLabel(
                                                            movement.movementType
                                                        )}
                                                    </span>

                                                </td>

                                                <td>

                                                    <div className="movement-reference-cell">

                                                        <strong>
                                                            {movement.referenceNumber ||
                                                                "-"}
                                                        </strong>

                                                        <small>
                                                            {formatLabel(
                                                                movement.referenceType
                                                            )}
                                                        </small>

                                                    </div>

                                                </td>

                                                <td>
                                                    <span className="movement-quantity">
                                                        {formatNumber(
                                                            movement.quantityBefore
                                                        )}
                                                    </span>
                                                </td>

                                                <td>

                                                    <span
                                                        className={`movement-change ${
                                                            change >
                                                            0
                                                                ? "positive"
                                                                : "negative"
                                                        }`}
                                                    >
                                                        {change >
                                                        0
                                                            ? "+"
                                                            : ""}
                                                        {formatNumber(
                                                            change
                                                        )}
                                                    </span>

                                                </td>

                                                <td>
                                                    <span className="movement-quantity after">
                                                        {formatNumber(
                                                            movement.quantityAfter
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="movement-value">
                                                        {formatMoney(
                                                            movement.totalValue
                                                        )}
                                                    </span>
                                                </td>

                                                <td>

                                                    <div className="movement-actions">

                                                        <button
                                                            className="movement-action view"
                                                            title="View"
                                                            onClick={() =>
                                                                handleView(
                                                                    movement
                                                                )
                                                            }
                                                        >
                                                            <FiEye />
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

                {/* ==================================================
                    PAGINATION
                ================================================== */}

                <div className="stock-movements-pagination">

                    <span>
                        Showing{" "}
                        {movements.length} of{" "}
                        {pagination.total} movements
                    </span>

                    <div>

                        <button
                            onClick={() =>
                                goToPage(
                                    page - 1
                                )
                            }
                            disabled={
                                page <= 1 ||
                                loading
                            }
                        >
                            <FiChevronLeft />
                            Previous
                        </button>

                        <span className="movement-page-number">
                            Page {page} of{" "}
                            {
                                pagination.totalPages
                            }
                        </span>

                        <button
                            onClick={() =>
                                goToPage(
                                    page + 1
                                )
                            }
                            disabled={
                                page >=
                                    pagination.totalPages ||
                                loading
                            }
                        >
                            Next
                            <FiChevronRight />
                        </button>

                    </div>

                </div>

            </div>

            {/* ==================================================
                CREATE MODAL
            ================================================== */}

            {showModal && (
                <div className="stock-movements-modal-overlay">

                    <div className="stock-movements-modal">

                        <div className="stock-movements-modal-header">

                            <div>
                                <h2>
                                    Record Stock Movement
                                </h2>

                                <p>
                                    Create a permanent stock audit record
                                </p>
                            </div>

                            <button
                                onClick={
                                    closeModal
                                }
                                disabled={saving}
                            >
                                <FiX />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="stock-movements-form-grid">

                                {/* COMPANY */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Company *
                                    </label>

                                    <select
                                        name="company"
                                        value={
                                            formData.company
                                        }
                                        onChange={
                                            handleFormChange
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

                                <div className="stock-movement-form-group">

                                    <label>
                                        Branch *
                                    </label>

                                    <select
                                        name="branch"
                                        value={
                                            formData.branch
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        disabled={
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
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                {/* WAREHOUSE */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Warehouse *
                                    </label>

                                    <select
                                        name="warehouse"
                                        value={
                                            formData.warehouse
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        disabled={
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
                                                    }
                                                    {" "}
                                                    (
                                                    {
                                                        warehouse.code
                                                    }
                                                    )
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                {/* PRODUCT */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Product *
                                    </label>

                                    <select
                                        name="product"
                                        value={
                                            formData.product
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        disabled={
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
                                                    }
                                                    {" "}
                                                    (
                                                    {
                                                        product.sku
                                                    }
                                                    )
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                {/* MOVEMENT TYPE */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Movement Type *
                                    </label>

                                    <select
                                        name="movementType"
                                        value={
                                            formData.movementType
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        required
                                    >
                                        {MOVEMENT_TYPES.map(
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
                                                    {formatLabel(
                                                        type
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                {/* REFERENCE TYPE */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Reference Type *
                                    </label>

                                    <select
                                        name="referenceType"
                                        value={
                                            formData.referenceType
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        required
                                    >
                                        {REFERENCE_TYPES.map(
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
                                                    {formatLabel(
                                                        type
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>

                                {/* REFERENCE NUMBER */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Reference Number
                                    </label>

                                    <input
                                        type="text"
                                        name="referenceNumber"
                                        value={
                                            formData.referenceNumber
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="e.g. INV-0001"
                                    />

                                </div>

                                {/* REFERENCE ID */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Reference ID
                                    </label>

                                    <input
                                        type="text"
                                        name="referenceId"
                                        value={
                                            formData.referenceId
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="MongoDB ObjectId (optional)"
                                    />

                                </div>

                                {/* BEFORE */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Quantity Before *
                                    </label>

                                    <input
                                        type="number"
                                        name="quantityBefore"
                                        value={
                                            formData.quantityBefore
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        min="0"
                                        step="any"
                                        placeholder="Current stock quantity"
                                        required
                                    />

                                    <small className="stock-movement-help">
                                        Must match the current stock quantity.
                                    </small>

                                </div>

                                {/* CHANGE */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Quantity Change *
                                    </label>

                                    <input
                                        type="number"
                                        name="quantityChange"
                                        value={
                                            formData.quantityChange
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        step="any"
                                        placeholder="Use + for IN, - for OUT"
                                        required
                                    />

                                    <small className="stock-movement-help">
                                        Example: +10 or -5
                                    </small>

                                </div>

                                {/* AFTER */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Quantity After
                                    </label>

                                    <input
                                        type="number"
                                        name="quantityAfter"
                                        value={
                                            formData.quantityAfter
                                        }
                                        readOnly
                                    />

                                    <small className="stock-movement-help">
                                        Automatically calculated.
                                    </small>

                                </div>

                                {/* UNIT PRICE */}

                                <div className="stock-movement-form-group">

                                    <label>
                                        Unit Price
                                    </label>

                                    <input
                                        type="number"
                                        name="unitPrice"
                                        value={
                                            formData.unitPrice
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />

                                </div>

                                {/* REASON */}

                                <div className="stock-movement-form-group full">

                                    <label>
                                        Reason
                                    </label>

                                    <input
                                        type="text"
                                        name="reason"
                                        value={
                                            formData.reason
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        maxLength="1000"
                                        placeholder="Reason for this movement"
                                    />

                                </div>

                                {/* NOTES */}

                                <div className="stock-movement-form-group full">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        maxLength="2000"
                                        placeholder="Additional notes..."
                                        rows="4"
                                    />

                                </div>

                            </div>

                            <div className="stock-movements-modal-footer">

                                <button
                                    type="button"
                                    className="stock-movements-secondary-btn"
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
                                    className="stock-movements-primary-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FiRefreshCw className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiActivity />
                                            Record Movement
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ==================================================
                VIEW MODAL
            ================================================== */}

            {showViewModal &&
                selectedMovement && (
                    <div className="stock-movements-modal-overlay">

                        <div className="stock-movements-modal stock-movements-view-modal">

                            <div className="stock-movements-modal-header">

                                <div>
                                    <h2>
                                        Stock Movement Details
                                    </h2>

                                    <p>
                                        Permanent inventory audit record
                                    </p>
                                </div>

                                <button
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FiX />
                                </button>

                            </div>

                            <div className="stock-movement-view-content">

                                <div className="stock-movement-view-highlight">

                                    <div className="movement-view-icon">
                                        <FiActivity />
                                    </div>

                                    <div>

                                        <strong>
                                            {formatLabel(
                                                selectedMovement.movementType
                                            )}
                                        </strong>

                                        <span>
                                            {formatDateTime(
                                                selectedMovement.createdAt
                                            )}
                                        </span>

                                    </div>

                                </div>

                                <div className="stock-movement-detail-grid">

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Product
                                        </span>

                                        <strong>
                                            {selectedMovement.product
                                                ?.name ||
                                                "-"}
                                        </strong>

                                        <small>
                                            SKU:{" "}
                                            {selectedMovement.product
                                                ?.sku ||
                                                "-"}
                                        </small>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Warehouse
                                        </span>

                                        <strong>
                                            {selectedMovement.warehouse
                                                ?.name ||
                                                "-"}
                                        </strong>

                                        <small>
                                            {
                                                selectedMovement.warehouse
                                                    ?.code
                                            }
                                        </small>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {selectedMovement.company
                                                ?.name ||
                                                "-"}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {selectedMovement.branch
                                                ?.name ||
                                                "-"}
                                        </strong>

                                        <small>
                                            {
                                                selectedMovement.branch
                                                    ?.branchCode
                                            }
                                        </small>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Quantity Before
                                        </span>

                                        <strong>
                                            {formatNumber(
                                                selectedMovement.quantityBefore
                                            )}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Quantity Change
                                        </span>

                                        <strong
                                            className={
                                                Number(
                                                    selectedMovement.quantityChange
                                                ) >=
                                                0
                                                    ? "movement-positive"
                                                    : "movement-negative"
                                            }
                                        >
                                            {Number(
                                                selectedMovement.quantityChange
                                            ) >=
                                            0
                                                ? "+"
                                                : ""}
                                            {formatNumber(
                                                selectedMovement.quantityChange
                                            )}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Quantity After
                                        </span>

                                        <strong>
                                            {formatNumber(
                                                selectedMovement.quantityAfter
                                            )}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Total Value
                                        </span>

                                        <strong>
                                            {formatMoney(
                                                selectedMovement.totalValue
                                            )}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Reference Type
                                        </span>

                                        <strong>
                                            {formatLabel(
                                                selectedMovement.referenceType
                                            )}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Reference Number
                                        </span>

                                        <strong>
                                            {selectedMovement.referenceNumber ||
                                                "-"}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Unit Price
                                        </span>

                                        <strong>
                                            {formatMoney(
                                                selectedMovement.unitPrice
                                            )}
                                        </strong>

                                    </div>

                                    <div className="stock-movement-detail-card">

                                        <span>
                                            Created By
                                        </span>

                                        <strong>
                                            {selectedMovement.createdBy
                                                ?.name ||
                                                "-"}
                                        </strong>

                                        <small>
                                            {selectedMovement.createdBy
                                                ?.email ||
                                                ""}
                                        </small>

                                    </div>

                                </div>

                                <div className="stock-movement-text-card">

                                    <span>
                                        Reason
                                    </span>

                                    <p>
                                        {selectedMovement.reason ||
                                            "No reason provided"}
                                    </p>

                                </div>

                                <div className="stock-movement-text-card">

                                    <span>
                                        Notes
                                    </span>

                                    <p>
                                        {selectedMovement.notes ||
                                            "No notes provided"}
                                    </p>

                                </div>

                            </div>

                            <div className="stock-movements-modal-footer">

                                <button
                                    type="button"
                                    className="stock-movements-secondary-btn"
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
}

export default StockMovements;