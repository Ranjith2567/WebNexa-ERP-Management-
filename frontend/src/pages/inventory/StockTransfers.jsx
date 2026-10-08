import { useEffect, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEye,
    FiTrash2,
    FiRefreshCw,
    FiTruck,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiArrowRight,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/stockTransfers.css";

function StockTransfers() {
    // ===============================
    // Main State
    // ===============================

    const [transfers, setTransfers] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ===============================
    // Pagination
    // ===============================

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    const limit = 10;

    // ===============================
    // Search
    // ===============================

    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // ===============================
    // Filters
    // ===============================

    const [filterCompany, setFilterCompany] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [filterFromWarehouse, setFilterFromWarehouse] =
        useState("");
    const [filterToWarehouse, setFilterToWarehouse] =
        useState("");
    const [filterProduct, setFilterProduct] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // ===============================
    // Modal
    // ===============================

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedTransfer, setSelectedTransfer] =
        useState(null);

    // ===============================
    // Create Form
    // ===============================

    const [formData, setFormData] = useState({
        company: "",
        branch: "",
        fromWarehouse: "",
        toWarehouse: "",
        product: "",
        quantity: "",
        reason: "",
        notes: "",
        transferDate: "",
    });

    // ===============================
    // Status Options
    // ===============================

    const statusOptions = [
        "PENDING",
        "APPROVED",
        "IN_TRANSIT",
        "COMPLETED",
        "CANCELLED",
    ];

    // ===============================
    // Initial Load
    // ===============================

    useEffect(() => {
        loadCompanies();
        loadTransfers(1);
    }, []);

    // ===============================
    // Load Companies
    // ===============================

    const loadCompanies = async () => {
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
                "Load Companies Error:",
                err
            );
        }
    };

    // ===============================
    // Load Branches
    // ===============================

    const loadBranches = async (companyId) => {
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
                "Load Branches Error:",
                err
            );

            setBranches([]);
        }
    };

    // ===============================
    // Load Warehouses
    // ===============================

    const loadWarehouses = async (
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
                "Load Warehouses Error:",
                err
            );

            setWarehouses([]);
        }
    };

    // ===============================
    // Load Products
    // ===============================

    const loadProducts = async (
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
                "Load Products Error:",
                err
            );

            setProducts([]);
        }
    };

    // ===============================
    // Load Transfers
    // ===============================

    const loadTransfers = async (
        targetPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

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

            if (filterFromWarehouse) {
                params.append(
                    "fromWarehouse",
                    filterFromWarehouse
                );
            }

            if (filterToWarehouse) {
                params.append(
                    "toWarehouse",
                    filterToWarehouse
                );
            }

            if (filterProduct) {
                params.append(
                    "product",
                    filterProduct
                );
            }

            if (filterStatus) {
                params.append(
                    "status",
                    filterStatus
                );
            }

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            params.append(
                "page",
                targetPage
            );

            params.append(
                "limit",
                limit
            );

            const response = await api.get(
                `/stock-transfers?${params.toString()}`
            );

            setTransfers(
                response.data.data || []
            );

            setPagination(
                response.data.pagination || {
                    page: targetPage,
                    limit,
                    total: 0,
                    pages: 1,
                }
            );

            setPage(targetPage);
        } catch (err) {
            console.error(
                "Load Stock Transfers Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to load stock transfers"
            );
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // Form Input
    // ===============================

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ===============================
    // Company Change
    // ===============================

    const handleFormCompanyChange = async (
        e
    ) => {
        const companyId = e.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            fromWarehouse: "",
            toWarehouse: "",
            product: "",
        }));

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        if (companyId) {
            await loadBranches(companyId);
        }
    };

    // ===============================
    // Branch Change
    // ===============================

    const handleFormBranchChange = async (
        e
    ) => {
        const branchId = e.target.value;

        setFormData((prev) => ({
            ...prev,
            branch: branchId,
            fromWarehouse: "",
            toWarehouse: "",
            product: "",
        }));

        setWarehouses([]);
        setProducts([]);

        if (
            formData.company &&
            branchId
        ) {
            await Promise.all([
                loadWarehouses(
                    formData.company,
                    branchId
                ),
                loadProducts(
                    formData.company,
                    branchId
                ),
            ]);
        }
    };

    // ===============================
    // Open Create Modal
    // ===============================

    const openCreateModal = () => {
        setError("");
        setSuccess("");

        setFormData({
            company: "",
            branch: "",
            fromWarehouse: "",
            toWarehouse: "",
            product: "",
            quantity: "",
            reason: "",
            notes: "",
            transferDate: "",
        });

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        setShowModal(true);
    };

    // ===============================
    // Close Modal
    // ===============================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
    };

    // ===============================
    // Create Transfer
    // ===============================

    const handleCreateTransfer = async (
        e
    ) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // Same warehouse validation
        if (
            formData.fromWarehouse ===
            formData.toWarehouse
        ) {
            setError(
                "Source and destination warehouse cannot be the same"
            );

            return;
        }

        if (
            !formData.company ||
            !formData.branch ||
            !formData.fromWarehouse ||
            !formData.toWarehouse ||
            !formData.product ||
            !formData.quantity
        ) {
            setError(
                "Please fill all required fields"
            );

            return;
        }

        if (
            Number(formData.quantity) <= 0
        ) {
            setError(
                "Transfer quantity must be greater than 0"
            );

            return;
        }

        try {
            setSaving(true);

            const payload = {
                company: formData.company,
                branch: formData.branch,
                fromWarehouse:
                    formData.fromWarehouse,
                toWarehouse:
                    formData.toWarehouse,
                product: formData.product,
                quantity: Number(
                    formData.quantity
                ),
                reason:
                    formData.reason.trim(),
                notes:
                    formData.notes.trim(),
            };

            if (formData.transferDate) {
                payload.transferDate =
                    formData.transferDate;
            }

            const response = await api.post(
                "/stock-transfers",
                payload
            );

            setSuccess(
                response.data.message ||
                    "Stock transfer created successfully"
            );

            setShowModal(false);

            await loadTransfers(1);
        } catch (err) {
            console.error(
                "Create Stock Transfer Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to create stock transfer"
            );
        } finally {
            setSaving(false);
        }
    };

    // ===============================
    // View Transfer
    // ===============================

    const handleView = async (id) => {
        try {
            setError("");

            const response = await api.get(
                `/stock-transfers/${id}`
            );

            setSelectedTransfer(
                response.data.data
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View Stock Transfer Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to load stock transfer"
            );
        }
    };

    // ===============================
    // Update Status
    // ===============================

    const handleStatusChange = async (
        id,
        status
    ) => {
        if (!status) return;

        try {
            setError("");
            setSuccess("");

            const response = await api.put(
                `/stock-transfers/${id}/status`,
                {
                    status,
                }
            );

            setSuccess(
                response.data.message ||
                    "Stock transfer status updated successfully"
            );

            await loadTransfers(page);

            if (
                selectedTransfer?._id === id
            ) {
                setSelectedTransfer(
                    response.data.data
                );
            }
        } catch (err) {
            console.error(
                "Update Transfer Status Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to update transfer status"
            );
        }
    };

    // ===============================
    // Delete Transfer
    // ===============================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this stock transfer?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            const response =
                await api.delete(
                    `/stock-transfers/${id}`
                );

            setSuccess(
                response.data.message ||
                    "Stock transfer deleted successfully"
            );

            const nextPage =
                transfers.length === 1 &&
                page > 1
                    ? page - 1
                    : page;

            await loadTransfers(nextPage);
        } catch (err) {
            console.error(
                "Delete Stock Transfer Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to delete stock transfer"
            );
        }
    };

    // ===============================
    // Search
    // ===============================

    const handleSearch = (e) => {
        e.preventDefault();

        setSearch(searchInput.trim());

        setTimeout(() => {
            loadTransfers(1);
        }, 0);
    };

    // ===============================
    // Reset Filters
    // ===============================

    const resetFilters = () => {
        setSearchInput("");
        setSearch("");

        setFilterCompany("");
        setFilterBranch("");
        setFilterFromWarehouse("");
        setFilterToWarehouse("");
        setFilterProduct("");
        setFilterStatus("");

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        loadTransfers(1);
    };

    // ===============================
    // Filter Company
    // ===============================

    const handleFilterCompanyChange = async (
        e
    ) => {
        const companyId = e.target.value;

        setFilterCompany(companyId);
        setFilterBranch("");
        setFilterFromWarehouse("");
        setFilterToWarehouse("");
        setFilterProduct("");

        setBranches([]);
        setWarehouses([]);
        setProducts([]);

        if (companyId) {
            await loadBranches(companyId);
        }

        setPage(1);
    };

    // ===============================
    // Filter Branch
    // ===============================

    const handleFilterBranchChange = async (
        e
    ) => {
        const branchId = e.target.value;

        setFilterBranch(branchId);
        setFilterFromWarehouse("");
        setFilterToWarehouse("");
        setFilterProduct("");

        setWarehouses([]);
        setProducts([]);

        if (
            filterCompany &&
            branchId
        ) {
            await Promise.all([
                loadWarehouses(
                    filterCompany,
                    branchId
                ),
                loadProducts(
                    filterCompany,
                    branchId
                ),
            ]);
        }

        setPage(1);
    };

    // ===============================
    // Filter Changes
    // ===============================

    useEffect(() => {
        if (page === 1) return;

        loadTransfers(page);
    }, [
        filterCompany,
        filterBranch,
        filterFromWarehouse,
        filterToWarehouse,
        filterProduct,
        filterStatus,
    ]);

    // ===============================
    // Status Badge
    // ===============================

    const getStatusClass = (status) => {
        switch (status) {
            case "PENDING":
                return "pending";

            case "APPROVED":
                return "approved";

            case "IN_TRANSIT":
                return "in-transit";

            case "COMPLETED":
                return "completed";

            case "CANCELLED":
                return "cancelled";

            default:
                return "";
        }
    };

    // ===============================
    // Allowed Next Statuses
    // ===============================

    const getNextStatuses = (status) => {
        switch (status) {
            case "PENDING":
                return [
                    "APPROVED",
                    "CANCELLED",
                ];

            case "APPROVED":
                return [
                    "IN_TRANSIT",
                    "CANCELLED",
                ];

            case "IN_TRANSIT":
                return ["COMPLETED"];

            default:
                return [];
        }
    };

    // ===============================
    // Date Format
    // ===============================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // ===============================
    // Summary
    // ===============================

    const pendingCount =
        transfers.filter(
            (item) =>
                item.status === "PENDING"
        ).length;

    const completedCount =
        transfers.filter(
            (item) =>
                item.status === "COMPLETED"
        ).length;

    const inTransitCount =
        transfers.filter(
            (item) =>
                item.status === "IN_TRANSIT"
        ).length;

    const cancelledCount =
        transfers.filter(
            (item) =>
                item.status === "CANCELLED"
        ).length;

    return (
        <div className="stock-transfers-page">

            {/* ===============================
                HEADER
            =============================== */}

            <div className="stock-transfers-header">

                <div>
                    <div className="stock-transfers-title-row">
                        <div className="stock-transfers-title-icon">
                            <FiTruck />
                        </div>

                        <div>
                            <h1>
                                Stock Transfers
                            </h1>

                            <p>
                                Manage inventory transfers between warehouses
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="stock-transfers-primary-btn"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus />
                    Create Transfer
                </button>

            </div>


            {/* ===============================
                ALERTS
            =============================== */}

            {error && (
                <div className="stock-transfers-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="stock-transfers-alert success">
                    {success}
                </div>
            )}


            {/* ===============================
                SUMMARY
            =============================== */}

            <div className="stock-transfers-summary">

                <div className="stock-transfer-summary-card">
                    <div className="summary-icon total">
                        <FiTruck />
                    </div>

                    <div>
                        <span>Total Transfers</span>
                        <strong>
                            {pagination.total}
                        </strong>
                    </div>
                </div>

                <div className="stock-transfer-summary-card">
                    <div className="summary-icon pending">
                        <FiClock />
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            {pendingCount}
                        </strong>
                    </div>
                </div>

                <div className="stock-transfer-summary-card">
                    <div className="summary-icon transit">
                        <FiRefreshCw />
                    </div>

                    <div>
                        <span>In Transit</span>
                        <strong>
                            {inTransitCount}
                        </strong>
                    </div>
                </div>

                <div className="stock-transfer-summary-card">
                    <div className="summary-icon completed">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>
                            {completedCount}
                        </strong>
                    </div>
                </div>

                <div className="stock-transfer-summary-card">
                    <div className="summary-icon cancelled">
                        <FiXCircle />
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <strong>
                            {cancelledCount}
                        </strong>
                    </div>
                </div>

            </div>


            {/* ===============================
                FILTERS
            =============================== */}

            <div className="stock-transfers-filter-card">

                <form
                    className="stock-transfer-search"
                    onSubmit={
                        handleSearch
                    }
                >

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search transfer number, product, warehouse..."
                        value={searchInput}
                        onChange={(e) =>
                            setSearchInput(
                                e.target.value
                            )
                        }
                    />

                    <button type="submit">
                        Search
                    </button>

                </form>


                <div className="stock-transfer-filter-grid">

                    <select
                        value={filterCompany}
                        onChange={
                            handleFilterCompanyChange
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
                        onChange={
                            handleFilterBranchChange
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
                        value={
                            filterFromWarehouse
                        }
                        onChange={(e) => {
                            setFilterFromWarehouse(
                                e.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !filterBranch
                        }
                    >
                        <option value="">
                            All Source Warehouses
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
                        value={
                            filterToWarehouse
                        }
                        onChange={(e) => {
                            setFilterToWarehouse(
                                e.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !filterBranch
                        }
                    >
                        <option value="">
                            All Destination Warehouses
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
                        onChange={(e) => {
                            setFilterProduct(
                                e.target.value
                            );
                            setPage(1);
                        }}
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
                                </option>
                            )
                        )}
                    </select>


                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Status
                        </option>

                        {statusOptions.map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status.replace(
                                        "_",
                                        " "
                                    )}
                                </option>
                            )
                        )}
                    </select>

                    <button
                        type="button"
                        className="stock-transfer-reset-btn"
                        onClick={
                            resetFilters
                        }
                    >
                        <FiRefreshCw />
                        Reset
                    </button>

                </div>

            </div>


            {/* ===============================
                TABLE
            =============================== */}

            <div className="stock-transfers-table-card">

                <div className="stock-transfers-table-header">

                    <div>
                        <h2>
                            Transfer Records
                        </h2>

                        <span>
                            {pagination.total} records
                        </span>
                    </div>

                    <button
                        type="button"
                        className="stock-transfer-refresh-btn"
                        onClick={() =>
                            loadTransfers(page)
                        }
                    >
                        <FiRefreshCw />
                    </button>

                </div>


                {loading ? (
                    <div className="stock-transfer-loading">
                        <div className="stock-transfer-spinner"></div>
                        <p>
                            Loading stock transfers...
                        </p>
                    </div>
                ) : transfers.length === 0 ? (
                    <div className="stock-transfer-empty">
                        <FiTruck />

                        <h3>
                            No Stock Transfers Found
                        </h3>

                        <p>
                            Create a transfer to move stock between warehouses.
                        </p>

                        <button
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />
                            Create Transfer
                        </button>
                    </div>
                ) : (
                    <div className="stock-transfers-table-wrapper">

                        <table className="stock-transfers-table">

                            <thead>
                                <tr>
                                    <th>
                                        Transfer
                                    </th>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        From
                                    </th>

                                    <th>
                                        To
                                    </th>

                                    <th>
                                        Qty
                                    </th>

                                    <th>
                                        Date
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

                                {transfers.map(
                                    (transfer) => (
                                        <tr
                                            key={
                                                transfer._id
                                            }
                                        >

                                            <td>
                                                <span className="transfer-number">
                                                    {
                                                        transfer.transferNumber
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="transfer-product">
                                                    <strong>
                                                        {
                                                            transfer
                                                                .product
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    {transfer
                                                        .product
                                                        ?.sku && (
                                                        <small>
                                                            SKU:{" "}
                                                            {
                                                                transfer
                                                                    .product
                                                                    .sku
                                                            }
                                                        </small>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="warehouse-cell">
                                                    <span>
                                                        {
                                                            transfer
                                                                .fromWarehouse
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            transfer
                                                                .fromWarehouse
                                                                ?.code ||
                                                            ""
                                                        }
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="warehouse-cell">
                                                    <span>
                                                        {
                                                            transfer
                                                                .toWarehouse
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            transfer
                                                                .toWarehouse
                                                                ?.code ||
                                                            ""
                                                        }
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <strong className="transfer-quantity">
                                                    {
                                                        transfer.quantity
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="transfer-date">
                                                    {formatDate(
                                                        transfer.transferDate
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`transfer-status ${getStatusClass(
                                                        transfer.status
                                                    )}`}
                                                >
                                                    {
                                                        transfer.status
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <div className="transfer-actions">

                                                    <button
                                                        type="button"
                                                        className="view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                transfer._id
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>


                                                    {getNextStatuses(
                                                        transfer.status
                                                    ).length >
                                                        0 && (
                                                        <select
                                                            className="status-action-select"
                                                            value=""
                                                            onChange={(
                                                                e
                                                            ) => {
                                                                if (
                                                                    e
                                                                        .target
                                                                        .value
                                                                ) {
                                                                    handleStatusChange(
                                                                        transfer._id,
                                                                        e
                                                                            .target
                                                                            .value
                                                                    );

                                                                    e.target.value =
                                                                        "";
                                                                }
                                                            }}
                                                        >
                                                            <option value="">
                                                                Status
                                                            </option>

                                                            {getNextStatuses(
                                                                transfer.status
                                                            ).map(
                                                                (
                                                                    status
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {status.replace(
                                                                            "_",
                                                                            " "
                                                                        )}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    )}


                                                    {transfer.status !==
                                                        "COMPLETED" && (
                                                        <button
                                                            type="button"
                                                            className="delete"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    transfer._id
                                                                )
                                                            }
                                                        >
                                                            <FiTrash2 />
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


                {/* ===============================
                    PAGINATION
                =============================== */}

                {pagination.pages > 1 && (
                    <div className="stock-transfer-pagination">

                        <button
                            disabled={
                                page === 1
                            }
                            onClick={() =>
                                loadTransfers(
                                    page - 1
                                )
                            }
                        >
                            Previous
                        </button>

                        <span>
                            Page{" "}
                            <strong>
                                {page}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {
                                    pagination.pages
                                }
                            </strong>
                        </span>

                        <button
                            disabled={
                                page ===
                                pagination.pages
                            }
                            onClick={() =>
                                loadTransfers(
                                    page + 1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>
                )}

            </div>


            {/* =====================================================
                CREATE TRANSFER MODAL
            ===================================================== */}

            {showModal && (
                <div className="stock-transfer-modal-overlay">

                    <div className="stock-transfer-modal">

                        <div className="stock-transfer-modal-header">

                            <div>
                                <h2>
                                    Create Stock Transfer
                                </h2>

                                <p>
                                    Move stock from one warehouse to another
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleCreateTransfer
                            }
                        >

                            <div className="stock-transfer-form-grid">

                                {/* Company */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Company{" "}
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
                                            handleFormCompanyChange
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


                                {/* Branch */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Branch{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="branch"
                                        value={
                                            formData.branch
                                        }
                                        onChange={
                                            handleFormBranchChange
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


                                {/* From Warehouse */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Source Warehouse{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="fromWarehouse"
                                        value={
                                            formData.fromWarehouse
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        disabled={
                                            !formData.branch
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Source Warehouse
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


                                {/* To Warehouse */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Destination Warehouse{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="toWarehouse"
                                        value={
                                            formData.toWarehouse
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        disabled={
                                            !formData.branch
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Destination Warehouse
                                        </option>

                                        {warehouses
                                            .filter(
                                                (
                                                    warehouse
                                                ) =>
                                                    warehouse._id !==
                                                    formData.fromWarehouse
                                            )
                                            .map(
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


                                {/* Product */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Product{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="product"
                                        value={
                                            formData.product
                                        }
                                        onChange={
                                            handleInputChange
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
                                                    {product.sku
                                                        ? ` - ${product.sku}`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>


                                {/* Quantity */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Quantity{" "}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="number"
                                        name="quantity"
                                        value={
                                            formData.quantity
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        min="0.000001"
                                        step="any"
                                        placeholder="Enter quantity"
                                        required
                                    />

                                </div>


                                {/* Transfer Date */}

                                <div className="stock-transfer-form-group">

                                    <label>
                                        Transfer Date
                                    </label>

                                    <input
                                        type="date"
                                        name="transferDate"
                                        value={
                                            formData.transferDate
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                    />

                                </div>


                                {/* Reason */}

                                <div className="stock-transfer-form-group full">

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
                                            handleInputChange
                                        }
                                        maxLength="500"
                                        placeholder="Why is this stock being transferred?"
                                    />

                                </div>


                                {/* Notes */}

                                <div className="stock-transfer-form-group full">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        maxLength="1000"
                                        rows="4"
                                        placeholder="Additional notes..."
                                    />

                                </div>

                            </div>


                            {error && (
                                <div className="stock-transfer-form-error">
                                    {error}
                                </div>
                            )}


                            <div className="stock-transfer-modal-footer">

                                <button
                                    type="button"
                                    className="cancel-btn"
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
                                    className="submit-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Creating..."
                                        : "Create Transfer"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* =====================================================
                VIEW MODAL
            ===================================================== */}

            {showViewModal &&
                selectedTransfer && (
                    <div className="stock-transfer-modal-overlay">

                        <div className="stock-transfer-modal view-modal">

                            <div className="stock-transfer-modal-header">

                                <div>
                                    <h2>
                                        Transfer Details
                                    </h2>

                                    <p>
                                        {
                                            selectedTransfer.transferNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div className="transfer-view-content">

                                <div className="transfer-view-status-row">

                                    <span
                                        className={`transfer-status ${getStatusClass(
                                            selectedTransfer.status
                                        )}`}
                                    >
                                        {
                                            selectedTransfer.status
                                        }
                                    </span>

                                    <span>
                                        {formatDate(
                                            selectedTransfer.transferDate
                                        )}
                                    </span>

                                </div>


                                <div className="transfer-route-card">

                                    <div className="transfer-route-item">

                                        <span>
                                            FROM
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .fromWarehouse
                                                    ?.name
                                            }
                                        </strong>

                                        <small>
                                            {
                                                selectedTransfer
                                                    .fromWarehouse
                                                    ?.code
                                            }
                                        </small>

                                    </div>


                                    <div className="transfer-route-arrow">
                                        <FiArrowRight />
                                    </div>


                                    <div className="transfer-route-item">

                                        <span>
                                            TO
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .toWarehouse
                                                    ?.name
                                            }
                                        </strong>

                                        <small>
                                            {
                                                selectedTransfer
                                                    .toWarehouse
                                                    ?.code
                                            }
                                        </small>

                                    </div>

                                </div>


                                <div className="transfer-detail-grid">

                                    <div>
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .company
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .branch
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Product
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .product
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            SKU
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .product
                                                    ?.sku ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Quantity
                                        </span>

                                        <strong className="detail-quantity">
                                            {
                                                selectedTransfer.quantity
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Created By
                                        </span>

                                        <strong>
                                            {
                                                selectedTransfer
                                                    .createdBy
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>

                                        {selectedTransfer
                                            .createdBy
                                            ?.email && (
                                            <small>
                                                {
                                                    selectedTransfer
                                                        .createdBy
                                                        .email
                                                }
                                            </small>
                                        )}
                                    </div>

                                    {selectedTransfer
                                        .approvedBy && (
                                        <div>
                                            <span>
                                                Approved By
                                            </span>

                                            <strong>
                                                {
                                                    selectedTransfer
                                                        .approvedBy
                                                        ?.name ||
                                                    "-"
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    selectedTransfer
                                                        .approvedBy
                                                        ?.email ||
                                                    ""
                                                }
                                            </small>
                                        </div>
                                    )}

                                    {selectedTransfer
                                        .completedAt && (
                                        <div>
                                            <span>
                                                Completed At
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    selectedTransfer.completedAt
                                                )}
                                            </strong>
                                        </div>
                                    )}

                                </div>


                                {selectedTransfer.reason && (
                                    <div className="transfer-description">
                                        <span>
                                            Reason
                                        </span>

                                        <p>
                                            {
                                                selectedTransfer.reason
                                            }
                                        </p>
                                    </div>
                                )}


                                {selectedTransfer.notes && (
                                    <div className="transfer-description">
                                        <span>
                                            Notes
                                        </span>

                                        <p>
                                            {
                                                selectedTransfer.notes
                                            }
                                        </p>
                                    </div>
                                )}


                                {getNextStatuses(
                                    selectedTransfer.status
                                ).length >
                                    0 && (
                                    <div className="transfer-status-actions">

                                        <span>
                                            Update Status
                                        </span>

                                        <div>
                                            {getNextStatuses(
                                                selectedTransfer.status
                                            ).map(
                                                (
                                                    status
                                                ) => (
                                                    <button
                                                        key={
                                                            status
                                                        }
                                                        type="button"
                                                        className={`status-update-btn ${getStatusClass(
                                                            status
                                                        )}`}
                                                        onClick={async () => {
                                                            await handleStatusChange(
                                                                selectedTransfer._id,
                                                                status
                                                            );
                                                        }}
                                                    >
                                                        {status.replace(
                                                            "_",
                                                            " "
                                                        )}
                                                    </button>
                                                )
                                            )}
                                        </div>

                                    </div>
                                )}

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}

export default StockTransfers;