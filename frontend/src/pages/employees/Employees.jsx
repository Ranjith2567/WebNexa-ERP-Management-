import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiUser,
    FiMail,
    FiPhone,
    FiBriefcase,
    FiMapPin,
    FiCalendar,
    FiX,
    FiCheckCircle,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/employees.css";

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

const initialForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    branch: "",
    department: "",
    designation: "",
    role: "EMPLOYEE",
    joiningDate: "",
    dateOfBirth: "",
    gender: "",
    address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
    },
    isActive: true,
};

const getId = (value) => {
    if (!value) return "";

    if (typeof value === "object") {
        return value._id || value.id || "";
    }

    return value;
};

const getName = (value, fallback = "-") => {
    if (!value) return fallback;

    if (typeof value === "object") {
        return (
            value.name ||
            value.legalName ||
            value.branchCode ||
            value.code ||
            fallback
        );
    }

    return value;
};

const getDateInputValue = (date) => {
    if (!date) return "";

    try {
        return new Date(date).toISOString().split("T")[0];
    } catch {
        return "";
    }
};

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

const getInitials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);

    if (!parts.length) return "U";

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
};

const Employees = () => {
    const [employees, setEmployees] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [designationFilter, setDesignationFilter] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalEmployees: 0,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingEmployee, setEditingEmployee] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    /* =========================================
       LOAD EMPLOYEES
    ========================================= */

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                search: search.trim() || undefined,
                role: roleFilter || undefined,
                isActive:
                    statusFilter === ""
                        ? undefined
                        : statusFilter,
                company: companyFilter || undefined,
                branch: branchFilter || undefined,
                department: departmentFilter || undefined,
                designation: designationFilter || undefined,
                page,
                limit: 10,
            };

            const response = await api.get("/users", {
                params,
            });

            const data = response?.data;

            setEmployees(
                Array.isArray(data?.employees)
                    ? data.employees
                    : []
            );

            setPagination(
                data?.pagination || {
                    totalEmployees: 0,
                    currentPage: 1,
                    itemsPerPage: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                }
            );
        } catch (err) {
            console.error("Fetch employees error:", err);

            setError(
                err?.response?.data?.message ||
                    "Failed to load employees"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================================
       LOAD MASTER DATA
    ========================================= */

    const fetchMasterData = async () => {
        try {
            const [
                companiesResponse,
                branchesResponse,
                departmentsResponse,
                designationsResponse,
            ] = await Promise.all([
                api.get("/companies"),
                api.get("/branches"),
                api.get("/departments"),
                api.get("/designations"),
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

            setDepartments(
                extractArray(departmentsResponse, [
                    "departments",
                ])
            );

            setDesignations(
                extractArray(designationsResponse, [
                    "designations",
                ])
            );
        } catch (err) {
            console.error(
                "Fetch employee master data error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load employee master data"
            );
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [
        page,
        search,
        roleFilter,
        statusFilter,
        companyFilter,
        branchFilter,
        departmentFilter,
        designationFilter,
    ]);

    /* =========================================
       FORM HANDLERS
    ========================================= */

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith("address.")) {
            const field = name.split(".")[1];

            setFormData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    [field]: value,
                },
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditingEmployee(null);
    };

    /* =========================================
       OPEN CREATE
    ========================================= */

    const openCreateModal = () => {
        resetForm();
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =========================================
       OPEN EDIT
    ========================================= */

    const openEditModal = (employee) => {
        setEditingEmployee(employee);

        setFormData({
            name: employee?.name || "",
            email: employee?.email || "",
            password: "",
            phone: employee?.phone || "",

            company: getId(employee?.company),
            branch: getId(employee?.branch),

            department: getId(employee?.department),
            designation: getId(employee?.designation),

            role: employee?.role || "EMPLOYEE",

            joiningDate: getDateInputValue(
                employee?.joiningDate
            ),

            dateOfBirth: getDateInputValue(
                employee?.dateOfBirth
            ),

            gender: employee?.gender || "",

            address: {
                street:
                    employee?.address?.street || "",
                city:
                    employee?.address?.city || "",
                state:
                    employee?.address?.state || "",
                country:
                    employee?.address?.country ||
                    "India",
                pincode:
                    employee?.address?.pincode || "",
            },

            isActive:
                employee?.isActive !== false,
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =========================================
       OPEN VIEW
    ========================================= */

    const openViewModal = async (employee) => {
        try {
            setError("");

            const response = await api.get(
                `/users/${employee._id}`
            );

            setSelectedEmployee(
                response?.data?.employee ||
                    employee
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "Fetch employee details error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load employee details"
            );
        }
    };

    /* =========================================
       CLOSE MODAL
    ========================================= */

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        resetForm();
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedEmployee(null);
    };

    /* =========================================
       CREATE / UPDATE EMPLOYEE
    ========================================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (!formData.name.trim()) {
                setError("Employee name is required");
                return;
            }

            if (!formData.email.trim()) {
                setError("Email is required");
                return;
            }

            if (!editingEmployee && !formData.password) {
                setError("Password is required");
                return;
            }

            if (!formData.company) {
                setError("Company is required");
                return;
            }

            if (!formData.branch) {
                setError("Branch is required");
                return;
            }

            const basePayload = {
                name: formData.name.trim(),

                email: formData.email
                    .trim()
                    .toLowerCase(),

                phone: formData.phone.trim(),

                company: formData.company,

                branch: formData.branch,

                department:
                    formData.department || null,

                designation:
                    formData.designation || null,

                role: formData.role,

                joiningDate:
                    formData.joiningDate || null,

                dateOfBirth:
                    formData.dateOfBirth || null,

                gender: formData.gender || "",

                address: {
                    street:
                        formData.address.street.trim(),

                    city:
                        formData.address.city.trim(),

                    state:
                        formData.address.state.trim(),

                    country:
                        formData.address.country.trim() ||
                        "India",

                    pincode:
                        formData.address.pincode.trim(),
                },

                isActive: formData.isActive,
            };

            let response;

            if (editingEmployee) {
                response = await api.put(
                    `/users/${editingEmployee._id}`,
                    basePayload
                );

                setSuccess(
                    response?.data?.message ||
                        "Employee updated successfully"
                );
            } else {
                response = await api.post(
                    "/users",
                    {
                        ...basePayload,
                        password: formData.password,
                        permissions: [],
                    }
                );

                setSuccess(
                    response?.data?.message ||
                        "Employee created successfully"
                );
            }

            setShowModal(false);
            resetForm();

            await fetchEmployees();
        } catch (err) {
            console.error(
                "Save employee error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to save employee"
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================================
       DELETE EMPLOYEE
    ========================================= */

    const handleDelete = async (employee) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${employee?.name || "this employee"}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/users/${employee._id}`
            );

            setSuccess(
                "Employee deleted successfully"
            );

            if (
                employees.length === 1 &&
                page > 1
            ) {
                setPage((prev) => prev - 1);
            } else {
                await fetchEmployees();
            }
        } catch (err) {
            console.error(
                "Delete employee error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to delete employee"
            );
        }
    };

    /* =========================================
       FILTER HELPERS
    ========================================= */

    const filteredBranches = useMemo(() => {
        if (!formData.company) {
            return branches;
        }

        return branches.filter(
            (branch) =>
                getId(branch.company) ===
                formData.company
        );
    }, [branches, formData.company]);

    const filteredDepartments = useMemo(() => {
        if (!formData.company) {
            return departments;
        }

        return departments.filter(
            (department) =>
                getId(department.company) ===
                formData.company
        );
    }, [departments, formData.company]);

    const filteredDesignations = useMemo(() => {
        if (!formData.company) {
            return designations;
        }

        return designations.filter(
            (designation) =>
                getId(designation.company) ===
                formData.company
        );
    }, [
        designations,
        formData.company,
    ]);

    const handleCompanyChange = (e) => {
        const companyId = e.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            department: "",
            designation: "",
        }));
    };

    /* =========================================
       CLEAR FILTERS
    ========================================= */

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("");
        setStatusFilter("");
        setCompanyFilter("");
        setBranchFilter("");
        setDepartmentFilter("");
        setDesignationFilter("");
        setPage(1);
    };

    /* =========================================
       PAGINATION
    ========================================= */

    const goToPreviousPage = () => {
        if (pagination.hasPreviousPage) {
            setPage((prev) => prev - 1);
        }
    };

    const goToNextPage = () => {
        if (pagination.hasNextPage) {
            setPage((prev) => prev + 1);
        }
    };

    /* =========================================
       RENDER
    ========================================= */

    return (
        <div className="employees-page">

            {/* PAGE HEADER */}

            <div className="employees-page-header">
                <div>
                    <div className="employees-title-row">
                        <FiUser />

                        <div>
                            <h1>Employees</h1>

                            <p>
                                Manage employees,
                                roles and access
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="employees-add-btn"
                    onClick={openCreateModal}
                >
                    <FiPlus />
                    Add Employee
                </button>
            </div>

            {/* ALERTS */}

            {error && (
                <div className="employees-alert employees-alert-error">
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
                <div className="employees-alert employees-alert-success">
                    <FiCheckCircle />
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

            {/* FILTERS */}

            <div className="employees-filter-card">

                <div className="employees-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => {
                            setSearch(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(
                            e.target.value
                        );
                        setPage(1);
                    }}
                >
                    <option value="">
                        All Roles
                    </option>

                    {ROLES.map((role) => (
                        <option
                            key={role}
                            value={role}
                        >
                            {role.replace(
                                /_/g,
                                " "
                            )}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(
                            e.target.value
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

                <select
                    value={companyFilter}
                    onChange={(e) => {
                        setCompanyFilter(
                            e.target.value
                        );
                        setPage(1);
                    }}
                >
                    <option value="">
                        All Companies
                    </option>

                    {companies.map((company) => (
                        <option
                            key={company._id}
                            value={company._id}
                        >
                            {getName(company)}
                        </option>
                    ))}
                </select>

                <select
                    value={branchFilter}
                    onChange={(e) => {
                        setBranchFilter(
                            e.target.value
                        );
                        setPage(1);
                    }}
                >
                    <option value="">
                        All Branches
                    </option>

                    {branches.map((branch) => (
                        <option
                            key={branch._id}
                            value={branch._id}
                        >
                            {getName(branch)}
                        </option>
                    ))}
                </select>

                <select
                    value={departmentFilter}
                    onChange={(e) => {
                        setDepartmentFilter(
                            e.target.value
                        );
                        setPage(1);
                    }}
                >
                    <option value="">
                        All Departments
                    </option>

                    {departments.map(
                        (department) => (
                            <option
                                key={
                                    department._id
                                }
                                value={
                                    department._id
                                }
                            >
                                {getName(
                                    department
                                )}
                            </option>
                        )
                    )}
                </select>

                <select
                    value={designationFilter}
                    onChange={(e) => {
                        setDesignationFilter(
                            e.target.value
                        );
                        setPage(1);
                    }}
                >
                    <option value="">
                        All Designations
                    </option>

                    {designations.map(
                        (designation) => (
                            <option
                                key={
                                    designation._id
                                }
                                value={
                                    designation._id
                                }
                            >
                                {getName(
                                    designation
                                )}
                            </option>
                        )
                    )}
                </select>

                <button
                    className="employees-clear-btn"
                    onClick={clearFilters}
                >
                    Clear
                </button>
            </div>

            {/* SUMMARY */}

            <div className="employees-summary">
                <div>
                    <span>Total Employees</span>
                    <strong>
                        {pagination.totalEmployees ||
                            0}
                    </strong>
                </div>

                <div>
                    <span>Current Page</span>
                    <strong>
                        {pagination.currentPage ||
                            1}
                    </strong>
                </div>

                <div>
                    <span>Per Page</span>
                    <strong>
                        {pagination.itemsPerPage ||
                            10}
                    </strong>
                </div>
            </div>

            {/* EMPLOYEE GRID */}

            {loading ? (
                <div className="employees-loading">
                    <FiRefreshCw className="spin" />
                    <span>
                        Loading employees...
                    </span>
                </div>
            ) : employees.length === 0 ? (
                <div className="employees-empty">
                    <FiUser />

                    <h3>
                        No employees found
                    </h3>

                    <p>
                        Try changing your
                        filters or add a new
                        employee.
                    </p>

                    <button
                        onClick={
                            openCreateModal
                        }
                    >
                        <FiPlus />
                        Add Employee
                    </button>
                </div>
            ) : (
                <div className="employees-grid">

                    {employees.map(
                        (employee) => (
                            <div
                                className="employee-card"
                                key={
                                    employee._id
                                }
                            >

                                <div className="employee-card-top">

                                    <div className="employee-avatar">
                                        {getInitials(
                                            employee.name
                                        )}
                                    </div>

                                    <div className="employee-card-main">

                                        <div className="employee-name-row">
                                            <h3>
                                                {
                                                    employee.name
                                                }
                                            </h3>

                                            <span
                                                className={
                                                    employee.isActive
                                                        ? "employee-status active"
                                                        : "employee-status inactive"
                                                }
                                            >
                                                {employee.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </div>

                                        <span className="employee-id">
                                            {employee.employeeId ||
                                                "No Employee ID"}
                                        </span>

                                    </div>
                                </div>

                                <div className="employee-info">

                                    <div>
                                        <FiMail />

                                        <span>
                                            {
                                                employee.email
                                            }
                                        </span>
                                    </div>

                                    <div>
                                        <FiPhone />

                                        <span>
                                            {employee.phone ||
                                                "No phone"}
                                        </span>
                                    </div>

                                    <div>
                                        <FiBriefcase />

                                        <span>
                                            {employee.role?.replace(
                                                /_/g,
                                                " "
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <FiUser />

                                        <span>
                                            {getName(
                                                employee.department,
                                                "No department"
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <FiBriefcase />

                                        <span>
                                            {getName(
                                                employee.designation,
                                                "No designation"
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <FiMapPin />

                                        <span>
                                            {getName(
                                                employee.branch,
                                                "No branch"
                                            )}
                                        </span>
                                    </div>

                                </div>

                                <div className="employee-card-footer">

                                    <button
                                        className="employee-view-btn"
                                        onClick={() =>
                                            openViewModal(
                                                employee
                                            )
                                        }
                                    >
                                        <FiEye />
                                        View
                                    </button>

                                    <button
                                        className="employee-edit-btn"
                                        onClick={() =>
                                            openEditModal(
                                                employee
                                            )
                                        }
                                    >
                                        <FiEdit2 />
                                        Edit
                                    </button>

                                    <button
                                        className="employee-delete-btn"
                                        onClick={() =>
                                            handleDelete(
                                                employee
                                            )
                                        }
                                    >
                                        <FiTrash2 />
                                    </button>

                                </div>
                            </div>
                        )
                    )}

                </div>
            )}

            {/* PAGINATION */}

            {!loading &&
                employees.length > 0 && (
                    <div className="employees-pagination">

                        <button
                            onClick={
                                goToPreviousPage
                            }
                            disabled={
                                !pagination.hasPreviousPage
                            }
                        >
                            <FiChevronLeft />
                            Previous
                        </button>

                        <span>
                            Page{" "}
                            <strong>
                                {pagination.currentPage ||
                                    page}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {pagination.totalPages ||
                                    1}
                            </strong>
                        </span>

                        <button
                            onClick={
                                goToNextPage
                            }
                            disabled={
                                !pagination.hasNextPage
                            }
                        >
                            Next
                            <FiChevronRight />
                        </button>

                    </div>
                )}

            {/* CREATE / EDIT MODAL */}

            {showModal && (
                <div className="employees-modal-overlay">

                    <div className="employees-modal">

                        <div className="employees-modal-header">

                            <div>
                                <h2>
                                    {editingEmployee
                                        ? "Edit Employee"
                                        : "Add Employee"}
                                </h2>

                                <p>
                                    {editingEmployee
                                        ? "Update employee information"
                                        : "Create a new employee account"}
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

                            <div className="employees-modal-body">

                                {/* BASIC INFORMATION */}

                                <div className="employees-form-section">

                                    <div className="employees-form-section-title">
                                        <FiUser />
                                        <span>
                                            Basic Information
                                        </span>
                                    </div>

                                    <div className="employees-form-grid">

                                        <div className="employees-form-group">
                                            <label>
                                                Full Name *
                                            </label>

                                            <input
                                                name="name"
                                                value={
                                                    formData.name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Email *
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                value={
                                                    formData.email
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter email"
                                                required
                                            />
                                        </div>

                                        {!editingEmployee && (
                                            <div className="employees-form-group">
                                                <label>
                                                    Password *
                                                </label>

                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={
                                                        formData.password
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Enter password"
                                                    minLength={
                                                        6
                                                    }
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className="employees-form-group">
                                            <label>
                                                Phone
                                            </label>

                                            <input
                                                type="text"
                                                name="phone"
                                                value={
                                                    formData.phone
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter phone number"
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Role *
                                            </label>

                                            <select
                                                name="role"
                                                value={
                                                    formData.role
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                            >
                                                {ROLES.map(
                                                    (
                                                        role
                                                    ) => (
                                                        <option
                                                            key={
                                                                role
                                                            }
                                                            value={
                                                                role
                                                            }
                                                        >
                                                            {role.replace(
                                                                /_/g,
                                                                " "
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Gender
                                            </label>

                                            <select
                                                name="gender"
                                                value={
                                                    formData.gender
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >
                                                <option value="">
                                                    Select
                                                </option>

                                                <option value="MALE">
                                                    Male
                                                </option>

                                                <option value="FEMALE">
                                                    Female
                                                </option>

                                                <option value="OTHER">
                                                    Other
                                                </option>
                                            </select>
                                        </div>

                                    </div>
                                </div>

                                {/* ORGANIZATION */}

                                <div className="employees-form-section">

                                    <div className="employees-form-section-title">
                                        <FiBriefcase />
                                        <span>
                                            Organization
                                        </span>
                                    </div>

                                    <div className="employees-form-grid">

                                        <div className="employees-form-group">
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

                                        <div className="employees-form-group">
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

                                                {filteredBranches.map(
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
                                                            {getName(
                                                                branch
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Department
                                            </label>

                                            <select
                                                name="department"
                                                value={
                                                    formData.department
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >
                                                <option value="">
                                                    Select Department
                                                </option>

                                                {filteredDepartments.map(
                                                    (
                                                        department
                                                    ) => (
                                                        <option
                                                            key={
                                                                department._id
                                                            }
                                                            value={
                                                                department._id
                                                            }
                                                        >
                                                            {getName(
                                                                department
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Designation
                                            </label>

                                            <select
                                                name="designation"
                                                value={
                                                    formData.designation
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >
                                                <option value="">
                                                    Select Designation
                                                </option>

                                                {filteredDesignations.map(
                                                    (
                                                        designation
                                                    ) => (
                                                        <option
                                                            key={
                                                                designation._id
                                                            }
                                                            value={
                                                                designation._id
                                                            }
                                                        >
                                                            {getName(
                                                                designation
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                    </div>
                                </div>

                                {/* DATES */}

                                <div className="employees-form-section">

                                    <div className="employees-form-section-title">
                                        <FiCalendar />
                                        <span>
                                            Employment Details
                                        </span>
                                    </div>

                                    <div className="employees-form-grid">

                                        <div className="employees-form-group">
                                            <label>
                                                Joining Date
                                            </label>

                                            <input
                                                type="date"
                                                name="joiningDate"
                                                value={
                                                    formData.joiningDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Date of Birth
                                            </label>

                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={
                                                    formData.dateOfBirth
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* ADDRESS */}

                                <div className="employees-form-section">

                                    <div className="employees-form-section-title">
                                        <FiMapPin />
                                        <span>
                                            Address
                                        </span>
                                    </div>

                                    <div className="employees-form-grid">

                                        <div className="employees-form-group employees-form-full">
                                            <label>
                                                Street
                                            </label>

                                            <input
                                                name="address.street"
                                                value={
                                                    formData
                                                        .address
                                                        .street
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Street / Area"
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                City
                                            </label>

                                            <input
                                                name="address.city"
                                                value={
                                                    formData
                                                        .address
                                                        .city
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="City"
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                State
                                            </label>

                                            <input
                                                name="address.state"
                                                value={
                                                    formData
                                                        .address
                                                        .state
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="State"
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Country
                                            </label>

                                            <input
                                                name="address.country"
                                                value={
                                                    formData
                                                        .address
                                                        .country
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />
                                        </div>

                                        <div className="employees-form-group">
                                            <label>
                                                Pincode
                                            </label>

                                            <input
                                                name="address.pincode"
                                                value={
                                                    formData
                                                        .address
                                                        .pincode
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                maxLength={
                                                    6
                                                }
                                                placeholder="6 digit pincode"
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* STATUS */}

                                {editingEmployee && (
                                    <div className="employees-form-section">

                                        <div className="employees-active-toggle">

                                            <div>
                                                <strong>
                                                    Employee Status
                                                </strong>

                                                <span>
                                                    Allow this employee
                                                    to remain active
                                                </span>
                                            </div>

                                            <label className="employees-switch">

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

                                                <span className="employees-slider"></span>

                                            </label>

                                        </div>

                                    </div>
                                )}

                            </div>

                            {/* MODAL FOOTER */}

                            <div className="employees-modal-footer">

                                <button
                                    type="button"
                                    className="employees-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="employees-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <FiRefreshCw className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle />
                                            {editingEmployee
                                                ? "Update Employee"
                                                : "Create Employee"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* VIEW MODAL */}

            {showViewModal &&
                selectedEmployee && (
                    <div className="employees-modal-overlay">

                        <div className="employees-view-modal">

                            <div className="employees-modal-header">

                                <div>
                                    <h2>
                                        Employee Details
                                    </h2>

                                    <p>
                                        Complete employee
                                        information
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

                            <div className="employees-view-body">

                                <div className="employees-view-profile">

                                    <div className="employees-view-avatar">
                                        {getInitials(
                                            selectedEmployee.name
                                        )}
                                    </div>

                                    <div>
                                        <h2>
                                            {
                                                selectedEmployee.name
                                            }
                                        </h2>

                                        <span>
                                            {selectedEmployee.employeeId ||
                                                "No Employee ID"}
                                        </span>
                                    </div>

                                </div>

                                <div className="employees-view-grid">

                                    <div>
                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {
                                                selectedEmployee.email
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {selectedEmployee.phone ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Role
                                        </span>

                                        <strong>
                                            {selectedEmployee.role?.replace(
                                                /_/g,
                                                " "
                                            ) || "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedEmployee.company
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedEmployee.branch
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Department
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedEmployee.department
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Designation
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedEmployee.designation
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Gender
                                        </span>

                                        <strong>
                                            {selectedEmployee.gender ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Joining Date
                                        </span>

                                        <strong>
                                            {selectedEmployee.joiningDate
                                                ? new Date(
                                                      selectedEmployee.joiningDate
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Date of Birth
                                        </span>

                                        <strong>
                                            {selectedEmployee.dateOfBirth
                                                ? new Date(
                                                      selectedEmployee.dateOfBirth
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong
                                            className={
                                                selectedEmployee.isActive
                                                    ? "view-status-active"
                                                    : "view-status-inactive"
                                            }
                                        >
                                            {selectedEmployee.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </strong>
                                    </div>

                                </div>

                                <div className="employees-view-address">

                                    <div className="employees-view-section-title">
                                        <FiMapPin />
                                        <span>
                                            Address
                                        </span>
                                    </div>

                                    <p>
                                        {selectedEmployee
                                            .address
                                            ?.street ||
                                            "-"}
                                    </p>

                                    <p>
                                        {[
                                            selectedEmployee
                                                .address
                                                ?.city,
                                            selectedEmployee
                                                .address
                                                ?.state,
                                            selectedEmployee
                                                .address
                                                ?.country,
                                            selectedEmployee
                                                .address
                                                ?.pincode,
                                        ]
                                            .filter(Boolean)
                                            .join(
                                                ", "
                                            ) ||
                                            "-"}
                                    </p>

                                </div>

                            </div>

                            <div className="employees-modal-footer">

                                <button
                                    type="button"
                                    className="employees-cancel-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="employees-save-btn"
                                    onClick={() => {
                                        closeViewModal();

                                        openEditModal(
                                            selectedEmployee
                                        );
                                    }}
                                >
                                    <FiEdit2 />
                                    Edit Employee
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
};

export default Employees;