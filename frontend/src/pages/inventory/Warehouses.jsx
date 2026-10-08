import { useEffect, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiCheckCircle,
    FiXCircle,
    FiHome,
    FiMapPin,
    FiUser,
    FiPackage,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/warehouses.css";

const initialForm = {
    company: "",
    branch: "",
    name: "",
    code: "",
    description: "",
    address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
    },
    manager: "",
    capacity: 0,
    isMainWarehouse: false,
    isActive: true,
};

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [managers, setManagers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    // ==========================================
    // Fetch Warehouses
    // ==========================================
    const fetchWarehouses = async (requestedPage = page) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: requestedPage,
                limit: 10,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (activeFilter !== "all") {
                params.isActive = activeFilter === "active";
            }

            const response = await api.get("/warehouses", {
                params,
            });

            setWarehouses(response.data.warehouses || []);
            setTotal(response.data.total || 0);
            setPage(response.data.page || 1);
            setPages(response.data.pages || 1);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load warehouses"
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // Fetch Companies
    // ==========================================
    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies", {
                params: {
                    page: 1,
                    limit: 100,
                },
            });

            setCompanies(
                response.data.companies ||
                    response.data.data ||
                    []
            );
        } catch (err) {
            console.error("Failed to load companies", err);
        }
    };

    // ==========================================
    // Fetch Branches
    // ==========================================
    const fetchBranches = async (companyId) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response = await api.get("/branches", {
                params: {
                    company: companyId,
                    page: 1,
                    limit: 100,
                },
            });

            setBranches(response.data.branches || []);
        } catch (err) {
            console.error("Failed to load branches", err);
            setBranches([]);
        }
    };

    // ==========================================
    // Fetch Managers
    // ==========================================
    const fetchManagers = async (companyId) => {
        if (!companyId) {
            setManagers([]);
            return;
        }

        try {
            const response = await api.get("/users", {
                params: {
                    company: companyId,
                    page: 1,
                    limit: 100,
                },
            });

            setManagers(
                response.data.users ||
                    response.data.data ||
                    []
            );
        } catch (err) {
            console.error("Failed to load managers", err);
            setManagers([]);
        }
    };

    // ==========================================
    // Initial Load
    // ==========================================
    useEffect(() => {
        fetchCompanies();
        fetchWarehouses(1);
    }, []);

    // ==========================================
    // Search / Filter
    // ==========================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchWarehouses(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search, activeFilter]);

    // ==========================================
    // Input Change
    // ==========================================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // ==========================================
    // Address Change
    // ==========================================
    const handleAddressChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value,
            },
        }));
    };

    // ==========================================
    // Company Change
    // ==========================================
    const handleCompanyChange = async (e) => {
        const companyId = e.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            manager: "",
        }));

        setBranches([]);
        setManagers([]);

        if (companyId) {
            await Promise.all([
                fetchBranches(companyId),
                fetchManagers(companyId),
            ]);
        }
    };

    // ==========================================
    // Open Add Modal
    // ==========================================
    const openAddModal = () => {
        setEditingWarehouse(null);
        setFormData(initialForm);
        setBranches([]);
        setManagers([]);
        setError("");
        setShowModal(true);
    };

    // ==========================================
    // Open Edit Modal
    // ==========================================
    const openEditModal = async (warehouse) => {
        setEditingWarehouse(warehouse);

        const companyId =
            warehouse.company?._id ||
            warehouse.company ||
            "";

        setFormData({
            company: companyId,
            branch:
                warehouse.branch?._id ||
                warehouse.branch ||
                "",
            name: warehouse.name || "",
            code: warehouse.code || "",
            description: warehouse.description || "",
            address: {
                street:
                    warehouse.address?.street || "",
                city:
                    warehouse.address?.city || "",
                state:
                    warehouse.address?.state || "",
                postalCode:
                    warehouse.address?.postalCode || "",
                country:
                    warehouse.address?.country ||
                    "India",
            },
            manager:
                warehouse.manager?._id ||
                warehouse.manager ||
                "",
            capacity: warehouse.capacity ?? 0,
            isMainWarehouse:
                warehouse.isMainWarehouse || false,
            isActive:
                warehouse.isActive !== false,
        });

        setError("");

        if (companyId) {
            await Promise.all([
                fetchBranches(companyId),
                fetchManagers(companyId),
            ]);
        }

        setShowModal(true);
    };

    // ==========================================
    // Submit
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setFormLoading(true);
            setError("");
            setSuccess("");

            const payload = {
                company: formData.company,
                branch: formData.branch,
                name: formData.name.trim(),
                code: formData.code.trim().toUpperCase(),
                description:
                    formData.description.trim(),

                address: {
                    street:
                        formData.address.street.trim(),
                    city:
                        formData.address.city.trim(),
                    state:
                        formData.address.state.trim(),
                    postalCode:
                        formData.address.postalCode.trim(),
                    country:
                        formData.address.country.trim() ||
                        "India",
                },

                manager:
                    formData.manager || null,

                capacity:
                    Number(formData.capacity) || 0,

                isMainWarehouse:
                    formData.isMainWarehouse,

                isActive:
                    formData.isActive,
            };

            if (editingWarehouse) {
                await api.put(
                    `/warehouses/${editingWarehouse._id}`,
                    payload
                );

                setSuccess(
                    "Warehouse updated successfully"
                );
            } else {
                await api.post(
                    "/warehouses",
                    payload
                );

                setSuccess(
                    "Warehouse created successfully"
                );
            }

            setShowModal(false);
            setEditingWarehouse(null);
            setFormData(initialForm);

            await fetchWarehouses(page);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to save warehouse"
            );
        } finally {
            setFormLoading(false);
        }
    };

    // ==========================================
    // View Warehouse
    // ==========================================
    const handleView = async (warehouse) => {
        try {
            setError("");

            const response = await api.get(
                `/warehouses/${warehouse._id}`
            );

            setSelectedWarehouse(
                response.data.warehouse
            );

            setShowViewModal(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load warehouse"
            );
        }
    };

    // ==========================================
    // Delete
    // ==========================================
    const confirmDelete = (warehouse) => {
        setDeleteTarget(warehouse);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setLoading(true);
            setError("");

            await api.delete(
                `/warehouses/${deleteTarget._id}`
            );

            setSuccess(
                "Warehouse deleted successfully"
            );

            setShowDeleteModal(false);
            setDeleteTarget(null);

            const nextPage =
                warehouses.length === 1 &&
                page > 1
                    ? page - 1
                    : page;

            await fetchWarehouses(nextPage);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to delete warehouse"
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // Pagination
    // ==========================================
    const goToPage = (newPage) => {
        if (
            newPage < 1 ||
            newPage > pages ||
            newPage === page
        ) {
            return;
        }

        fetchWarehouses(newPage);
    };

    // ==========================================
    // Alerts Auto Clear
    // ==========================================
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3500);

        return () => clearTimeout(timer);
    }, [success]);

    return (
        <div className="warehouses-page">

            {/* Header */}
            <div className="warehouses-header">
                <div>
                    <h1>Warehouse Management</h1>
                    <p>
                        Manage company warehouses,
                        branches and storage locations
                    </p>
                </div>

                <button
                    className="warehouse-primary-btn"
                    onClick={openAddModal}
                >
                    <FiPlus />
                    Add Warehouse
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="warehouse-alert warehouse-alert-error">
                    <FiXCircle />
                    <span>{error}</span>

                    <button
                        onClick={() => setError("")}
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div className="warehouse-alert warehouse-alert-success">
                    <FiCheckCircle />
                    <span>{success}</span>

                    <button
                        onClick={() => setSuccess("")}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Summary */}
            <div className="warehouse-summary-grid">

                <div className="warehouse-summary-card">
                    <div className="warehouse-summary-icon">
                        <FiHome />
                    </div>

                    <div>
                        <span>Total Warehouses</span>
                        <strong>{total}</strong>
                    </div>
                </div>

                <div className="warehouse-summary-card">
                    <div className="warehouse-summary-icon">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>Active</span>
                        <strong>
                            {
                                warehouses.filter(
                                    (item) =>
                                        item.isActive
                                ).length
                            }
                        </strong>
                    </div>
                </div>

                <div className="warehouse-summary-card">
                    <div className="warehouse-summary-icon">
                        <FiPackage />
                    </div>

                    <div>
                        <span>Main Warehouses</span>
                        <strong>
                            {
                                warehouses.filter(
                                    (item) =>
                                        item.isMainWarehouse
                                ).length
                            }
                        </strong>
                    </div>
                </div>

                <div className="warehouse-summary-card">
                    <div className="warehouse-summary-icon">
                        <FiMapPin />
                    </div>

                    <div>
                        <span>Current Page</span>
                        <strong>
                            {page} / {pages}
                        </strong>
                    </div>
                </div>

            </div>

            {/* Filters */}
            <div className="warehouse-filter-card">

                <div className="warehouse-search-box">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search warehouse, code, city..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>

                <div className="warehouse-filter-buttons">

                    <button
                        className={
                            activeFilter === "all"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveFilter("all")
                        }
                    >
                        All
                    </button>

                    <button
                        className={
                            activeFilter === "active"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveFilter("active")
                        }
                    >
                        Active
                    </button>

                    <button
                        className={
                            activeFilter === "inactive"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveFilter("inactive")
                        }
                    >
                        Inactive
                    </button>

                    <button
                        className="warehouse-refresh-btn"
                        onClick={() =>
                            fetchWarehouses(page)
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "warehouse-spin"
                                    : ""
                            }
                        />
                    </button>

                </div>

            </div>

            {/* Table */}
            <div className="warehouse-table-card">

                <div className="warehouse-table-header">
                    <div>
                        <h2>Warehouses</h2>
                        <span>
                            {total} warehouse
                            {total !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="warehouse-loading">
                        <FiRefreshCw className="warehouse-spin" />
                        <p>Loading warehouses...</p>
                    </div>
                ) : warehouses.length === 0 ? (
                    <div className="warehouse-empty">
                        <FiHome />
                        <h3>No Warehouses Found</h3>
                        <p>
                            Create your first warehouse
                            to get started.
                        </p>

                        <button
                            className="warehouse-primary-btn"
                            onClick={openAddModal}
                        >
                            <FiPlus />
                            Add Warehouse
                        </button>
                    </div>
                ) : (
                    <div className="warehouse-table-wrapper">
                        <table className="warehouse-table">
                            <thead>
                                <tr>
                                    <th>Warehouse</th>
                                    <th>Code</th>
                                    <th>Company</th>
                                    <th>Branch</th>
                                    <th>Manager</th>
                                    <th>Capacity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {warehouses.map(
                                    (warehouse) => (
                                        <tr
                                            key={
                                                warehouse._id
                                            }
                                        >
                                            <td>
                                                <div className="warehouse-name-cell">
                                                    <div className="warehouse-avatar">
                                                        <FiHome />
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                warehouse.name
                                                            }
                                                        </strong>

                                                        {warehouse.isMainWarehouse && (
                                                            <span className="warehouse-main-badge">
                                                                Main
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="warehouse-code">
                                                    {
                                                        warehouse.code
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    warehouse
                                                        .company
                                                        ?.name
                                                }
                                            </td>

                                            <td>
                                                <div className="warehouse-branch-cell">
                                                    <strong>
                                                        {
                                                            warehouse
                                                                .branch
                                                                ?.name
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            warehouse
                                                                .branch
                                                                ?.branchCode
                                                        }
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                {warehouse
                                                    .manager
                                                    ?.name ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {Number(
                                                    warehouse.capacity
                                                ).toLocaleString()}
                                            </td>

                                            <td>
                                                <span
                                                    className={`warehouse-status ${
                                                        warehouse.isActive
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    {warehouse.isActive ? (
                                                        <>
                                                            <FiCheckCircle />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiXCircle />
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="warehouse-actions">

                                                    <button
                                                        className="view"
                                                        onClick={() =>
                                                            handleView(
                                                                warehouse
                                                            )
                                                        }
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    <button
                                                        className="edit"
                                                        onClick={() =>
                                                            openEditModal(
                                                                warehouse
                                                            )
                                                        }
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>

                                                    <button
                                                        className="delete"
                                                        onClick={() =>
                                                            confirmDelete(
                                                                warehouse
                                                            )
                                                        }
                                                        title="Delete"
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

                {/* Pagination */}
                {pages > 1 && (
                    <div className="warehouse-pagination">

                        <button
                            disabled={page === 1}
                            onClick={() =>
                                goToPage(page - 1)
                            }
                        >
                            Previous
                        </button>

                        <div>
                            {Array.from(
                                {
                                    length: pages,
                                },
                                (_, index) => index + 1
                            ).map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    className={
                                        page ===
                                        pageNumber
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        goToPage(
                                            pageNumber
                                        )
                                    }
                                >
                                    {pageNumber}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={page === pages}
                            onClick={() =>
                                goToPage(page + 1)
                            }
                        >
                            Next
                        </button>

                    </div>
                )}

            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="warehouse-modal-overlay">
                    <div className="warehouse-modal warehouse-large-modal">

                        <div className="warehouse-modal-header">
                            <div>
                                <h2>
                                    {editingWarehouse
                                        ? "Edit Warehouse"
                                        : "Add Warehouse"}
                                </h2>

                                <p>
                                    {editingWarehouse
                                        ? "Update warehouse information"
                                        : "Create a new warehouse"}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="warehouse-close-btn"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="warehouse-form"
                        >

                            {/* Basic Information */}
                            <div className="warehouse-form-section">
                                <h3>Basic Information</h3>

                                <div className="warehouse-form-grid">

                                    <div className="warehouse-form-group">
                                        <label>
                                            Company *
                                        </label>

                                        <select
                                            value={
                                                formData.company
                                            }
                                            onChange={
                                                handleCompanyChange
                                            }
                                            disabled={
                                                !!editingWarehouse
                                            }
                                            required
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
                                                        {
                                                            company.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            Branch *
                                        </label>

                                        <select
                                            name="branch"
                                            value={
                                                formData.branch
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Branch
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
                                                        {
                                                            branch.name
                                                        }{" "}
                                                        (
                                                        {
                                                            branch.branchCode
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            Warehouse Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={
                                                formData.name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Main Warehouse"
                                            required
                                        />
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            Warehouse Code *
                                        </label>

                                        <input
                                            type="text"
                                            name="code"
                                            value={
                                                formData.code
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="WH-MAIN-001"
                                            required
                                        />
                                    </div>

                                </div>

                                <div className="warehouse-form-group">
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
                                        placeholder="Warehouse description..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="warehouse-form-section">
                                <h3>Address</h3>

                                <div className="warehouse-form-grid">

                                    <div className="warehouse-form-group warehouse-full">
                                        <label>
                                            Street
                                        </label>

                                        <input
                                            type="text"
                                            name="street"
                                            value={
                                                formData
                                                    .address
                                                    .street
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                            placeholder="Street address"
                                        />
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            City
                                        </label>

                                        <input
                                            type="text"
                                            name="city"
                                            value={
                                                formData
                                                    .address
                                                    .city
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                            placeholder="Coimbatore"
                                        />
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            State
                                        </label>

                                        <input
                                            type="text"
                                            name="state"
                                            value={
                                                formData
                                                    .address
                                                    .state
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                            placeholder="Tamil Nadu"
                                        />
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            Postal Code
                                        </label>

                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={
                                                formData
                                                    .address
                                                    .postalCode
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                            placeholder="641001"
                                        />
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            Country
                                        </label>

                                        <input
                                            type="text"
                                            name="country"
                                            value={
                                                formData
                                                    .address
                                                    .country
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                            placeholder="India"
                                        />
                                    </div>

                                </div>
                            </div>

                            {/* Management */}
                            <div className="warehouse-form-section">
                                <h3>Warehouse Management</h3>

                                <div className="warehouse-form-grid">

                                    <div className="warehouse-form-group">
                                        <label>
                                            Manager
                                        </label>

                                        <select
                                            name="manager"
                                            value={
                                                formData.manager
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >
                                            <option value="">
                                                No Manager
                                            </option>

                                            {managers.map(
                                                (manager) => (
                                                    <option
                                                        key={
                                                            manager._id
                                                        }
                                                        value={
                                                            manager._id
                                                        }
                                                    >
                                                        {
                                                            manager.name
                                                        }
                                                        {manager.employeeId
                                                            ? ` (${manager.employeeId})`
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="warehouse-form-group">
                                        <label>
                                            Capacity
                                        </label>

                                        <input
                                            type="number"
                                            name="capacity"
                                            min="0"
                                            value={
                                                formData.capacity
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="0"
                                        />
                                    </div>

                                </div>

                                <div className="warehouse-checkbox-row">

                                    <label className="warehouse-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isMainWarehouse"
                                            checked={
                                                formData.isMainWarehouse
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <span>
                                            Main Warehouse
                                        </span>
                                    </label>

                                    <label className="warehouse-checkbox">
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
                                            Active
                                        </span>
                                    </label>

                                </div>
                            </div>

                            {/* Footer */}
                            <div className="warehouse-modal-footer">

                                <button
                                    type="button"
                                    className="warehouse-secondary-btn"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="warehouse-primary-btn"
                                    disabled={formLoading}
                                >
                                    {formLoading ? (
                                        <>
                                            <FiRefreshCw className="warehouse-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle />
                                            {editingWarehouse
                                                ? "Update Warehouse"
                                                : "Create Warehouse"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal &&
                selectedWarehouse && (
                    <div className="warehouse-modal-overlay">
                        <div className="warehouse-modal">

                            <div className="warehouse-modal-header">
                                <div>
                                    <h2>
                                        Warehouse Details
                                    </h2>

                                    <p>
                                        Complete warehouse
                                        information
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setShowViewModal(false)
                                    }
                                    className="warehouse-close-btn"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="warehouse-view-content">

                                <div className="warehouse-view-title">
                                    <div className="warehouse-view-icon">
                                        <FiHome />
                                    </div>

                                    <div>
                                        <h3>
                                            {
                                                selectedWarehouse.name
                                            }
                                        </h3>

                                        <span>
                                            {
                                                selectedWarehouse.code
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="warehouse-detail-grid">

                                    <div className="warehouse-detail-item">
                                        <span>
                                            Company
                                        </span>
                                        <strong>
                                            {
                                                selectedWarehouse
                                                    .company
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="warehouse-detail-item">
                                        <span>
                                            Branch
                                        </span>
                                        <strong>
                                            {
                                                selectedWarehouse
                                                    .branch
                                                    ?.name
                                            }
                                        </strong>

                                        <small>
                                            {
                                                selectedWarehouse
                                                    .branch
                                                    ?.branchCode
                                            }
                                        </small>
                                    </div>

                                    <div className="warehouse-detail-item">
                                        <span>
                                            Manager
                                        </span>

                                        <strong>
                                            {
                                                selectedWarehouse
                                                    .manager
                                                    ?.name ||
                                                    "No Manager"
                                            }
                                        </strong>
                                    </div>

                                    <div className="warehouse-detail-item">
                                        <span>
                                            Capacity
                                        </span>

                                        <strong>
                                            {Number(
                                                selectedWarehouse.capacity
                                            ).toLocaleString()}
                                        </strong>
                                    </div>

                                    <div className="warehouse-detail-item warehouse-detail-full">
                                        <span>
                                            Description
                                        </span>

                                        <strong>
                                            {
                                                selectedWarehouse.description ||
                                                    "No description"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="warehouse-address-box">
                                    <h3>
                                        <FiMapPin />
                                        Address
                                    </h3>

                                    <p>
                                        {
                                            selectedWarehouse
                                                .address
                                                ?.street
                                        }
                                    </p>

                                    <p>
                                        {
                                            selectedWarehouse
                                                .address
                                                ?.city
                                        }
                                        {selectedWarehouse
                                            .address
                                            ?.state &&
                                            `, ${selectedWarehouse.address.state}`}
                                    </p>

                                    <p>
                                        {
                                            selectedWarehouse
                                                .address
                                                ?.postalCode
                                        }
                                        {selectedWarehouse
                                            .address
                                            ?.country &&
                                            `, ${selectedWarehouse.address.country}`}
                                    </p>
                                </div>

                                <div className="warehouse-view-status-row">

                                    <span
                                        className={`warehouse-status ${
                                            selectedWarehouse.isActive
                                                ? "active"
                                                : "inactive"
                                        }`}
                                    >
                                        {selectedWarehouse.isActive ? (
                                            <>
                                                <FiCheckCircle />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <FiXCircle />
                                                Inactive
                                            </>
                                        )}
                                    </span>

                                    {selectedWarehouse.isMainWarehouse && (
                                        <span className="warehouse-main-badge large">
                                            Main Warehouse
                                        </span>
                                    )}

                                </div>

                            </div>

                        </div>
                    </div>
                )}

            {/* Delete Modal */}
            {showDeleteModal &&
                deleteTarget && (
                    <div className="warehouse-modal-overlay">
                        <div className="warehouse-modal warehouse-delete-modal">

                            <div className="warehouse-delete-icon">
                                <FiTrash2 />
                            </div>

                            <h2>
                                Delete Warehouse?
                            </h2>

                            <p>
                                Are you sure you want to
                                delete{" "}
                                <strong>
                                    {deleteTarget.name}
                                </strong>
                                ?
                            </p>

                            <p className="warehouse-delete-warning">
                                This action cannot be undone.
                            </p>

                            <div className="warehouse-modal-footer">

                                <button
                                    className="warehouse-secondary-btn"
                                    onClick={() =>
                                        setShowDeleteModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="warehouse-delete-confirm-btn"
                                    onClick={handleDelete}
                                >
                                    <FiTrash2 />
                                    Delete Warehouse
                                </button>

                            </div>

                        </div>
                    </div>
                )}

        </div>
    );
};

export default Warehouses;