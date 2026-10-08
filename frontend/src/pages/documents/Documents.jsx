import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    FiUpload,
    FiSearch,
    FiDownload,
    FiTrash2,
    FiEye,
    FiFile,
    FiFileText,
    FiImage,
    FiArchive,
    FiX,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiCalendar,
    FiFolder,
} from "react-icons/fi";

import {
    uploadDocument,
    getDocuments,
    getDocumentById,
    getDocumentDownloadUrl,
    deleteDocument,
} from "../../services/documentService";

import { useAuth } from "../../context/AuthContext";

import "../../styles/documents.css";

// =====================================================
// CONSTANTS
// =====================================================

const ENTITY_TYPES = [
    {
        value: "GENERAL",
        label: "General",
    },
    {
        value: "PURCHASE_ORDER",
        label: "Purchase Order",
    },
    {
        value: "PURCHASE_INVOICE",
        label: "Purchase Invoice",
    },
    {
        value: "PURCHASE_RETURN",
        label: "Purchase Return",
    },
    {
        value: "SALES_ORDER",
        label: "Sales Order",
    },
    {
        value: "SALES_INVOICE",
        label: "Sales Invoice",
    },
    {
        value: "SALES_RETURN",
        label: "Sales Return",
    },
    {
        value: "EXPENSE",
        label: "Expense",
    },
    {
        value: "CUSTOMER",
        label: "Customer",
    },
    {
        value: "SUPPLIER",
        label: "Supplier",
    },
    {
        value: "EMPLOYEE",
        label: "Employee",
    },
    {
        value: "USER",
        label: "User",
    },
];

// =====================================================
// HELPERS
// =====================================================

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return `${parseFloat(
        (bytes / Math.pow(1024, index)).toFixed(2)
    )} ${units[index]}`;
};

const formatDate = (date) => {
    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

const formatDateTime = (date) => {
    if (!date) {
        return "-";
    }

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

const getEntityLabel = (entityType) => {
    const entity = ENTITY_TYPES.find(
        (item) => item.value === entityType
    );

    return entity
        ? entity.label
        : entityType || "General";
};

const getFileIcon = (mimeType) => {
    if (!mimeType) {
        return <FiFile />;
    }

    if (mimeType.startsWith("image/")) {
        return <FiImage />;
    }

    if (
        mimeType.includes("pdf") ||
        mimeType.includes("text") ||
        mimeType.includes("word")
    ) {
        return <FiFileText />;
    }

    if (
        mimeType.includes("zip") ||
        mimeType.includes("rar")
    ) {
        return <FiArchive />;
    }

    return <FiFile />;
};

// =====================================================
// GET OBJECT ID HELPER
// =====================================================

const getObjectId = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (value._id) {
        return value._id;
    }

    if (value.id) {
        return value.id;
    }

    return "";
};

// =====================================================
// COMPONENT
// =====================================================

const Documents = () => {
    // -------------------------------------------------
    // AUTH
    // -------------------------------------------------

    const { user } = useAuth();

    // -------------------------------------------------
    // COMPANY / BRANCH
    // -------------------------------------------------

    const companyId = getObjectId(
        user?.company
    );

    const branchId = getObjectId(
        user?.branch
    );

    const companyName =
        typeof user?.company === "object"
            ? user?.company?.name
            : user?.companyName || "";

    const branchName =
        typeof user?.branch === "object"
            ? user?.branch?.name
            : user?.branchName || "";

    // -------------------------------------------------
    // STATES
    // -------------------------------------------------

    const [documents, setDocuments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [entityFilter, setEntityFilter] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [pagination, setPagination] =
        useState({
            currentPage: 1,
            limit: 10,
            totalDocuments: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        });

    const [showUploadModal, setShowUploadModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedDocument, setSelectedDocument] =
        useState(null);

    const [loadingDocument, setLoadingDocument] =
        useState(false);

    const [downloadingId, setDownloadingId] =
        useState(null);

    const [deletingId, setDeletingId] =
        useState(null);

    const fileInputRef =
        useRef(null);

    // -------------------------------------------------
    // UPLOAD FORM
    // -------------------------------------------------

    const [formData, setFormData] =
        useState({
            company: "",
            branch: "",
            entityType: "GENERAL",
            entityId: "",
            description: "",
            isPublic: false,
            file: null,
        });

    // =================================================
    // FETCH DOCUMENTS
    // =================================================

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit: 10,
            };

            if (entityFilter) {
                params.entityType =
                    entityFilter;
            }

            const response =
                await getDocuments(params);

            setDocuments(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );

            if (response?.pagination) {
                setPagination(
                    response.pagination
                );
            }
        } catch (err) {
            console.error(
                "Fetch Documents Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to fetch documents"
            );

            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [page, entityFilter]);

    // =================================================
    // SEARCH FILTER
    // =================================================

    const filteredDocuments = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        if (!keyword) {
            return documents;
        }

        return documents.filter(
            (document) => {
                return (
                    document.originalName
                        ?.toLowerCase()
                        .includes(keyword) ||

                    document.fileName
                        ?.toLowerCase()
                        .includes(keyword) ||

                    document.description
                        ?.toLowerCase()
                        .includes(keyword) ||

                    document.entityType
                        ?.toLowerCase()
                        .includes(keyword) ||

                    document.uploadedBy?.name
                        ?.toLowerCase()
                        .includes(keyword) ||

                    document.uploadedBy?.email
                        ?.toLowerCase()
                        .includes(keyword)
                );
            }
        );
    }, [documents, search]);

    // =================================================
    // FORM CHANGE
    // =================================================

    const handleFormChange = (e) => {
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

    // =================================================
    // FILE CHANGE
    // =================================================

    const handleFileChange = (e) => {
        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            setError(
                "File size must be less than 10 MB"
            );

            e.target.value = "";

            return;
        }

        setError("");

        setFormData((prev) => ({
            ...prev,
            file,
        }));
    };

    // =================================================
    // OPEN UPLOAD MODAL
    // =================================================

    const openUploadModal = () => {
        setError("");
        setSuccess("");

        setFormData({
            company: companyId,
            branch: branchId,
            entityType: "GENERAL",
            entityId: "",
            description: "",
            isPublic: false,
            file: null,
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setShowUploadModal(true);
    };

    // =================================================
    // CLOSE UPLOAD MODAL
    // =================================================

    const closeUploadModal = () => {
        if (uploading) {
            return;
        }

        setShowUploadModal(false);
    };

    // =================================================
    // UPLOAD
    // =================================================

    const handleUpload = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.file) {
            setError(
                "Please select a file"
            );

            return;
        }

        if (!formData.company) {
            setError(
                "Company information is not available"
            );

            return;
        }

        if (!formData.branch) {
            setError(
                "Branch information is not available"
            );

            return;
        }

        if (!formData.entityType) {
            setError(
                "Entity type is required"
            );

            return;
        }

        try {
            setUploading(true);

            const data =
                new FormData();

            data.append(
                "file",
                formData.file
            );

            data.append(
                "company",
                formData.company
            );

            data.append(
                "branch",
                formData.branch
            );

            data.append(
                "entityType",
                formData.entityType
            );

            if (formData.entityId) {
                data.append(
                    "entityId",
                    formData.entityId
                );
            }

            data.append(
                "description",
                formData.description
            );

            data.append(
                "isPublic",
                formData.isPublic
            );

            await uploadDocument(data);

            setSuccess(
                "Document uploaded successfully"
            );

            setShowUploadModal(false);

            setFormData({
                company: companyId,
                branch: branchId,
                entityType: "GENERAL",
                entityId: "",
                description: "",
                isPublic: false,
                file: null,
            });

            if (fileInputRef.current) {
                fileInputRef.current.value =
                    "";
            }

            await fetchDocuments();
        } catch (err) {
            console.error(
                "Upload Document Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to upload document"
            );
        } finally {
            setUploading(false);
        }
    };

    // =================================================
    // VIEW DOCUMENT
    // =================================================

    const handleView = async (id) => {
        try {
            setLoadingDocument(true);
            setError("");

            const response =
                await getDocumentById(id);

            setSelectedDocument(
                response?.data || null
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View Document Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to fetch document"
            );
        } finally {
            setLoadingDocument(false);
        }
    };

    // =================================================
    // DOWNLOAD DOCUMENT
    // =================================================

    const handleDownload = async (
        document
    ) => {
        try {
            setDownloadingId(
                document._id
            );

            setError("");

            const response =
                await getDocumentDownloadUrl(
                    document._id
                );

            const url =
                response?.data?.url;

            if (!url) {
                throw new Error(
                    "Download URL not found"
                );
            }

            const link =
                window.document.createElement(
                    "a"
                );

            link.href = url;
            link.target = "_blank";
            link.rel =
                "noopener noreferrer";
            link.download =
                document.originalName;

            window.document.body.appendChild(
                link
            );

            link.click();

            link.remove();
        } catch (err) {
            console.error(
                "Download Document Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to download document"
            );
        } finally {
            setDownloadingId(null);
        }
    };

    // =================================================
    // DELETE DOCUMENT
    // =================================================

    const handleDelete = async (
        document
    ) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${document.originalName}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(
                document._id
            );

            setError("");
            setSuccess("");

            await deleteDocument(
                document._id
            );

            setSuccess(
                "Document deleted successfully"
            );

            await fetchDocuments();
        } catch (err) {
            console.error(
                "Delete Document Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to delete document"
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =================================================
    // PAGINATION
    // =================================================

    const handlePrevious = () => {
        if (
            pagination.hasPreviousPage
        ) {
            setPage(
                (prev) =>
                    Math.max(
                        prev - 1,
                        1
                    )
            );
        }
    };

    const handleNext = () => {
        if (
            pagination.hasNextPage
        ) {
            setPage(
                (prev) =>
                    prev + 1
            );
        }
    };

    // =================================================
    // CLOSE VIEW MODAL
    // =================================================

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedDocument(null);
    };

    // =================================================
    // UI
    // =================================================

    return (
        <div className="documents-page">

            {/* HEADER */}

            <div className="documents-header">

                <div>
                    <h1>
                        Documents
                    </h1>

                    <p>
                        Manage and organize
                        your ERP documents
                    </p>
                </div>

                <button
                    className="documents-upload-btn"
                    onClick={
                        openUploadModal
                    }
                >
                    <FiUpload />
                    Upload Document
                </button>

            </div>

            {/* ALERTS */}

            {error && (
                <div className="documents-alert documents-alert-error">

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
                <div className="documents-alert documents-alert-success">

                    <FiCheckCircle />

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

            {/* STATS */}

            <div className="documents-stats">

                <div className="documents-stat-card">

                    <div className="documents-stat-icon">
                        <FiFolder />
                    </div>

                    <div>
                        <span>
                            Total Documents
                        </span>

                        <strong>
                            {
                                pagination.totalDocuments
                            }
                        </strong>
                    </div>

                </div>

                <div className="documents-stat-card">

                    <div className="documents-stat-icon">
                        <FiFile />
                    </div>

                    <div>
                        <span>
                            Current Page
                        </span>

                        <strong>
                            {
                                pagination.currentPage
                            }
                        </strong>
                    </div>

                </div>

                <div className="documents-stat-card">

                    <div className="documents-stat-icon">
                        <FiClock />
                    </div>

                    <div>
                        <span>
                            Page Count
                        </span>

                        <strong>
                            {
                                pagination.totalPages ||
                                0
                            }
                        </strong>
                    </div>

                </div>

            </div>

            {/* TOOLBAR */}

            <div className="documents-toolbar">

                <div className="documents-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>

                <div className="documents-filter">

                    <select
                        value={entityFilter}
                        onChange={(e) => {
                            setPage(1);

                            setEntityFilter(
                                e.target.value
                            );
                        }}
                    >

                        <option value="">
                            All Types
                        </option>

                        {ENTITY_TYPES.map(
                            (entity) => (
                                <option
                                    key={
                                        entity.value
                                    }
                                    value={
                                        entity.value
                                    }
                                >
                                    {
                                        entity.label
                                    }
                                </option>
                            )
                        )}

                    </select>

                </div>

            </div>

            {/* TABLE */}

            <div className="documents-table-card">

                {loading ? (

                    <div className="documents-loading">

                        <div className="documents-spinner" />

                        <p>
                            Loading documents...
                        </p>

                    </div>

                ) : filteredDocuments.length === 0 ? (

                    <div className="documents-empty">

                        <div className="documents-empty-icon">
                            <FiFile />
                        </div>

                        <h3>
                            No documents found
                        </h3>

                        <p>
                            Upload a document
                            to get started.
                        </p>

                        <button
                            onClick={
                                openUploadModal
                            }
                        >
                            <FiUpload />
                            Upload Document
                        </button>

                    </div>

                ) : (

                    <div className="documents-table-wrapper">

                        <table className="documents-table">

                            <thead>

                                <tr>

                                    <th>
                                        Document
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        Size
                                    </th>

                                    <th>
                                        Uploaded By
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Visibility
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredDocuments.map(
                                    (document) => (

                                        <tr
                                            key={
                                                document._id
                                            }
                                        >

                                            <td>

                                                <div className="document-name-cell">

                                                    <div className="document-file-icon">

                                                        {
                                                            getFileIcon(
                                                                document.mimeType
                                                            )
                                                        }

                                                    </div>

                                                    <div className="document-name-info">

                                                        <strong
                                                            title={
                                                                document.originalName
                                                            }
                                                        >
                                                            {
                                                                document.originalName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                document.description ||
                                                                "No description"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <span className="document-type-badge">

                                                    {
                                                        getEntityLabel(
                                                            document.entityType
                                                        )
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <span className="document-size">

                                                    {
                                                        formatFileSize(
                                                            document.fileSize
                                                        )
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <div className="document-user-cell">

                                                    <FiUser />

                                                    <div>

                                                        <strong>
                                                            {
                                                                document
                                                                    .uploadedBy
                                                                    ?.name ||
                                                                "-"
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                document
                                                                    .uploadedBy
                                                                    ?.email ||
                                                                ""
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <div className="document-date-cell">

                                                    <FiCalendar />

                                                    <span>
                                                        {
                                                            formatDate(
                                                                document.createdAt
                                                            )
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            <td>

                                                {document.isPublic ? (

                                                    <span className="document-status public">
                                                        Public
                                                    </span>

                                                ) : (

                                                    <span className="document-status private">
                                                        Private
                                                    </span>

                                                )}

                                            </td>

                                            <td>

                                                <div className="document-actions">

                                                    <button
                                                        className="document-action view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                document._id
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    <button
                                                        className="document-action download"
                                                        title="Download"
                                                        disabled={
                                                            downloadingId ===
                                                            document._id
                                                        }
                                                        onClick={() =>
                                                            handleDownload(
                                                                document
                                                            )
                                                        }
                                                    >
                                                        <FiDownload />
                                                    </button>

                                                    <button
                                                        className="document-action delete"
                                                        title="Delete"
                                                        disabled={
                                                            deletingId ===
                                                            document._id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                document
                                                            )
                                                        }
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

            </div>

            {/* PAGINATION */}

            {!loading &&
                pagination.totalDocuments > 0 && (

                    <div className="documents-pagination">

                        <div>

                            Showing page{" "}

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

                        </div>

                        <div className="documents-pagination-buttons">

                            <button
                                disabled={
                                    !pagination.hasPreviousPage
                                }
                                onClick={
                                    handlePrevious
                                }
                            >
                                Previous
                            </button>

                            <button
                                disabled={
                                    !pagination.hasNextPage
                                }
                                onClick={
                                    handleNext
                                }
                            >
                                Next
                            </button>

                        </div>

                    </div>

                )}

            {/* =================================================
                UPLOAD MODAL
            ================================================= */}

            {showUploadModal && (

                <div className="documents-modal-overlay">

                    <div className="documents-modal">

                        <div className="documents-modal-header">

                            <div>

                                <h2>
                                    Upload Document
                                </h2>

                                <p>
                                    Upload a document
                                    to your ERP
                                </p>

                            </div>

                            <button
                                onClick={
                                    closeUploadModal
                                }
                                disabled={
                                    uploading
                                }
                            >
                                <FiX />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleUpload
                            }
                        >

                            <div className="documents-modal-body">

                                {/* FILE */}

                                <div className="documents-form-group">

                                    <label>
                                        Document File
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <div className="documents-file-input">

                                        <input
                                            ref={
                                                fileInputRef
                                            }
                                            type="file"
                                            onChange={
                                                handleFileChange
                                            }
                                        />

                                        {formData.file && (

                                            <div className="selected-file">

                                                <FiFile />

                                                <span>
                                                    {
                                                        formData
                                                            .file
                                                            .name
                                                    }
                                                </span>

                                                <small>
                                                    (
                                                    {
                                                        formatFileSize(
                                                            formData
                                                                .file
                                                                .size
                                                        )
                                                    }
                                                    )
                                                </small>

                                            </div>

                                        )}

                                    </div>

                                    <small className="documents-help-text">
                                        Maximum file
                                        size: 10 MB
                                    </small>

                                </div>

                                {/* ENTITY */}

                                <div className="documents-form-row">

                                    <div className="documents-form-group">

                                        <label>
                                            Entity Type
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="entityType"
                                            value={
                                                formData.entityType
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        >

                                            {ENTITY_TYPES.map(
                                                (
                                                    entity
                                                ) => (

                                                    <option
                                                        key={
                                                            entity.value
                                                        }
                                                        value={
                                                            entity.value
                                                        }
                                                    >
                                                        {
                                                            entity.label
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div className="documents-form-group">

                                        <label>
                                            Entity ID
                                        </label>

                                        <input
                                            type="text"
                                            name="entityId"
                                            value={
                                                formData.entityId
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Optional MongoDB ID"
                                        />

                                    </div>

                                </div>

                                {/* COMPANY / BRANCH */}

                                <div className="documents-form-row">

                                    <div className="documents-form-group">

                                        <label>
                                            Company
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                companyName ||
                                                "Current Company"
                                            }
                                            readOnly
                                            disabled
                                        />

                                    </div>

                                    <div className="documents-form-group">

                                        <label>
                                            Branch
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                branchName ||
                                                "Current Branch"
                                            }
                                            readOnly
                                            disabled
                                        />

                                    </div>

                                </div>

                                {/* DESCRIPTION */}

                                <div className="documents-form-group">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            formData.description
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="4"
                                        maxLength="500"
                                        placeholder="Enter document description..."
                                    />

                                </div>

                                {/* PUBLIC */}

                                <label className="documents-checkbox">

                                    <input
                                        type="checkbox"
                                        name="isPublic"
                                        checked={
                                            formData.isPublic
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    />

                                    <span>
                                        Make this
                                        document public
                                    </span>

                                </label>

                            </div>

                            {/* FOOTER */}

                            <div className="documents-modal-footer">

                                <button
                                    type="button"
                                    className="documents-cancel-btn"
                                    onClick={
                                        closeUploadModal
                                    }
                                    disabled={
                                        uploading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="documents-submit-btn"
                                    disabled={
                                        uploading
                                    }
                                >

                                    {uploading ? (

                                        <>

                                            <span className="documents-button-spinner" />

                                            Uploading...

                                        </>

                                    ) : (

                                        <>

                                            <FiUpload />

                                            Upload Document

                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {showViewModal && (

                <div className="documents-modal-overlay">

                    <div className="documents-modal documents-view-modal">

                        <div className="documents-modal-header">

                            <div>

                                <h2>
                                    Document Details
                                </h2>

                                <p>
                                    View document
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

                        <div className="documents-modal-body">

                            {loadingDocument ? (

                                <div className="documents-loading">

                                    <div className="documents-spinner" />

                                    <p>
                                        Loading document...
                                    </p>

                                </div>

                            ) : selectedDocument ? (

                                <div className="document-details">

                                    <div className="document-details-icon">

                                        {
                                            getFileIcon(
                                                selectedDocument.mimeType
                                            )
                                        }

                                    </div>

                                    <h3>
                                        {
                                            selectedDocument.originalName
                                        }
                                    </h3>

                                    <div className="document-detail-grid">

                                        <div>

                                            <span>
                                                File Type
                                            </span>

                                            <strong>
                                                {
                                                    selectedDocument.mimeType
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                File Size
                                            </span>

                                            <strong>
                                                {
                                                    formatFileSize(
                                                        selectedDocument.fileSize
                                                    )
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Entity Type
                                            </span>

                                            <strong>
                                                {
                                                    getEntityLabel(
                                                        selectedDocument.entityType
                                                    )
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Visibility
                                            </span>

                                            <strong>
                                                {
                                                    selectedDocument.isPublic
                                                        ? "Public"
                                                        : "Private"
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Uploaded By
                                            </span>

                                            <strong>
                                                {
                                                    selectedDocument
                                                        .uploadedBy
                                                        ?.name ||
                                                    "-"
                                                }
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Uploaded Date
                                            </span>

                                            <strong>
                                                {
                                                    formatDateTime(
                                                        selectedDocument.createdAt
                                                    )
                                                }
                                            </strong>

                                        </div>

                                    </div>

                                    <div className="document-description-box">

                                        <span>
                                            Description
                                        </span>

                                        <p>
                                            {
                                                selectedDocument.description ||
                                                "No description provided."
                                            }
                                        </p>

                                    </div>

                                    <div className="document-detail-actions">

                                        <button
                                            className="documents-submit-btn"
                                            onClick={() =>
                                                handleDownload(
                                                    selectedDocument
                                                )
                                            }
                                        >

                                            <FiDownload />

                                            Download

                                        </button>

                                    </div>

                                </div>

                            ) : (

                                <div className="documents-empty">

                                    <p>
                                        Document not found.
                                    </p>

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Documents;