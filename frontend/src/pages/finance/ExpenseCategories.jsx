import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiX,
    FiLayers,
    FiCheckCircle,
    FiXCircle,
    FiChevronLeft,
    FiChevronRight,
    FiGitBranch,
    FiBriefcase,
    FiFolder,
    FiFileText,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/expenseCategories.css";

const EMPTY_FORM = {
    company: "",
    branch: "",
    name: "",
    code: "",
    description: "",
    parentCategory: "",
    isActive: true,
};

const ExpenseCategories = () => {
    // =====================================================
    // STATE
    // =====================================================

    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [masterLoading, setMasterLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");

    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [editingCategory, setEditingCategory] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);

    // =====================================================
    // CLEAR MESSAGES
    // =====================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    // =====================================================
    // LOAD COMPANIES
    // =====================================================

    const loadCompanies = async () => {
        try {
            setMasterLoading(true);

            const response = await api.get("/companies");

            const payload = response?.data;

            const companyList = Array.isArray(payload?.companies)
                ? payload.companies
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : [];

            setCompanies(companyList);
        } catch (err) {
            console.error("Failed to load companies:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to load companies."
            );
        } finally {
            setMasterLoading(false);
        }
    };

    // =====================================================
    // LOAD BRANCHES
    // =====================================================

    const loadBranches = async (companyId = "") => {
        try {
            if (!companyId) {
                setBranches([]);
                return;
            }

            const response = await api.get("/branches", {
                params: {
                    company: companyId,
                    isActive: true,
                    limit: 100,
                },
            });

            const payload = response?.data;

            const branchList = Array.isArray(payload?.branches)
                ? payload.branches
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : [];

            setBranches(branchList);
        } catch (err) {
            console.error("Failed to load branches:", err);

            setBranches([]);

            setError(
                err?.response?.data?.message ||
                "Failed to load branches."
            );
        }
    };

    // =====================================================
    // LOAD PARENT CATEGORIES
    // =====================================================

    const loadParentCategories = async (
        companyId,
        branchId,
        excludeId = ""
    ) => {
        try {
            if (!companyId || !branchId) {
                setParentCategories([]);
                return;
            }

            const response = await api.get(
                "/expense-categories",
                {
                    params: {
                        company: companyId,
                        branch: branchId,
                        isActive: true,
                        limit: 100,
                        page: 1,
                    },
                }
            );

            const list = Array.isArray(response?.data?.data)
                ? response.data.data
                : [];

            const filtered = list.filter(
                (category) =>
                    String(category?._id) !== String(excludeId)
            );

            setParentCategories(filtered);
        } catch (err) {
            console.error(
                "Failed to load parent categories:",
                err
            );

            setParentCategories([]);
        }
    };

    // =====================================================
    // LOAD CATEGORIES
    // =====================================================

    const loadCategories = async (targetPage = page) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: targetPage,
                limit: 10,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (companyFilter) {
                params.company = companyFilter;
            }

            if (branchFilter) {
                params.branch = branchFilter;
            }

            if (statusFilter !== "") {
                params.isActive = statusFilter;
            }

            const response = await api.get(
                "/expense-categories",
                {
                    params,
                }
            );

            const data = response?.data;

            setCategories(
                Array.isArray(data?.data)
                    ? data.data
                    : []
            );

            setPagination(
                data?.pagination || {
                    currentPage: targetPage,
                    perPage: 10,
                    totalItems: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                }
            );
        } catch (err) {
            console.error(
                "Failed to load expense categories:",
                err
            );

            setCategories([]);

            setError(
                err?.response?.data?.message ||
                "Failed to load expense categories."
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
        loadCategories(page);
    }, [
        page,
        search,
        companyFilter,
        branchFilter,
        statusFilter,
    ]);

    // =====================================================
    // COMPANY FILTER CHANGE
    // =====================================================

    const handleCompanyFilterChange = async (value) => {
        setCompanyFilter(value);
        setBranchFilter("");
        setPage(1);

        if (value) {
            await loadBranches(value);
        } else {
            setBranches([]);
        }
    };

    // =====================================================
    // FORM COMPANY CHANGE
    // =====================================================

    const handleFormCompanyChange = async (value) => {
        setFormData((prev) => ({
            ...prev,
            company: value,
            branch: "",
            parentCategory: "",
        }));

        setParentCategories([]);

        if (value) {
            await loadBranches(value);
        } else {
            setBranches([]);
        }
    };

    // =====================================================
    // FORM BRANCH CHANGE
    // =====================================================

    const handleFormBranchChange = async (value) => {
        setFormData((prev) => ({
            ...prev,
            branch: value,
            parentCategory: "",
        }));

        setParentCategories([]);

        if (formData.company && value) {
            await loadParentCategories(
                formData.company,
                value,
                editingCategory?._id || ""
            );
        }
    };

    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (event) => {
        const { name, value, type, checked } =
            event.target;

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

    const handleAdd = () => {
        clearMessages();

        setModalMode("create");
        setEditingCategory(null);

        setFormData(EMPTY_FORM);

        setBranches([]);
        setParentCategories([]);

        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================

    const handleEdit = async (category) => {
        clearMessages();

        try {
            setModalMode("edit");
            setEditingCategory(category);

            const companyId =
                category?.company?._id ||
                category?.company ||
                "";

            const branchId =
                category?.branch?._id ||
                category?.branch ||
                "";

            const parentId =
                category?.parentCategory?._id ||
                category?.parentCategory ||
                "";

            setFormData({
                company: companyId,
                branch: branchId,
                name: category?.name || "",
                code: category?.code || "",
                description:
                    category?.description || "",
                parentCategory: parentId,
                isActive:
                    category?.isActive !== false,
            });

            if (companyId) {
                await loadBranches(companyId);
            }

            if (companyId && branchId) {
                await loadParentCategories(
                    companyId,
                    branchId,
                    category?._id || ""
                );
            }

            setShowModal(true);
        } catch (err) {
            console.error(
                "Failed to prepare category edit:",
                err
            );

            setError(
                "Failed to prepare category for editing."
            );
        }
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        clearMessages();

        if (!formData.company) {
            setError("Please select a company.");
            return;
        }

        if (!formData.branch) {
            setError("Please select a branch.");
            return;
        }

        if (!formData.name.trim()) {
            setError("Category name is required.");
            return;
        }

        if (!formData.code.trim()) {
            setError("Category code is required.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                company: formData.company,
                branch: formData.branch,
                name: formData.name.trim(),
                code: formData.code
                    .trim()
                    .toUpperCase(),
                description:
                    formData.description.trim(),
                parentCategory:
                    formData.parentCategory || null,
                isActive: Boolean(
                    formData.isActive
                ),
            };

            if (modalMode === "edit") {
                delete payload.company;
                delete payload.branch;

                await api.put(
                    `/expense-categories/${editingCategory._id}`,
                    payload
                );

                setSuccess(
                    "Expense category updated successfully."
                );
            } else {
                await api.post(
                    "/expense-categories",
                    payload
                );

                setSuccess(
                    "Expense category created successfully."
                );
            }

            setShowModal(false);
            setEditingCategory(null);
            setFormData(EMPTY_FORM);

            await loadCategories(page);
        } catch (err) {
            console.error(
                "Save expense category error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to save expense category."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // VIEW
    // =====================================================

    const handleView = async (categoryId) => {
        try {
            clearMessages();

            const response = await api.get(
                `/expense-categories/${categoryId}`
            );

            setSelectedCategory(
                response?.data?.data || null
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "Failed to load expense category:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to load expense category."
            );
        }
    };

    // =====================================================
    // DELETE / DEACTIVATE
    // =====================================================

    const handleDelete = async (category) => {
        const categoryName =
            category?.name || "this category";

        const confirmed = window.confirm(
            `Are you sure you want to deactivate "${categoryName}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            clearMessages();

            await api.delete(
                `/expense-categories/${category._id}`
            );

            setSuccess(
                "Expense category deactivated successfully."
            );

            await loadCategories(page);
        } catch (err) {
            console.error(
                "Delete expense category error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to deactivate expense category."
            );
        }
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingCategory(null);
        setFormData(EMPTY_FORM);
        setParentCategories([]);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedCategory(null);
    };

    // =====================================================
    // FILTERED BRANCHES FOR FORM
    // =====================================================

    const formBranches = useMemo(() => {
        if (!formData.company) {
            return [];
        }

        return branches.filter((branch) => {
            const branchCompany =
                branch?.company?._id ||
                branch?.company;

            return (
                !branchCompany ||
                String(branchCompany) ===
                String(formData.company)
            );
        });
    }, [branches, formData.company]);

    // =====================================================
    // FILTERED BRANCHES FOR TOP FILTER
    // =====================================================

    const filterBranches = useMemo(() => {
        if (!companyFilter) {
            return branches;
        }

        return branches.filter((branch) => {
            const branchCompany =
                branch?.company?._id ||
                branch?.company;

            return (
                !branchCompany ||
                String(branchCompany) ===
                String(companyFilter)
            );
        });
    }, [branches, companyFilter]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const activeCount = categories.filter(
        (category) => category?.isActive !== false
    ).length;

    const inactiveCount = categories.filter(
        (category) => category?.isActive === false
    ).length;

    // =====================================================
    // FORMAT HELPERS
    // =====================================================

    const getId = (value) => {
        if (!value) {
            return "";
        }

        if (typeof value === "string") {
            return value;
        }

        return value?._id || "";
    };

    const getCompanyName = (category) => {
        return (
            category?.company?.name ||
            category?.company?.legalName ||
            "-"
        );
    };

    const getBranchName = (category) => {
        return (
            category?.branch?.name ||
            category?.branch?.branchCode ||
            "-"
        );
    };

    const getParentName = (category) => {
        if (!category?.parentCategory) {
            return "Root Category";
        }

        return (
            category.parentCategory.name ||
            category.parentCategory.code ||
            "-"
        );
    };

    const getCompanyById = (id) => {
        const company = companies.find(
            (item) =>
                String(item?._id) === String(id)
        );

        return company;
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="expense-categories-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="expense-categories-header">

                <div>
                    <div className="expense-categories-title-row">
                        <div className="expense-categories-title-icon">
                            <FiLayers />
                        </div>

                        <div>
                            <h1>
                                Expense Categories
                            </h1>

                            <p>
                                Manage expense categories
                                for your company branches
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="expense-categories-primary-btn"
                    onClick={handleAdd}
                >
                    <FiPlus />
                    Add Category
                </button>

            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (
                <div className="expense-categories-alert error">
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
                <div className="expense-categories-alert success">
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

            <div className="expense-categories-summary">

                <div className="expense-summary-card">
                    <div className="expense-summary-icon total">
                        <FiLayers />
                    </div>

                    <div>
                        <span>
                            Current Page
                        </span>

                        <strong>
                            {categories.length}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon active">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>
                            Active
                        </span>

                        <strong>
                            {activeCount}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon inactive">
                        <FiXCircle />
                    </div>

                    <div>
                        <span>
                            Inactive
                        </span>

                        <strong>
                            {inactiveCount}
                        </strong>
                    </div>
                </div>

                <div className="expense-summary-card">
                    <div className="expense-summary-icon total">
                        <FiFolder />
                    </div>

                    <div>
                        <span>
                            Total Results
                        </span>

                        <strong>
                            {pagination.totalItems || 0}
                        </strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="expense-categories-toolbar">

                <div className="expense-category-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search name, code or description..."
                        value={search}
                        onChange={(event) => {
                            setSearch(
                                event.target.value
                            );
                            setPage(1);
                        }}
                    />
                </div>

                <div className="expense-category-filter">
                    <FiBriefcase />

                    <select
                        value={companyFilter}
                        onChange={(event) =>
                            handleCompanyFilterChange(
                                event.target.value
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
                                {company.name ||
                                    company.legalName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="expense-category-filter">
                    <FiGitBranch />

                    <select
                        value={branchFilter}
                        onChange={(event) => {
                            setBranchFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                        disabled={!companyFilter}
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
                </div>

                <div className="expense-category-filter">
                    <FiCheckCircle />

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="true">
                            Active
                        </option>

                        <option value="false">
                            Inactive
                        </option>
                    </select>
                </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="expense-categories-table-card">

                <div className="expense-categories-table-wrapper">

                    {loading ? (
                        <div className="expense-categories-loading">
                            <div className="expense-categories-spinner" />

                            <p>
                                Loading expense categories...
                            </p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="expense-categories-empty">
                            <div className="expense-empty-icon">
                                <FiLayers />
                            </div>

                            <h3>
                                No expense categories found
                            </h3>

                            <p>
                                Create a category or change
                                your filters to see results.
                            </p>

                            <button
                                type="button"
                                onClick={handleAdd}
                            >
                                <FiPlus />
                                Add Category
                            </button>
                        </div>
                    ) : (
                        <table className="expense-categories-table">

                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Code</th>
                                    <th>Company</th>
                                    <th>Branch</th>
                                    <th>Parent</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {categories.map(
                                    (category) => (
                                        <tr
                                            key={
                                                category._id
                                            }
                                        >

                                            <td>
                                                <div className="expense-category-name-cell">

                                                    <div className="expense-category-avatar">
                                                        <FiLayers />
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                category.name
                                                            }
                                                        </strong>

                                                        {category.description && (
                                                            <span>
                                                                {
                                                                    category.description
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <span className="expense-category-code">
                                                    {
                                                        category.code
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="expense-category-company">
                                                    {
                                                        getCompanyName(
                                                            category
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="expense-category-branch">
                                                    <FiGitBranch />

                                                    {
                                                        getBranchName(
                                                            category
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        category.parentCategory
                                                            ? "expense-parent-badge"
                                                            : "expense-root-badge"
                                                    }
                                                >
                                                    {
                                                        getParentName(
                                                            category
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        category.isActive !==
                                                            false
                                                            ? "expense-status-badge active"
                                                            : "expense-status-badge inactive"
                                                    }
                                                >
                                                    {category.isActive !==
                                                        false ? (
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
                                                <div className="expense-category-actions">

                                                    <button
                                                        type="button"
                                                        className="expense-action-btn view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                category._id
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="expense-action-btn edit"
                                                        title="Edit"
                                                        onClick={() =>
                                                            handleEdit(
                                                                category
                                                            )
                                                        }
                                                    >
                                                        <FiEdit2 />
                                                    </button>

                                                    {category.isActive !==
                                                        false && (
                                                            <button
                                                                type="button"
                                                                className="expense-action-btn delete"
                                                                title="Deactivate"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        category
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
                    )}

                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {!loading &&
                    categories.length > 0 && (
                        <div className="expense-categories-pagination">

                            <div className="expense-pagination-info">
                                Showing{" "}
                                <strong>
                                    {categories.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {pagination.totalItems}
                                </strong>{" "}
                                categories
                            </div>

                            <div className="expense-pagination-controls">

                                <button
                                    type="button"
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                    onClick={() =>
                                        setPage(
                                            (prev) =>
                                                Math.max(
                                                    prev - 1,
                                                    1
                                                )
                                        )
                                    }
                                >
                                    <FiChevronLeft />
                                </button>

                                <span>
                                    Page{" "}
                                    <strong>
                                        {
                                            pagination.currentPage
                                        }
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {
                                            pagination.totalPages ||
                                            1
                                        }
                                    </strong>
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        !pagination.hasNextPage
                                    }
                                    onClick={() =>
                                        setPage(
                                            (prev) =>
                                                prev + 1
                                        )
                                    }
                                >
                                    <FiChevronRight />
                                </button>

                            </div>

                        </div>
                    )}

            </div>

            {/* =====================================================
                CREATE / EDIT MODAL
            ===================================================== */}

            {showModal && (
                <div
                    className="expense-categories-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="expense-categories-modal">

                        <div className="expense-categories-modal-header">

                            <div>
                                <div className="expense-modal-title-icon">
                                    {modalMode ===
                                        "edit" ? (
                                        <FiEdit2 />
                                    ) : (
                                        <FiPlus />
                                    )}
                                </div>

                                <div>
                                    <h2>
                                        {modalMode ===
                                            "edit"
                                            ? "Edit Expense Category"
                                            : "Add Expense Category"}
                                    </h2>

                                    <p>
                                        {modalMode ===
                                            "edit"
                                            ? "Update category details"
                                            : "Create a new expense category"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <FiX />
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                        >

                            <div className="expense-categories-modal-body">

                                {/* COMPANY */}

                                <div className="expense-form-group">
                                    <label>
                                        Company
                                        <span>*</span>
                                    </label>

                                    <div className="expense-input-with-icon">
                                        <FiBriefcase />

                                        <select
                                            name="company"
                                            value={
                                                formData.company
                                            }
                                            onChange={(event) =>
                                                handleFormCompanyChange(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                modalMode ===
                                                "edit"
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
                                                        {company.name ||
                                                            company.legalName}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* BRANCH */}

                                <div className="expense-form-group">
                                    <label>
                                        Branch
                                        <span>*</span>
                                    </label>

                                    <div className="expense-input-with-icon">
                                        <FiGitBranch />

                                        <select
                                            name="branch"
                                            value={
                                                formData.branch
                                            }
                                            onChange={(event) =>
                                                handleFormBranchChange(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                modalMode ===
                                                "edit" ||
                                                !formData.company
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Branch
                                            </option>

                                            {formBranches.map(
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
                                                        {branch.name}
                                                        {branch.branchCode
                                                            ? ` (${branch.branchCode})`
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* NAME */}

                                <div className="expense-form-group">
                                    <label>
                                        Category Name
                                        <span>*</span>
                                    </label>

                                    <div className="expense-input-with-icon">
                                        <FiLayers />

                                        <input
                                            type="text"
                                            name="name"
                                            value={
                                                formData.name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter category name"
                                            maxLength={100}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* CODE */}

                                <div className="expense-form-group">
                                    <label>
                                        Category Code
                                        <span>*</span>
                                    </label>

                                    <div className="expense-input-with-icon">
                                        <FiFileText />

                                        <input
                                            type="text"
                                            name="code"
                                            value={
                                                formData.code
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. OFFICE"
                                            maxLength={30}
                                            style={{
                                                textTransform:
                                                    "uppercase",
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* PARENT */}

                                <div className="expense-form-group">
                                    <label>
                                        Parent Category
                                    </label>

                                    <div className="expense-input-with-icon">
                                        <FiFolder />

                                        <select
                                            name="parentCategory"
                                            value={
                                                formData.parentCategory
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                !formData.company ||
                                                !formData.branch
                                            }
                                        >
                                            <option value="">
                                                Root Category
                                            </option>

                                            {parentCategories.map(
                                                (
                                                    parent
                                                ) => (
                                                    <option
                                                        key={
                                                            parent._id
                                                        }
                                                        value={
                                                            parent._id
                                                        }
                                                    >
                                                        {
                                                            parent.name
                                                        }{" "}
                                                        (
                                                        {
                                                            parent.code
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <small>
                                        Only active categories
                                        from the same company
                                        and branch are shown.
                                    </small>
                                </div>

                                {/* DESCRIPTION */}

                                <div className="expense-form-group full">
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
                                        placeholder="Enter category description..."
                                        maxLength={500}
                                        rows={4}
                                    />

                                    <small>
                                        {
                                            formData
                                                .description
                                                .length
                                        }
                                        /500
                                    </small>
                                </div>

                                {/* STATUS */}

                                <div className="expense-form-status-box">

                                    <div>
                                        <strong>
                                            Category Status
                                        </strong>

                                        <p>
                                            Inactive categories
                                            cannot be selected as
                                            parent categories.
                                        </p>
                                    </div>

                                    <label className="expense-switch">

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

                                        <span />

                                        <em>
                                            {formData.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </em>

                                    </label>

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="expense-categories-modal-footer">

                                <button
                                    type="button"
                                    className="expense-modal-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="expense-modal-save-btn"
                                    disabled={
                                        saving ||
                                        masterLoading
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <span className="expense-button-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle />

                                            {modalMode ===
                                                "edit"
                                                ? "Update Category"
                                                : "Create Category"}
                                        </>
                                    )}
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
                selectedCategory && (
                    <div
                        className="expense-categories-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >

                        <div className="expense-categories-view-modal">

                            <div className="expense-categories-modal-header">

                                <div>
                                    <div className="expense-modal-title-icon">
                                        <FiEye />
                                    </div>

                                    <div>
                                        <h2>
                                            Expense Category
                                            Details
                                        </h2>

                                        <p>
                                            View category
                                            information
                                        </p>
                                    </div>
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

                            <div className="expense-view-body">

                                <div className="expense-view-main-card">

                                    <div className="expense-view-category-icon">
                                        <FiLayers />
                                    </div>

                                    <div>
                                        <h3>
                                            {
                                                selectedCategory.name
                                            }
                                        </h3>

                                        <span>
                                            {
                                                selectedCategory.code
                                            }
                                        </span>
                                    </div>

                                    <span
                                        className={
                                            selectedCategory.isActive !==
                                                false
                                                ? "expense-status-badge active"
                                                : "expense-status-badge inactive"
                                        }
                                    >
                                        {selectedCategory.isActive !==
                                            false
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                </div>

                                <div className="expense-view-grid">

                                    <div className="expense-view-item">
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {
                                                selectedCategory
                                                    ?.company
                                                    ?.name ||
                                                selectedCategory
                                                    ?.company
                                                    ?.legalName ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {
                                                selectedCategory
                                                    ?.branch
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Branch Code
                                        </span>

                                        <strong>
                                            {
                                                selectedCategory
                                                    ?.branch
                                                    ?.branchCode ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Parent Category
                                        </span>

                                        <strong>
                                            {selectedCategory
                                                ?.parentCategory
                                                ?.name ||
                                                "Root Category"}
                                        </strong>
                                    </div>

                                    <div className="expense-view-item full">
                                        <span>
                                            Description
                                        </span>

                                        <strong>
                                            {
                                                selectedCategory.description ||
                                                "No description"
                                            }
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Created By
                                        </span>

                                        <strong>
                                            {
                                                selectedCategory
                                                    ?.createdBy
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Updated By
                                        </span>

                                        <strong>
                                            {
                                                selectedCategory
                                                    ?.updatedBy
                                                    ?.name ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Created At
                                        </span>

                                        <strong>
                                            {selectedCategory.createdAt
                                                ? new Date(
                                                    selectedCategory.createdAt
                                                ).toLocaleString()
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div className="expense-view-item">
                                        <span>
                                            Updated At
                                        </span>

                                        <strong>
                                            {selectedCategory.updatedAt
                                                ? new Date(
                                                    selectedCategory.updatedAt
                                                ).toLocaleString()
                                                : "-"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            <div className="expense-categories-modal-footer">

                                <button
                                    type="button"
                                    className="expense-modal-cancel-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="expense-modal-save-btn"
                                    onClick={() => {
                                        closeViewModal();
                                        handleEdit(
                                            selectedCategory
                                        );
                                    }}
                                >
                                    <FiEdit2 />
                                    Edit Category
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
};

export default ExpenseCategories;