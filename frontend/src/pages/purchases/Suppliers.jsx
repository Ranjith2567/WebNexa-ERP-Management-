import React, { useEffect, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiPhone,
    FiMail,
    FiMapPin,
    FiCreditCard,
    FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "../../styles/suppliers.css";

const initialForm = {
    company: "",
    branch: "",
    supplierCode: "",
    name: "",
    companyName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    gstNumber: "",
    panNumber: "",
    paymentTerms: 0,
    creditLimit: 0,
    address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
    },
    bankDetails: {
        accountName: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
    },
    notes: "",
    isActive: true,
};

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [filterCompany, setFilterCompany] = useState("");
    const [filterBranch, setFilterBranch] = useState("");

    const [filterBranches, setFilterBranches] = useState([]);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSuppliers, setTotalSuppliers] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingSupplier, setEditingSupplier] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    // =====================================================
    // LOAD COMPANIES
    // =====================================================
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
            console.error("Load Companies Error:", err);
        }
    };

    // =====================================================
    // LOAD BRANCHES
    // =====================================================
    const loadBranches = async (companyId, forFilter = false) => {
        if (!companyId) {
            if (forFilter) {
                setFilterBranches([]);
            } else {
                setBranches([]);
            }
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            const branchData = response.data.branches || [];

            if (forFilter) {
                setFilterBranches(branchData);
            } else {
                setBranches(branchData);
            }
        } catch (err) {
            console.error("Load Branches Error:", err);

            if (forFilter) {
                setFilterBranches([]);
            } else {
                setBranches([]);
            }
        }
    };

    // =====================================================
    // LOAD SUPPLIERS
    // =====================================================
    const loadSuppliers = async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (filterCompany) {
                params.append("company", filterCompany);
            }

            if (filterBranch) {
                params.append("branch", filterBranch);
            }

            if (statusFilter !== "all") {
                params.append(
                    "isActive",
                    statusFilter === "active" ? "true" : "false"
                );
            }

            if (search.trim()) {
                params.append("search", search.trim());
            }

            params.append("page", page);
            params.append("limit", limit);

            const response = await api.get(
                `/suppliers?${params.toString()}`
            );

            if (response.data.success) {
                setSuppliers(response.data.data || []);
                setTotalSuppliers(response.data.total || 0);
                setTotalPages(
                    response.data.pagination?.totalPages || 1
                );
            }
        } catch (err) {
            console.error("Load Suppliers Error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to fetch suppliers"
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
        loadSuppliers();
    }, [
        page,
        filterCompany,
        filterBranch,
        statusFilter,
        search,
    ]);

    // =====================================================
    // FILTER COMPANY CHANGE
    // =====================================================
    const handleFilterCompanyChange = async (value) => {
        setFilterCompany(value);
        setFilterBranch("");
        setPage(1);

        await loadBranches(value, true);
    };

    // =====================================================
    // FORM COMPANY CHANGE
    // =====================================================
    const handleFormCompanyChange = async (value) => {
        setFormData((prev) => ({
            ...prev,
            company: value,
            branch: "",
        }));

        await loadBranches(value, false);
    };

    // =====================================================
    // FORM FIELD CHANGE
    // =====================================================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // =====================================================
    // ADDRESS CHANGE
    // =====================================================
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

    // =====================================================
    // BANK CHANGE
    // =====================================================
    const handleBankChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            bankDetails: {
                ...prev.bankDetails,
                [name]: value,
            },
        }));
    };

    // =====================================================
    // OPEN ADD
    // =====================================================
    const openAddModal = () => {
        setEditingSupplier(null);
        setFormData(initialForm);
        setBranches([]);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================
    const openEditModal = async (supplier) => {
        try {
            setError("");
            setSuccess("");

            const response = await api.get(
                `/suppliers/${supplier._id}`
            );

            const data = response.data.data;

            setEditingSupplier(data);

            setFormData({
                company: data.company?._id || data.company || "",
                branch: data.branch?._id || data.branch || "",
                supplierCode: data.supplierCode || "",
                name: data.name || "",
                companyName: data.companyName || "",
                email: data.email || "",
                phone: data.phone || "",
                alternatePhone: data.alternatePhone || "",
                gstNumber: data.gstNumber || "",
                panNumber: data.panNumber || "",
                paymentTerms: data.paymentTerms ?? 0,
                creditLimit: data.creditLimit ?? 0,
                address: {
                    street: data.address?.street || "",
                    city: data.address?.city || "",
                    state: data.address?.state || "",
                    pincode: data.address?.pincode || "",
                    country: data.address?.country || "India",
                },
                bankDetails: {
                    accountName:
                        data.bankDetails?.accountName || "",
                    accountNumber:
                        data.bankDetails?.accountNumber || "",
                    bankName:
                        data.bankDetails?.bankName || "",
                    ifscCode:
                        data.bankDetails?.ifscCode || "",
                },
                notes: data.notes || "",
                isActive:
                    data.isActive !== undefined
                        ? data.isActive
                        : true,
            });

            await loadBranches(
                data.company?._id || data.company,
                false
            );

            setShowModal(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load supplier"
            );
        }
    };

    // =====================================================
    // VIEW SUPPLIER
    // =====================================================
    const openViewModal = async (supplier) => {
        try {
            const response = await api.get(
                `/suppliers/${supplier._id}`
            );

            setSelectedSupplier(response.data.data);
            setShowViewModal(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load supplier details"
            );
        }
    };

    // =====================================================
    // SUBMIT
    // =====================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setFormLoading(true);
            setError("");
            setSuccess("");

            const payload = {
                company: formData.company,
                branch: formData.branch,
                supplierCode: formData.supplierCode.trim(),
                name: formData.name.trim(),
                companyName: formData.companyName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                alternatePhone:
                    formData.alternatePhone.trim(),
                gstNumber: formData.gstNumber.trim(),
                panNumber: formData.panNumber.trim(),
                paymentTerms: Number(formData.paymentTerms),
                creditLimit: Number(formData.creditLimit),
                address: {
                    street: formData.address.street.trim(),
                    city: formData.address.city.trim(),
                    state: formData.address.state.trim(),
                    pincode: formData.address.pincode.trim(),
                    country: formData.address.country.trim(),
                },
                bankDetails: {
                    accountName:
                        formData.bankDetails.accountName.trim(),
                    accountNumber:
                        formData.bankDetails.accountNumber.trim(),
                    bankName:
                        formData.bankDetails.bankName.trim(),
                    ifscCode:
                        formData.bankDetails.ifscCode.trim(),
                },
                notes: formData.notes.trim(),
                isActive: formData.isActive,
            };

            if (editingSupplier) {
                await api.put(
                    `/suppliers/${editingSupplier._id}`,
                    payload
                );

                setSuccess(
                    "Supplier updated successfully"
                );
            } else {
                await api.post("/suppliers", payload);

                setSuccess(
                    "Supplier created successfully"
                );
            }

            setShowModal(false);
            setEditingSupplier(null);
            setFormData(initialForm);

            await loadSuppliers();
        } catch (err) {
            console.error("Save Supplier Error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save supplier"
            );
        } finally {
            setFormLoading(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================
    const handleDelete = async (supplier) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete supplier "${supplier.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/suppliers/${supplier._id}`
            );

            setSuccess(
                "Supplier deleted successfully"
            );

            if (
                suppliers.length === 1 &&
                page > 1
            ) {
                setPage((prev) => prev - 1);
            } else {
                await loadSuppliers();
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete supplier"
            );
        }
    };

    // =====================================================
    // CLOSE MODALS
    // =====================================================
    const closeModal = () => {
        if (formLoading) return;

        setShowModal(false);
        setEditingSupplier(null);
        setFormData(initialForm);
        setBranches([]);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedSupplier(null);
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const getCompanyName = (supplier) => {
        return (
            supplier.company?.name ||
            supplier.company?.legalName ||
            "-"
        );
    };

    const getBranchName = (supplier) => {
        return (
            supplier.branch?.name ||
            "-"
        );
    };

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
    // RENDER
    // =====================================================
    return (
        <div className="suppliers-page">

            {/* HEADER */}
            <div className="suppliers-header">
                <div>
                    <h1>Suppliers</h1>
                    <p>
                        Manage suppliers and vendor information
                    </p>
                </div>

                <div className="suppliers-header-actions">
                    <button
                        className="supplier-refresh-btn"
                        onClick={loadSuppliers}
                        disabled={loading}
                    >
                        <FiRefreshCw
                            className={loading ? "spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        className="supplier-add-btn"
                        onClick={openAddModal}
                    >
                        <FiPlus />
                        Add Supplier
                    </button>
                </div>
            </div>

            {/* ALERTS */}
            {error && (
                <div className="supplier-alert supplier-alert-error">
                    {error}
                    <button
                        onClick={() => setError("")}
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {success && (
                <div className="supplier-alert supplier-alert-success">
                    {success}
                    <button
                        onClick={() => setSuccess("")}
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* SUMMARY */}
            <div className="supplier-summary-grid">
                <div className="supplier-summary-card">
                    <div>
                        <span>Total Suppliers</span>
                        <strong>{totalSuppliers}</strong>
                    </div>

                    <div className="supplier-summary-icon">
                        <FiCreditCard />
                    </div>
                </div>

                <div className="supplier-summary-card">
                    <div>
                        <span>Active</span>
                        <strong>
                            {suppliers.filter(
                                (item) => item.isActive
                            ).length}
                        </strong>
                    </div>

                    <div className="supplier-summary-icon active">
                        <FiCreditCard />
                    </div>
                </div>

                <div className="supplier-summary-card">
                    <div>
                        <span>Inactive</span>
                        <strong>
                            {suppliers.filter(
                                (item) => !item.isActive
                            ).length}
                        </strong>
                    </div>

                    <div className="supplier-summary-icon inactive">
                        <FiCreditCard />
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="supplier-filters">

                <div className="supplier-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search supplier..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <select
                    value={filterCompany}
                    onChange={(e) =>
                        handleFilterCompanyChange(
                            e.target.value
                        )
                    }
                >
                    <option value="">
                        All Companies
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

                <select
                    value={filterBranch}
                    onChange={(e) => {
                        setFilterBranch(e.target.value);
                        setPage(1);
                    }}
                    disabled={!filterCompany}
                >
                    <option value="">
                        All Branches
                    </option>

                    {filterBranches.map((branch) => (
                        <option
                            key={branch._id}
                            value={branch._id}
                        >
                            {branch.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
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
            </div>

            {/* TABLE */}
            <div className="supplier-table-card">
                {loading ? (
                    <div className="supplier-loading">
                        Loading suppliers...
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="supplier-empty">
                        <FiCreditCard />
                        <h3>No suppliers found</h3>
                        <p>
                            Add your first supplier to get started.
                        </p>
                    </div>
                ) : (
                    <div className="supplier-table-wrapper">
                        <table className="supplier-table">
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Code</th>
                                    <th>Company</th>
                                    <th>Branch</th>
                                    <th>Contact</th>
                                    <th>GST / PAN</th>
                                    <th>Credit Limit</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {suppliers.map((supplier) => (
                                    <tr key={supplier._id}>
                                        <td>
                                            <div className="supplier-name-cell">
                                                <strong>
                                                    {supplier.name}
                                                </strong>

                                                {supplier.companyName && (
                                                    <small>
                                                        {
                                                            supplier.companyName
                                                        }
                                                    </small>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span className="supplier-code">
                                                {
                                                    supplier.supplierCode
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            {getCompanyName(
                                                supplier
                                            )}
                                        </td>

                                        <td>
                                            {getBranchName(
                                                supplier
                                            )}
                                        </td>

                                        <td>
                                            <div className="supplier-contact">
                                                <span>
                                                    <FiPhone />
                                                    {supplier.phone}
                                                </span>

                                                {supplier.email && (
                                                    <span>
                                                        <FiMail />
                                                        {
                                                            supplier.email
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="supplier-tax">
                                                <span>
                                                    GST:{" "}
                                                    {supplier.gstNumber ||
                                                        "-"}
                                                </span>

                                                <span>
                                                    PAN:{" "}
                                                    {supplier.panNumber ||
                                                        "-"}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            {formatCurrency(
                                                supplier.creditLimit
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={`supplier-status ${
                                                    supplier.isActive
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {supplier.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="supplier-actions">
                                                <button
                                                    title="View"
                                                    onClick={() =>
                                                        openViewModal(
                                                            supplier
                                                        )
                                                    }
                                                >
                                                    <FiEye />
                                                </button>

                                                <button
                                                    title="Edit"
                                                    onClick={() =>
                                                        openEditModal(
                                                            supplier
                                                        )
                                                    }
                                                >
                                                    <FiEdit2 />
                                                </button>

                                                <button
                                                    title="Delete"
                                                    className="delete"
                                                    onClick={() =>
                                                        handleDelete(
                                                            supplier
                                                        )
                                                    }
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="supplier-pagination">
                    <button
                        disabled={page === 1}
                        onClick={() =>
                            setPage((prev) => prev - 1)
                        }
                    >
                        Previous
                    </button>

                    <span>
                        Page {page} of {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() =>
                            setPage((prev) => prev + 1)
                        }
                    >
                        Next
                    </button>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="supplier-modal-overlay">
                    <div className="supplier-modal">

                        <div className="supplier-modal-header">
                            <div>
                                <h2>
                                    {editingSupplier
                                        ? "Edit Supplier"
                                        : "Add Supplier"}
                                </h2>

                                <p>
                                    {editingSupplier
                                        ? "Update supplier information"
                                        : "Create a new supplier"}
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                disabled={formLoading}
                            >
                                <FiX />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="supplier-form"
                        >

                            {/* BASIC */}
                            <div className="supplier-section">
                                <h3>Basic Information</h3>

                                <div className="supplier-form-grid">

                                    <div className="supplier-field">
                                        <label>
                                            Company *
                                        </label>

                                        <select
                                            value={formData.company}
                                            onChange={(e) =>
                                                handleFormCompanyChange(
                                                    e.target.value
                                                )
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

                                    <div className="supplier-field">
                                        <label>
                                            Branch *
                                        </label>

                                        <select
                                            value={formData.branch}
                                            onChange={(e) =>
                                                setFormData(
                                                    (prev) => ({
                                                        ...prev,
                                                        branch:
                                                            e.target
                                                                .value,
                                                    })
                                                )
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
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Supplier Code *
                                        </label>

                                        <input
                                            type="text"
                                            name="supplierCode"
                                            value={
                                                formData.supplierCode
                                            }
                                            onChange={handleChange}
                                            maxLength={30}
                                            required
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Supplier Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            maxLength={150}
                                            required
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Company Name
                                        </label>

                                        <input
                                            type="text"
                                            name="companyName"
                                            value={
                                                formData.companyName
                                            }
                                            onChange={handleChange}
                                            maxLength={200}
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Phone *
                                        </label>

                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            maxLength={20}
                                            required
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Alternate Phone
                                        </label>

                                        <input
                                            type="text"
                                            name="alternatePhone"
                                            value={
                                                formData.alternatePhone
                                            }
                                            onChange={handleChange}
                                            maxLength={20}
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            maxLength={150}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TAX */}
                            <div className="supplier-section">
                                <h3>Tax & Credit</h3>

                                <div className="supplier-form-grid">

                                    <div className="supplier-field">
                                        <label>
                                            GST Number
                                        </label>

                                        <input
                                            type="text"
                                            name="gstNumber"
                                            value={
                                                formData.gstNumber
                                            }
                                            onChange={handleChange}
                                            maxLength={20}
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            PAN Number
                                        </label>

                                        <input
                                            type="text"
                                            name="panNumber"
                                            value={
                                                formData.panNumber
                                            }
                                            onChange={handleChange}
                                            maxLength={20}
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Payment Terms
                                        </label>

                                        <input
                                            type="number"
                                            name="paymentTerms"
                                            min="0"
                                            value={
                                                formData.paymentTerms
                                            }
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Credit Limit
                                        </label>

                                        <input
                                            type="number"
                                            name="creditLimit"
                                            min="0"
                                            step="0.01"
                                            value={
                                                formData.creditLimit
                                            }
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ADDRESS */}
                            <div className="supplier-section">
                                <h3>Address</h3>

                                <div className="supplier-form-grid">

                                    <div className="supplier-field full">
                                        <label>Street</label>

                                        <input
                                            type="text"
                                            name="street"
                                            value={
                                                formData.address.street
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>City</label>

                                        <input
                                            type="text"
                                            name="city"
                                            value={
                                                formData.address.city
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>State</label>

                                        <input
                                            type="text"
                                            name="state"
                                            value={
                                                formData.address.state
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>Pincode</label>

                                        <input
                                            type="text"
                                            name="pincode"
                                            value={
                                                formData.address.pincode
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>Country</label>

                                        <input
                                            type="text"
                                            name="country"
                                            value={
                                                formData.address.country
                                            }
                                            onChange={
                                                handleAddressChange
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BANK */}
                            <div className="supplier-section">
                                <h3>Bank Details</h3>

                                <div className="supplier-form-grid">

                                    <div className="supplier-field">
                                        <label>
                                            Account Name
                                        </label>

                                        <input
                                            type="text"
                                            name="accountName"
                                            value={
                                                formData.bankDetails
                                                    .accountName
                                            }
                                            onChange={
                                                handleBankChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Account Number
                                        </label>

                                        <input
                                            type="text"
                                            name="accountNumber"
                                            value={
                                                formData.bankDetails
                                                    .accountNumber
                                            }
                                            onChange={
                                                handleBankChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            Bank Name
                                        </label>

                                        <input
                                            type="text"
                                            name="bankName"
                                            value={
                                                formData.bankDetails
                                                    .bankName
                                            }
                                            onChange={
                                                handleBankChange
                                            }
                                        />
                                    </div>

                                    <div className="supplier-field">
                                        <label>
                                            IFSC Code
                                        </label>

                                        <input
                                            type="text"
                                            name="ifscCode"
                                            value={
                                                formData.bankDetails
                                                    .ifscCode
                                            }
                                            onChange={
                                                handleBankChange
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* NOTES */}
                            <div className="supplier-section">
                                <h3>Additional Information</h3>

                                <div className="supplier-field full">
                                    <label>Notes</label>

                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        maxLength={1000}
                                        rows={4}
                                    />
                                </div>

                                <label className="supplier-checkbox">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={
                                            formData.isActive
                                        }
                                        onChange={handleChange}
                                    />

                                    <span>
                                        Supplier is active
                                    </span>
                                </label>
                            </div>

                            {/* ACTIONS */}
                            <div className="supplier-modal-actions">
                                <button
                                    type="button"
                                    className="supplier-cancel-btn"
                                    onClick={closeModal}
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="supplier-save-btn"
                                    disabled={formLoading}
                                >
                                    {formLoading
                                        ? "Saving..."
                                        : editingSupplier
                                        ? "Update Supplier"
                                        : "Create Supplier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {showViewModal &&
                selectedSupplier && (
                    <div className="supplier-modal-overlay">
                        <div className="supplier-view-modal">

                            <div className="supplier-modal-header">
                                <div>
                                    <h2>
                                        Supplier Details
                                    </h2>

                                    <p>
                                        {
                                            selectedSupplier.name
                                        }
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

                            <div className="supplier-view-content">

                                <div className="supplier-view-section">
                                    <h3>
                                        Basic Information
                                    </h3>

                                    <div className="supplier-detail-grid">

                                        <div>
                                            <span>
                                                Supplier Code
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.supplierCode
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Supplier Name
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.name
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Company
                                            </span>

                                            <strong>
                                                {getCompanyName(
                                                    selectedSupplier
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Branch
                                            </span>

                                            <strong>
                                                {getBranchName(
                                                    selectedSupplier
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Phone
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.phone
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Email
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.email ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="supplier-view-section">
                                    <h3>
                                        Tax & Credit
                                    </h3>

                                    <div className="supplier-detail-grid">

                                        <div>
                                            <span>
                                                GST Number
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.gstNumber ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                PAN Number
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.panNumber ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Payment Terms
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier.paymentTerms ??
                                                    0
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Credit Limit
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedSupplier.creditLimit
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="supplier-view-section">
                                    <h3>
                                        Address
                                    </h3>

                                    <div className="supplier-address-box">
                                        <FiMapPin />

                                        <div>
                                            <strong>
                                                {selectedSupplier
                                                    .address
                                                    ?.street ||
                                                    "-"}
                                            </strong>

                                            <span>
                                                {
                                                    selectedSupplier
                                                        .address
                                                        ?.city
                                                }
                                                {selectedSupplier
                                                    .address
                                                    ?.state &&
                                                    `, ${selectedSupplier.address.state}`}
                                            </span>

                                            <span>
                                                {
                                                    selectedSupplier
                                                        .address
                                                        ?.pincode
                                                }
                                                {selectedSupplier
                                                    .address
                                                    ?.country &&
                                                    `, ${selectedSupplier.address.country}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="supplier-view-section">
                                    <h3>
                                        Bank Details
                                    </h3>

                                    <div className="supplier-detail-grid">

                                        <div>
                                            <span>
                                                Account Name
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier
                                                        .bankDetails
                                                        ?.accountName ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Account Number
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier
                                                        .bankDetails
                                                        ?.accountNumber ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Bank Name
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier
                                                        .bankDetails
                                                        ?.bankName ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                IFSC Code
                                            </span>

                                            <strong>
                                                {
                                                    selectedSupplier
                                                        .bankDetails
                                                        ?.ifscCode ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {selectedSupplier.notes && (
                                    <div className="supplier-view-section">
                                        <h3>Notes</h3>

                                        <p className="supplier-notes">
                                            {
                                                selectedSupplier.notes
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="supplier-modal-actions">
                                <button
                                    className="supplier-cancel-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    className="supplier-save-btn"
                                    onClick={() => {
                                        closeViewModal();
                                        openEditModal(
                                            selectedSupplier
                                        );
                                    }}
                                >
                                    <FiEdit2 />
                                    Edit Supplier
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Suppliers;