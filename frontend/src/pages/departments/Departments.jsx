import React, { useEffect, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiUsers,
    FiGitBranch,
    FiBriefcase,
    FiCheckCircle,
    FiXCircle,
    FiRefreshCw,
    FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/departments.css";

const initialForm = {
    company: "",
    branch: "",
    name: "",
    code: "",
    description: "",
    head: "",
    isActive: true,
};

const ROLES = [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "HR",
    "SALES",
    "PURCHASE",
    "INVENTORY",
    "ACCOUNTANT",
    "EMPLOYEE",
];

// ==========================================
// HELPERS
// ==========================================

const extractArray = (response, keys = []) => {
    const data = response?.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
};

const getId = (value) => {
    if (!value) return "";

    if (typeof value === "object") {
        return value._id || value.id || "";
    }

    return value;
};

const getName = (value, fallback = "—") => {
    if (!value) return fallback;

    if (typeof value === "string") {
        return value;
    }

    return (
        value.name ||
        value.legalName ||
        value.employeeId ||
        value.email ||
        fallback
    );
};

const getInitials = (name = "") => {
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();

    return initials || "D";
};

// ==========================================
// COMPONENT
// ==========================================

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        totalDepartments: 0,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingDepartment, setEditingDepartment] =
        useState(null);

    const [selectedDepartment, setSelectedDepartment] =
        useState(null);

    const [formData, setFormData] =
        useState(initialForm);

    // ==========================================
    // FETCH MASTER DATA
    // ==========================================

    const fetchMasterData = async () => {
        try {
            const [
                companiesResponse,
                branchesResponse,
                employeesResponse,
            ] = await Promise.all([
                api.get("/companies"),
                api.get("/branches"),
                api.get("/users", {
                    params: {
                        limit: 100,
                        isActive: true,
                    },
                }),
            ]);

            setCompanies(
                extractArray(companiesResponse, [
                    "companies",
                ])
            );

            setBranches(
                extractArray(branchesResponse, [
                    "branches",
                ])
            );

            setEmployees(
                extractArray(employeesResponse, [
                    "employees",
                    "users",
                ])
            );
        } catch (err) {
            console.error(
                "Fetch Department Master Data Error:",
                err
            );
        }
    };

    // ==========================================
    // FETCH DEPARTMENTS
    // ==========================================

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                search: search.trim(),
                page,
                limit: 10,
            };

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
                "/departments",
                {
                    params,
                }
            );

            const data = response?.data;

            setDepartments(
                Array.isArray(data?.departments)
                    ? data.departments
                    : []
            );

            if (data?.pagination) {
                setPagination(
                    data.pagination
                );
            } else {
                setPagination({
                    totalDepartments:
                        Array.isArray(
                            data?.departments
                        )
                            ? data.departments.length
                            : 0,
                    currentPage: page,
                    itemsPerPage: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: page > 1,
                });
            }
        } catch (err) {
            console.error(
                "Fetch Departments Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to fetch departments"
            );

            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // INITIAL MASTER DATA
    // ==========================================

    useEffect(() => {
        fetchMasterData();
    }, []);

    // ==========================================
    // FETCH WHEN FILTER/PAGE CHANGES
    // ==========================================

    useEffect(() => {
        fetchDepartments();
    }, [
        page,
        search,
        companyFilter,
        branchFilter,
        statusFilter,
    ]);

    // ==========================================
    // HANDLE FORM CHANGE
    // ==========================================

    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // ==========================================
    // COMPANY CHANGE
    // ==========================================

    const handleCompanyChange = (event) => {
        const companyId =
            event.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            head: "",
        }));
    };

    // ==========================================
    // OPEN CREATE MODAL
    // ==========================================

    const openCreateModal = () => {
        setEditingDepartment(null);
        setFormData({
            ...initialForm,
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // ==========================================
    // OPEN EDIT MODAL
    // ==========================================

    const openEditModal = (department) => {
        setEditingDepartment(department);

        setFormData({
            company: getId(
                department.company
            ),

            branch: getId(
                department.branch
            ),

            name: department.name || "",

            code: department.code || "",

            description:
                department.description || "",

            head: getId(
                department.head
            ),

            isActive:
                department.isActive !== false,
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // ==========================================
    // CLOSE CREATE / EDIT MODAL
    // ==========================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);

        setEditingDepartment(null);

        setFormData({
            ...initialForm,
        });
    };

    // ==========================================
    // VIEW DEPARTMENT
    // ==========================================

    const handleView = async (
        department
    ) => {
        try {
            setError("");

            const response =
                await api.get(
                    `/departments/${department._id}`
                );

            setSelectedDepartment(
                response?.data?.department ||
                    department
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View Department Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to fetch department"
            );
        }
    };

    // ==========================================
    // CREATE / UPDATE
    // ==========================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.company) {
            setError(
                "Please select a company"
            );
            return;
        }

        if (!formData.name.trim()) {
            setError(
                "Department name is required"
            );
            return;
        }

        if (!formData.code.trim()) {
            setError(
                "Department code is required"
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                company:
                    formData.company,

                branch:
                    formData.branch || null,

                name:
                    formData.name.trim(),

                code:
                    formData.code
                        .trim()
                        .toUpperCase(),

                description:
                    formData.description
                        .trim(),

                head:
                    formData.head || null,

                isActive:
                    formData.isActive,
            };

            if (editingDepartment) {
                const response =
                    await api.put(
                        `/departments/${editingDepartment._id}`,
                        payload
                    );

                setSuccess(
                    response?.data?.message ||
                        "Department updated successfully"
                );
            } else {
                const response =
                    await api.post(
                        "/departments",
                        payload
                    );

                setSuccess(
                    response?.data?.message ||
                        "Department created successfully"
                );
            }

            setShowModal(false);

            setEditingDepartment(null);

            setFormData({
                ...initialForm,
            });

            await fetchDepartments();
        } catch (err) {
            console.error(
                "Save Department Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to save department"
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE
    // ==========================================

    const handleDelete = async (
        department
    ) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${department.name}"?`
            );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            const response =
                await api.delete(
                    `/departments/${department._id}`
                );

            setSuccess(
                response?.data?.message ||
                    "Department deleted successfully"
            );

            if (
                departments.length === 1 &&
                page > 1
            ) {
                setPage(
                    (prev) =>
                        Math.max(
                            prev - 1,
                            1
                        )
                );
            } else {
                await fetchDepartments();
            }
        } catch (err) {
            console.error(
                "Delete Department Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to delete department"
            );
        }
    };

    // ==========================================
    // AVAILABLE BRANCHES
    // ==========================================

    const availableBranches =
        branches.filter(
            (branch) => {
                const branchCompany =
                    getId(
                        branch.company
                    );

                return (
                    !formData.company ||
                    !branchCompany ||
                    branchCompany ===
                        formData.company
                );
            }
        );

    // ==========================================
    // AVAILABLE EMPLOYEES / HEADS
    // ==========================================

    const availableEmployees =
        employees.filter(
            (employee) => {
                const employeeCompany =
                    getId(
                        employee.company
                    );

                return (
                    !formData.company ||
                    !employeeCompany ||
                    employeeCompany ===
                        formData.company
                );
            }
        );

    // ==========================================
    // FILTER BRANCHES
    // ==========================================

    const filterBranches =
        branches.filter(
            (branch) => {
                const branchCompany =
                    getId(
                        branch.company
                    );

                return (
                    !companyFilter ||
                    !branchCompany ||
                    branchCompany ===
                        companyFilter
                );
            }
        );

    // ==========================================
    // SUMMARY COUNTS
    // ==========================================

    const activeCount =
        departments.filter(
            (department) =>
                department.isActive
        ).length;

    const inactiveCount =
        departments.filter(
            (department) =>
                !department.isActive
        ).length;

    return (
        <div className="departments-page">

            {/* ======================================
                HEADER
            ====================================== */}

            <div className="departments-header">

                <div className="departments-title-row">

                    <div className="departments-title-icon">
                        <FiUsers />
                    </div>

                    <div>
                        <h1>
                            Departments
                        </h1>

                        <p>
                            Manage company
                            departments and
                            department heads
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="department-add-btn"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus />
                    Add Department
                </button>

            </div>

            {/* ======================================
                ERROR
            ====================================== */}

            {error && (
                <div className="department-alert department-alert-error">

                    <FiXCircle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <FiX />
                    </button>

                </div>
            )}

            {/* ======================================
                SUCCESS
            ====================================== */}

            {success && (
                <div className="department-alert department-alert-success">

                    <FiCheckCircle />

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <FiX />
                    </button>

                </div>
            )}

            {/* ======================================
                SUMMARY
            ====================================== */}

            <div className="department-summary-grid">

                <div className="department-summary-card">

                    <div className="department-summary-icon total">
                        <FiUsers />
                    </div>

                    <div>
                        <span>
                            Total Departments
                        </span>

                        <strong>
                            {
                                pagination.totalDepartments ||
                                0
                            }
                        </strong>
                    </div>

                </div>

                <div className="department-summary-card">

                    <div className="department-summary-icon active">
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

                <div className="department-summary-card">

                    <div className="department-summary-icon inactive">
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

            </div>

            {/* ======================================
                FILTERS
            ====================================== */}

            <div className="departments-filter-card">

                <div className="department-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search department, code or description..."
                        value={search}
                        onChange={(event) => {
                            setPage(1);
                            setSearch(
                                event.target.value
                            );
                        }}
                    />

                </div>

                <div className="department-filter-group">

                    <select
                        value={
                            companyFilter
                        }
                        onChange={(event) => {
                            setPage(1);

                            setCompanyFilter(
                                event.target.value
                            );

                            setBranchFilter("");
                        }}
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
                                    {getName(
                                        company
                                    )}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={
                            branchFilter
                        }
                        onChange={(event) => {
                            setPage(1);

                            setBranchFilter(
                                event.target.value
                            );
                        }}
                    >
                        <option value="">
                            All Branches
                        </option>

                        {filterBranches.map(
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

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(event) => {
                            setPage(1);

                            setStatusFilter(
                                event.target.value
                            );
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

                    <button
                        type="button"
                        className="department-refresh-btn"
                        onClick={
                            fetchDepartments
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "department-spin"
                                    : ""
                            }
                        />
                    </button>

                </div>

            </div>

            {/* ======================================
                DEPARTMENT CONTENT
            ====================================== */}

            <div className="departments-content">

                {loading ? (
                    <div className="departments-loading">

                        <FiRefreshCw className="department-spin" />

                        <span>
                            Loading departments...
                        </span>

                    </div>
                ) : departments.length ===
                  0 ? (
                    <div className="departments-empty">

                        <div className="department-empty-icon">
                            <FiUsers />
                        </div>

                        <h3>
                            No departments found
                        </h3>

                        <p>
                            Create your first
                            department to get
                            started.
                        </p>

                        <button
                            type="button"
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />
                            Add Department
                        </button>

                    </div>
                ) : (
                    <div className="departments-grid">

                        {departments.map(
                            (department) => (
                                <div
                                    className="department-card"
                                    key={
                                        department._id
                                    }
                                >

                                    {/* CARD HEADER */}

                                    <div className="department-card-header">

                                        <div className="department-avatar">
                                            {getInitials(
                                                department.name
                                            )}
                                        </div>

                                        <div className="department-card-title">

                                            <h3>
                                                {
                                                    department.name
                                                }
                                            </h3>

                                            <span>
                                                {
                                                    department.code
                                                }
                                            </span>

                                        </div>

                                        <div
                                            className={`department-status ${
                                                department.isActive
                                                    ? "active"
                                                    : "inactive"
                                            }`}
                                        >
                                            {department.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </div>

                                    </div>

                                    {/* CARD BODY */}

                                    <div className="department-card-body">

                                        <div className="department-info-row">

                                            <FiBriefcase />

                                            <div>
                                                <span>
                                                    Company
                                                </span>

                                                <strong>
                                                    {getName(
                                                        department.company
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="department-info-row">

                                            <FiGitBranch />

                                            <div>
                                                <span>
                                                    Branch
                                                </span>

                                                <strong>
                                                    {getName(
                                                        department.branch,
                                                        "All Branches"
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="department-info-row">

                                            <FiUsers />

                                            <div>
                                                <span>
                                                    Department Head
                                                </span>

                                                <strong>
                                                    {getName(
                                                        department.head,
                                                        "Not Assigned"
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        {department.description && (
                                            <div className="department-description">
                                                {
                                                    department.description
                                                }
                                            </div>
                                        )}

                                    </div>

                                    {/* CARD FOOTER */}

                                    <div className="department-card-footer">

                                        <button
                                            type="button"
                                            className="department-view-btn"
                                            onClick={() =>
                                                handleView(
                                                    department
                                                )
                                            }
                                        >
                                            <FiEye />
                                            View
                                        </button>

                                        <button
                                            type="button"
                                            className="department-edit-btn"
                                            onClick={() =>
                                                openEditModal(
                                                    department
                                                )
                                            }
                                        >
                                            <FiEdit2 />
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="department-delete-btn"
                                            onClick={() =>
                                                handleDelete(
                                                    department
                                                )
                                            }
                                            title="Delete Department"
                                        >
                                            <FiTrash2 />
                                        </button>

                                    </div>

                                </div>
                            )
                        )}

                    </div>
                )}

            </div>

            {/* ======================================
                PAGINATION
            ====================================== */}

            {!loading &&
                departments.length > 0 &&
                pagination.totalPages > 0 && (
                    <div className="departments-pagination">

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
                                    pagination.totalPages
                                }
                            </strong>
                        </span>

                        <div>

                            <button
                                type="button"
                                disabled={
                                    !pagination.hasPreviousPage
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
                                Next
                            </button>

                        </div>

                    </div>
                )}

            {/* ======================================
                CREATE / EDIT MODAL
            ====================================== */}

            {showModal && (
                <div className="department-modal-overlay">

                    <div className="department-modal">

                        <div className="department-modal-header">

                            <div>
                                <h2>
                                    {editingDepartment
                                        ? "Edit Department"
                                        : "Add Department"}
                                </h2>

                                <p>
                                    {editingDepartment
                                        ? "Update department details"
                                        : "Create a new department"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
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

                            <div className="department-modal-body">

                                <div className="department-form-grid">

                                    {/* COMPANY */}

                                    <div className="department-form-group">

                                        <label>
                                            Company
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
                                                handleCompanyChange
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
                                                        {getName(
                                                            company
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                    {/* BRANCH */}

                                    <div className="department-form-group">

                                        <label>
                                            Branch
                                        </label>

                                        <select
                                            name="branch"
                                            value={
                                                formData.branch
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                !formData.company
                                            }
                                        >
                                            <option value="">
                                                All Branches
                                            </option>

                                            {availableBranches.map(
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

                                    {/* NAME */}

                                    <div className="department-form-group">

                                        <label>
                                            Department Name
                                            <span>
                                                *
                                            </span>
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
                                            placeholder="e.g. Engineering"
                                            maxLength={
                                                100
                                            }
                                            required
                                        />

                                    </div>

                                    {/* CODE */}

                                    <div className="department-form-group">

                                        <label>
                                            Department Code
                                            <span>
                                                *
                                            </span>
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
                                            placeholder="e.g. ENG"
                                            maxLength={
                                                30
                                            }
                                            style={{
                                                textTransform:
                                                    "uppercase",
                                            }}
                                            required
                                        />

                                    </div>

                                    {/* HEAD */}

                                    <div className="department-form-group department-form-full">

                                        <label>
                                            Department Head
                                        </label>

                                        <select
                                            name="head"
                                            value={
                                                formData.head
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                !formData.company
                                            }
                                        >
                                            <option value="">
                                                Select Department Head
                                            </option>

                                            {availableEmployees.map(
                                                (
                                                    employee
                                                ) => (
                                                    <option
                                                        key={
                                                            employee._id
                                                        }
                                                        value={
                                                            employee._id
                                                        }
                                                    >
                                                        {
                                                            employee.name
                                                        }

                                                        {employee.employeeId
                                                            ? ` (${employee.employeeId})`
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                    {/* DESCRIPTION */}

                                    <div className="department-form-group department-form-full">

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
                                            placeholder="Enter department description..."
                                            rows="4"
                                            maxLength={
                                                500
                                            }
                                        />

                                        <small className="department-character-count">
                                            {
                                                formData
                                                    .description
                                                    .length
                                            }
                                            /500
                                        </small>

                                    </div>

                                    {/* ACTIVE */}

                                    <div className="department-form-group department-form-full">

                                        <label className="department-checkbox-label">

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
                                                Department
                                                is active
                                            </span>

                                        </label>

                                    </div>

                                </div>

                            </div>

                            {/* MODAL FOOTER */}

                            <div className="department-modal-footer">

                                <button
                                    type="button"
                                    className="department-cancel-btn"
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
                                    className="department-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FiRefreshCw className="department-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle />

                                            {editingDepartment
                                                ? "Update Department"
                                                : "Create Department"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ======================================
                VIEW MODAL
            ====================================== */}

            {showViewModal &&
                selectedDepartment && (
                    <div className="department-modal-overlay">

                        <div className="department-view-modal">

                            <div className="department-modal-header">

                                <div>
                                    <h2>
                                        Department Details
                                    </h2>

                                    <p>
                                        View department
                                        information
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
                                    <FiX />
                                </button>

                            </div>

                            <div className="department-view-body">

                                <div className="department-view-profile">

                                    <div className="department-view-avatar">
                                        {getInitials(
                                            selectedDepartment.name
                                        )}
                                    </div>

                                    <div>
                                        <h3>
                                            {
                                                selectedDepartment.name
                                            }
                                        </h3>

                                        <span>
                                            {
                                                selectedDepartment.code
                                            }
                                        </span>
                                    </div>

                                    <div
                                        className={`department-status ${
                                            selectedDepartment.isActive
                                                ? "active"
                                                : "inactive"
                                        }`}
                                    >
                                        {selectedDepartment.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </div>

                                </div>

                                <div className="department-view-grid">

                                    <div>
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedDepartment.company
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedDepartment.branch,
                                                "All Branches"
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Department Head
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedDepartment.head,
                                                "Not Assigned"
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Head Email
                                        </span>

                                        <strong>
                                            {selectedDepartment
                                                .head
                                                ?.email ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="department-view-full">
                                        <span>
                                            Description
                                        </span>

                                        <strong>
                                            {selectedDepartment.description ||
                                                "No description provided"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            <div className="department-modal-footer">

                                <button
                                    type="button"
                                    className="department-cancel-btn"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="department-save-btn"
                                    onClick={() => {
                                        setShowViewModal(
                                            false
                                        );

                                        openEditModal(
                                            selectedDepartment
                                        );
                                    }}
                                >
                                    <FiEdit2 />
                                    Edit Department
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
};

export default Departments;