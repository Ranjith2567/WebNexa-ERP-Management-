import { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiBriefcase,
    FiCode,
    FiLayers,
    FiCheckCircle,
    FiXCircle,
    FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/designations.css";

/* =====================================================
   HELPERS
===================================================== */

const extractArray = (response, keys = []) => {
    const data = response?.data;

    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
};

const getId = (value) => {
    if (!value) return "";
    return value?._id || value?.id || value;
};

const getName = (value, fallback = "—") => {
    if (!value) return fallback;

    if (typeof value === "string") {
        return value;
    }

    return (
        value.name ||
        value.legalName ||
        value.fullName ||
        fallback
    );
};

const getInitials = (name = "") => {
    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) return "D";

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
};

/* =====================================================
   INITIAL FORM
===================================================== */

const initialFormData = {
    company: "",
    name: "",
    code: "",
    description: "",
    level: 1,
    isActive: true,
};

/* =====================================================
   COMPONENT
===================================================== */

function Designations() {
    /* =====================================================
       DATA
    ===================================================== */

    const [designations, setDesignations] = useState([]);
    const [companies, setCompanies] = useState([]);

    /* =====================================================
       UI STATE
    ===================================================== */

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] =
        useState("");
    const [statusFilter, setStatusFilter] =
        useState("");

    /* =====================================================
       PAGINATION
    ===================================================== */

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        totalDesignations: 0,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    /* =====================================================
       MODALS
    ===================================================== */

    const [showModal, setShowModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [editingDesignation, setEditingDesignation] =
        useState(null);

    const [selectedDesignation, setSelectedDesignation] =
        useState(null);

    /* =====================================================
       FORM
    ===================================================== */

    const [formData, setFormData] =
        useState(initialFormData);

    /* =====================================================
       FETCH COMPANIES
    ===================================================== */

    const fetchCompanies = async () => {
        try {
            const response =
                await api.get("/companies");

            const companyList = extractArray(
                response,
                ["companies"]
            );

            setCompanies(companyList);
        } catch (err) {
            console.error(
                "Fetch Companies Error:",
                err
            );

            setCompanies([]);
        }
    };

    /* =====================================================
       FETCH DESIGNATIONS
    ===================================================== */

    const fetchDesignations = async (
        requestedPage = page
    ) => {
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

            if (companyFilter) {
                params.company = companyFilter;
            }

            if (statusFilter !== "") {
                params.isActive = statusFilter;
            }

            const response =
                await api.get(
                    "/designations",
                    { params }
                );

            const designationList =
                extractArray(
                    response,
                    ["designations"]
                );

            setDesignations(
                designationList
            );

            setPagination(
                response?.data?.pagination || {
                    totalDesignations:
                        designationList.length,
                    currentPage:
                        requestedPage,
                    itemsPerPage: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                }
            );
        } catch (err) {
            console.error(
                "Fetch Designations Error:",
                err
            );

            setDesignations([]);

            setError(
                err?.response?.data?.message ||
                    "Failed to fetch designations"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        fetchDesignations(page);
    }, [
        page,
        companyFilter,
        statusFilter,
    ]);

    /* =====================================================
       SEARCH DEBOUNCE
    ===================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchDesignations(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

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
                    : name === "level"
                    ? Number(value)
                    : value,
        }));
    };

    /* =====================================================
       OPEN CREATE
    ===================================================== */

    const handleCreate = () => {
        setEditingDesignation(null);

        setFormData({
            ...initialFormData,
            company:
                companyFilter || "",
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    /* =====================================================
       OPEN EDIT
    ===================================================== */

    const handleEdit = (designation) => {
        setEditingDesignation(
            designation
        );

        setFormData({
            company:
                getId(
                    designation.company
                ),
            name:
                designation.name || "",
            code:
                designation.code || "",
            description:
                designation.description ||
                "",
            level:
                designation.level || 1,
            isActive:
                designation.isActive !== false,
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    /* =====================================================
       OPEN VIEW
    ===================================================== */

    const handleView = async (
        designation
    ) => {
        try {
            setError("");

            const id =
                getId(designation);

            const response =
                await api.get(
                    `/designations/${id}`
                );

            setSelectedDesignation(
                response?.data?.designation ||
                    designation
            );
        } catch (err) {
            console.error(
                "Fetch Designation Error:",
                err
            );

            setSelectedDesignation(
                designation
            );
        }

        setShowViewModal(true);
    };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingDesignation(null);

        setFormData(
            initialFormData
        );

        setError("");
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedDesignation(null);
    };

    /* =====================================================
       VALIDATE FORM
    ===================================================== */

    const validateForm = () => {
        if (!formData.company) {
            return "Company is required";
        }

        if (!formData.name.trim()) {
            return "Designation name is required";
        }

        if (!formData.code.trim()) {
            return "Designation code is required";
        }

        if (
            !formData.level ||
            Number(formData.level) < 1
        ) {
            return "Designation level must be at least 1";
        }

        return "";
    };

    /* =====================================================
       CREATE / UPDATE
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingDesignation) {
                const payload = {
                    name:
                        formData.name.trim(),

                    code:
                        formData.code
                            .trim()
                            .toUpperCase(),

                    description:
                        formData.description.trim(),

                    level:
                        Number(
                            formData.level
                        ),

                    isActive:
                        formData.isActive,
                };

                await api.put(
                    `/designations/${getId(
                        editingDesignation
                    )}`,
                    payload
                );

                setSuccess(
                    "Designation updated successfully"
                );
            } else {
                const payload = {
                    company:
                        formData.company,

                    name:
                        formData.name.trim(),

                    code:
                        formData.code
                            .trim()
                            .toUpperCase(),

                    description:
                        formData.description.trim(),

                    level:
                        Number(
                            formData.level
                        ),

                    isActive:
                        formData.isActive,
                };

                await api.post(
                    "/designations",
                    payload
                );

                setSuccess(
                    "Designation created successfully"
                );
            }

            setShowModal(false);
            setEditingDesignation(null);
            setFormData(
                initialFormData
            );

            await fetchDesignations(page);
        } catch (err) {
            console.error(
                "Save Designation Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to save designation"
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = async (
        designation
    ) => {
        const designationName =
            designation?.name ||
            "this designation";

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${designationName}"?`
            );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/designations/${getId(
                    designation
                )}`
            );

            setSuccess(
                "Designation deleted successfully"
            );

            if (
                designations.length === 1 &&
                page > 1
            ) {
                setPage((prev) => prev - 1);
            } else {
                await fetchDesignations(page);
            }
        } catch (err) {
            console.error(
                "Delete Designation Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to delete designation"
            );
        }
    };

    /* =====================================================
       FILTER COUNTS
       Current loaded page only
    ===================================================== */

    const activeCount = useMemo(
        () =>
            designations.filter(
                (item) =>
                    item.isActive !== false
            ).length,
        [designations]
    );

    const inactiveCount = useMemo(
        () =>
            designations.filter(
                (item) =>
                    item.isActive === false
            ).length,
        [designations]
    );

    /* =====================================================
       PAGE CHANGE
    ===================================================== */

    const handlePageChange = (
        newPage
    ) => {
        if (newPage < 1) return;

        if (
            pagination.totalPages &&
            newPage >
                pagination.totalPages
        ) {
            return;
        }

        setPage(newPage);
    };

    /* =====================================================
       RESET FILTERS
    ===================================================== */

    const handleResetFilters = () => {
        setSearch("");
        setCompanyFilter("");
        setStatusFilter("");
        setPage(1);
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="designations-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="designations-header">

                <div>
                    <div className="designations-title-row">

                        <div className="designations-title-icon">
                            <FiLayers />
                        </div>

                        <div>
                            <h1>
                                Designations
                            </h1>

                            <p>
                                Manage employee
                                designations
                                and hierarchy
                            </p>
                        </div>

                    </div>
                </div>

                <button
                    type="button"
                    className="designation-create-btn"
                    onClick={
                        handleCreate
                    }
                >
                    <FiPlus />
                    <span>
                        Add Designation
                    </span>
                </button>

            </div>


            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="designation-alert designation-alert-error">
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

            {success && (
                <div className="designation-alert designation-alert-success">
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


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="designations-summary">

                <div className="designation-summary-card">

                    <div className="designation-summary-icon total">
                        <FiLayers />
                    </div>

                    <div>
                        <span>
                            Total Designations
                        </span>

                        <strong>
                            {
                                pagination.totalDesignations ??
                                designations.length
                            }
                        </strong>
                    </div>

                </div>


                <div className="designation-summary-card">

                    <div className="designation-summary-icon active">
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


                <div className="designation-summary-card">

                    <div className="designation-summary-icon inactive">
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


            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="designations-filter-card">

                <div className="designation-search-box">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search by designation name or code..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="designation-filter-group">

                    <select
                        value={
                            companyFilter
                        }
                        onChange={(event) => {
                            setCompanyFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                    >
                        <option value="">
                            All Companies
                        </option>

                        {companies.map(
                            (company) => (
                                <option
                                    key={getId(
                                        company
                                    )}
                                    value={getId(
                                        company
                                    )}
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
                            statusFilter
                        }
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


                    {(search ||
                        companyFilter ||
                        statusFilter) && (
                        <button
                            type="button"
                            className="designation-reset-btn"
                            onClick={
                                handleResetFilters
                            }
                        >
                            <FiX />
                            Reset
                        </button>
                    )}

                </div>

            </div>


            {/* =================================================
                CONTENT
            ================================================= */}

            {loading ? (
                <div className="designations-loading">

                    <div className="designation-loader" />

                    <p>
                        Loading designations...
                    </p>

                </div>
            ) : designations.length === 0 ? (
                <div className="designations-empty">

                    <div className="designations-empty-icon">
                        <FiLayers />
                    </div>

                    <h3>
                        No designations found
                    </h3>

                    <p>
                        Create a designation
                        to get started.
                    </p>

                    <button
                        type="button"
                        onClick={
                            handleCreate
                        }
                    >
                        <FiPlus />
                        Add Designation
                    </button>

                </div>
            ) : (
                <div className="designations-grid">

                    {designations.map(
                        (designation) => {
                            const companyName =
                                getName(
                                    designation.company
                                );

                            return (
                                <div
                                    className="designation-card"
                                    key={getId(
                                        designation
                                    )}
                                >

                                    {/* CARD HEADER */}

                                    <div className="designation-card-header">

                                        <div className="designation-card-identity">

                                            <div className="designation-avatar">
                                                {getInitials(
                                                    designation.name
                                                )}
                                            </div>

                                            <div>
                                                <h3>
                                                    {
                                                        designation.name
                                                    }
                                                </h3>

                                                <span className="designation-code">
                                                    {
                                                        designation.code
                                                    }
                                                </span>
                                            </div>

                                        </div>


                                        <span
                                            className={`designation-status ${
                                                designation.isActive
                                                    ? "active"
                                                    : "inactive"
                                            }`}
                                        >
                                            {designation.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>

                                    </div>


                                    {/* CARD BODY */}

                                    <div className="designation-card-body">

                                        <div className="designation-info-row">

                                            <span className="designation-info-label">
                                                <FiBriefcase />
                                                Company
                                            </span>

                                            <strong>
                                                {
                                                    companyName
                                                }
                                            </strong>

                                        </div>


                                        <div className="designation-info-row">

                                            <span className="designation-info-label">
                                                <FiCode />
                                                Code
                                            </span>

                                            <strong>
                                                {
                                                    designation.code ||
                                                    "—"
                                                }
                                            </strong>

                                        </div>


                                        <div className="designation-info-row">

                                            <span className="designation-info-label">
                                                <FiLayers />
                                                Level
                                            </span>

                                            <strong>
                                                Level{" "}
                                                {
                                                    designation.level ||
                                                    1
                                                }
                                            </strong>

                                        </div>


                                        <div className="designation-description">

                                            <span>
                                                Description
                                            </span>

                                            <p>
                                                {
                                                    designation.description?.trim() ||
                                                    "No description provided"
                                                }
                                            </p>

                                        </div>

                                    </div>


                                    {/* CARD FOOTER */}

                                    <div className="designation-card-footer">

                                        <button
                                            type="button"
                                            className="designation-action-btn view"
                                            title="View"
                                            onClick={() =>
                                                handleView(
                                                    designation
                                                )
                                            }
                                        >
                                            <FiEye />
                                        </button>

                                        <button
                                            type="button"
                                            className="designation-action-btn edit"
                                            title="Edit"
                                            onClick={() =>
                                                handleEdit(
                                                    designation
                                                )
                                            }
                                        >
                                            <FiEdit2 />
                                        </button>

                                        <button
                                            type="button"
                                            className="designation-action-btn delete"
                                            title="Delete"
                                            onClick={() =>
                                                handleDelete(
                                                    designation
                                                )
                                            }
                                        >
                                            <FiTrash2 />
                                        </button>

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>
            )}


            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading &&
                designations.length > 0 &&
                pagination.totalPages > 1 && (
                    <div className="designations-pagination">

                        <button
                            type="button"
                            disabled={
                                !pagination.hasPreviousPage
                            }
                            onClick={() =>
                                handlePageChange(
                                    page - 1
                                )
                            }
                        >
                            Previous
                        </button>


                        <div className="designation-page-numbers">

                            {Array.from(
                                {
                                    length:
                                        pagination.totalPages,
                                },
                                (_, index) =>
                                    index + 1
                            ).map(
                                (pageNumber) => (
                                    <button
                                        type="button"
                                        key={
                                            pageNumber
                                        }
                                        className={
                                            pageNumber ===
                                            page
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handlePageChange(
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

                        </div>


                        <button
                            type="button"
                            disabled={
                                !pagination.hasNextPage
                            }
                            onClick={() =>
                                handlePageChange(
                                    page + 1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>
                )}


            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="designation-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="designation-modal">

                        <div className="designation-modal-header">

                            <div>
                                <h2>
                                    {editingDesignation
                                        ? "Edit Designation"
                                        : "Create Designation"}
                                </h2>

                                <p>
                                    {editingDesignation
                                        ? "Update designation details"
                                        : "Add a new employee designation"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
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

                            <div className="designation-modal-body">

                                {/* COMPANY */}

                                <div className="designation-form-group">

                                    <label>
                                        Company
                                        <span>*</span>
                                    </label>

                                    <div className="designation-input-icon">
                                        <FiBriefcase />

                                        <select
                                            name="company"
                                            value={
                                                formData.company
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                Boolean(
                                                    editingDesignation
                                                )
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
                                                        key={getId(
                                                            company
                                                        )}
                                                        value={getId(
                                                            company
                                                        )}
                                                    >
                                                        {getName(
                                                            company
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                </div>


                                <div className="designation-form-grid">

                                    {/* NAME */}

                                    <div className="designation-form-group">

                                        <label>
                                            Designation Name
                                            <span>*</span>
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
                                            placeholder="e.g. Full Stack Developer"
                                            maxLength={
                                                100
                                            }
                                            required
                                        />

                                        <small>
                                            {
                                                formData
                                                    .name
                                                    .length
                                            }
                                            /100
                                        </small>

                                    </div>


                                    {/* CODE */}

                                    <div className="designation-form-group">

                                        <label>
                                            Designation Code
                                            <span>*</span>
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
                                            placeholder="e.g. FSD"
                                            maxLength={
                                                30
                                            }
                                            style={{
                                                textTransform:
                                                    "uppercase",
                                            }}
                                            required
                                        />

                                        <small>
                                            {
                                                formData
                                                    .code
                                                    .length
                                            }
                                            /30
                                        </small>

                                    </div>

                                </div>


                                {/* LEVEL */}

                                <div className="designation-form-group">

                                    <label>
                                        Level
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="number"
                                        name="level"
                                        value={
                                            formData.level
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="1"
                                        step="1"
                                        required
                                    />

                                    <small>
                                        Lower number =
                                        higher hierarchy
                                    </small>

                                </div>


                                {/* DESCRIPTION */}

                                <div className="designation-form-group">

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
                                        placeholder="Enter designation description..."
                                        maxLength={
                                            500
                                        }
                                        rows="5"
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

                                <div className="designation-status-toggle">

                                    <div>
                                        <strong>
                                            Active Status
                                        </strong>

                                        <p>
                                            Active designations
                                            can be assigned to
                                            employees.
                                        </p>
                                    </div>

                                    <label className="designation-switch">

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

                                    </label>

                                </div>

                            </div>


                            {/* MODAL FOOTER */}

                            <div className="designation-modal-footer">

                                <button
                                    type="button"
                                    className="designation-cancel-btn"
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
                                    className="designation-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingDesignation
                                        ? "Update Designation"
                                        : "Create Designation"}
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
                selectedDesignation && (
                    <div
                        className="designation-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >

                        <div className="designation-view-modal">

                            <div className="designation-modal-header">

                                <div>
                                    <h2>
                                        Designation Details
                                    </h2>

                                    <p>
                                        View designation information
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


                            <div className="designation-view-body">

                                {/* PROFILE */}

                                <div className="designation-view-profile">

                                    <div className="designation-view-avatar">
                                        {getInitials(
                                            selectedDesignation.name
                                        )}
                                    </div>

                                    <div>

                                        <h3>
                                            {
                                                selectedDesignation.name
                                            }
                                        </h3>

                                        <span>
                                            {
                                                selectedDesignation.code
                                            }
                                        </span>

                                    </div>

                                </div>


                                {/* STATUS */}

                                <div className="designation-view-status">

                                    <span
                                        className={`designation-status ${
                                            selectedDesignation.isActive
                                                ? "active"
                                                : "inactive"
                                        }`}
                                    >
                                        {selectedDesignation.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                </div>


                                {/* DETAILS */}

                                <div className="designation-view-grid">

                                    <div className="designation-view-item">

                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {getName(
                                                selectedDesignation.company
                                            )}
                                        </strong>

                                    </div>


                                    <div className="designation-view-item">

                                        <span>
                                            Designation Code
                                        </span>

                                        <strong>
                                            {
                                                selectedDesignation.code ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="designation-view-item">

                                        <span>
                                            Level
                                        </span>

                                        <strong>
                                            Level{" "}
                                            {
                                                selectedDesignation.level ||
                                                1
                                            }
                                        </strong>

                                    </div>


                                    <div className="designation-view-item">

                                        <span>
                                            Created At
                                        </span>

                                        <strong>
                                            {selectedDesignation.createdAt
                                                ? new Date(
                                                      selectedDesignation.createdAt
                                                  ).toLocaleDateString(
                                                      "en-IN",
                                                      {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                      }
                                                  )
                                                : "—"}
                                        </strong>

                                    </div>

                                </div>


                                {/* DESCRIPTION */}

                                <div className="designation-view-description">

                                    <span>
                                        Description
                                    </span>

                                    <p>
                                        {
                                            selectedDesignation.description?.trim() ||
                                            "No description provided."
                                        }
                                    </p>

                                </div>

                            </div>


                            <div className="designation-modal-footer">

                                <button
                                    type="button"
                                    className="designation-cancel-btn"
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

export default Designations;