import { useEffect, useMemo, useState } from "react";

import {
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiEye,
    FiTrash2,
    FiX,
    FiCreditCard,
    FiDollarSign,
    FiCalendar,
    FiFileText,
    FiUser,
    FiBriefcase,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/purchasePayments.css";

function PurchasePayments() {
    /* =========================================================
       LIST STATE
    ========================================================= */

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /* =========================================================
       DROPDOWN DATA
    ========================================================= */

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState([]);

    const [invoiceLoading, setInvoiceLoading] = useState(false);

    /* =========================================================
       FILTERS
    ========================================================= */

    const [filters, setFilters] = useState({
        search: "",
        company: "",
        branch: "",
        supplier: "",
        purchaseInvoice: "",
        paymentMethod: "",
        status: "",
        startDate: "",
        endDate: "",
    });

    /* =========================================================
       PAGINATION
    ========================================================= */

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
    });

    /* =========================================================
       MODALS
    ========================================================= */

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [selectedPayment, setSelectedPayment] = useState(null);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    /* =========================================================
       FORM
    ========================================================= */

    const initialForm = {
        company: "",
        branch: "",
        supplier: "",
        purchaseInvoice: "",

        paymentDate: new Date()
            .toISOString()
            .split("T")[0],

        amount: "",

        paymentMethod: "BANK_TRANSFER",

        transactionReference: "",
        bankName: "",

        chequeNumber: "",
        chequeDate: "",

        notes: "",

        status: "COMPLETED",
    };

    const [formData, setFormData] = useState(initialForm);

    /* =========================================================
       SELECTED INVOICE
    ========================================================= */

    const [selectedInvoice, setSelectedInvoice] =
        useState(null);

    const [invoiceDetailsLoading, setInvoiceDetailsLoading] =
        useState(false);

    /* =========================================================
       HELPERS
    ========================================================= */

    const getId = (value) => {
        if (!value) return "";

        if (typeof value === "string") {
            return value;
        }

        return value._id || value.id || "";
    };

    const formatCurrency = (value) => {
        const amount = Number(value || 0);

        return amount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("en-IN");
    };

    const formatDateInput = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toISOString().split("T")[0];
    };

    const getSupplierName = (supplier) => {
        if (!supplier) return "-";

        if (typeof supplier === "string") {
            return supplier;
        }

        return (
            supplier.name ||
            supplier.companyName ||
            "-"
        );
    };

    const getSupplierCode = (supplier) => {
        if (!supplier || typeof supplier === "string") {
            return "";
        }

        return supplier.supplierCode || "";
    };

    const getInvoiceNumber = (invoice) => {
        if (!invoice) return "-";

        if (typeof invoice === "string") {
            return invoice;
        }

        return (
            invoice.internalInvoiceNumber ||
            invoice.invoiceNumber ||
            "-"
        );
    };

    const getPaymentMethodLabel = (method) => {
        const labels = {
            CASH: "Cash",
            BANK_TRANSFER: "Bank Transfer",
            UPI: "UPI",
            CHEQUE: "Cheque",
            CARD: "Card",
            NEFT: "NEFT",
            RTGS: "RTGS",
            IMPS: "IMPS",
            OTHER: "Other",
        };

        return labels[method] || method || "-";
    };

    const getStatusLabel = (status) => {
        const labels = {
            PENDING: "Pending",
            COMPLETED: "Completed",
            CANCELLED: "Cancelled",
        };

        return labels[status] || status || "-";
    };

    const getPaymentStatusClass = (status) => {
        switch (status) {
            case "COMPLETED":
                return "payment-status-completed";

            case "PENDING":
                return "payment-status-pending";

            case "CANCELLED":
                return "payment-status-cancelled";

            default:
                return "";
        }
    };

    /* =========================================================
       FETCH COMPANIES
    ========================================================= */

    const fetchCompanies = async () => {
        try {
            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            const data =
                response.data?.companies ||
                response.data?.data ||
                [];

            setCompanies(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(
                "Fetch companies error:",
                err
            );
        }
    };

    /* =========================================================
       FETCH BRANCHES
    ========================================================= */

    const fetchBranches = async (companyId) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            const data =
                response.data?.branches ||
                response.data?.data ||
                [];

            setBranches(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            console.error(
                "Fetch branches error:",
                err
            );

            setBranches([]);
        }
    };

    /* =========================================================
       FETCH SUPPLIERS
    ========================================================= */

    const fetchSuppliers = async (
        companyId,
        branchId
    ) => {
        if (!companyId) {
            setSuppliers([]);
            return;
        }

        try {
            let url =
                `/suppliers?company=${companyId}` +
                `&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response = await api.get(url);

            const data =
                response.data?.data ||
                response.data?.suppliers ||
                [];

            setSuppliers(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            console.error(
                "Fetch suppliers error:",
                err
            );

            setSuppliers([]);
        }
    };

    /* =========================================================
       FETCH PURCHASE INVOICES
    ========================================================= */

    const fetchPurchaseInvoices = async ({
        companyId,
        branchId,
        supplierId,
    } = {}) => {
        if (!companyId) {
            setPurchaseInvoices([]);
            return;
        }

        setInvoiceLoading(true);

        try {
            let url =
                `/purchase-invoices?company=${companyId}` +
                `&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            if (supplierId) {
                url += `&supplier=${supplierId}`;
            }

            const response = await api.get(url);

            const data =
                response.data?.data ||
                response.data?.invoices ||
                [];

            const invoiceList = Array.isArray(data)
                ? data
                : [];

            // Only invoices having remaining due
            const payableInvoices =
                invoiceList.filter(
                    (invoice) => {
                        const total =
                            Number(
                                invoice.totalAmount || 0
                            );

                        const paid =
                            Number(
                                invoice.paidAmount || 0
                            );

                        const due =
                            Number(
                                invoice.dueAmount ??
                                    total - paid
                            );

                        return (
                            due > 0 &&
                            invoice.status !==
                                "CANCELLED"
                        );
                    }
                );

            setPurchaseInvoices(
                payableInvoices
            );
        } catch (err) {
            console.error(
                "Fetch purchase invoices error:",
                err
            );

            setPurchaseInvoices([]);
        } finally {
            setInvoiceLoading(false);
        }
    };

    /* =========================================================
       FETCH PAYMENTS
    ========================================================= */

    const fetchPayments = async (
        page = pagination.page
    ) => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            params.set(
                "page",
                String(page)
            );

            params.set(
                "limit",
                String(pagination.limit)
            );

            if (filters.search.trim()) {
                params.set(
                    "search",
                    filters.search.trim()
                );
            }

            if (filters.company) {
                params.set(
                    "company",
                    filters.company
                );
            }

            if (filters.branch) {
                params.set(
                    "branch",
                    filters.branch
                );
            }

            if (filters.supplier) {
                params.set(
                    "supplier",
                    filters.supplier
                );
            }

            if (filters.purchaseInvoice) {
                params.set(
                    "purchaseInvoice",
                    filters.purchaseInvoice
                );
            }

            if (filters.paymentMethod) {
                params.set(
                    "paymentMethod",
                    filters.paymentMethod
                );
            }

            if (filters.status) {
                params.set(
                    "status",
                    filters.status
                );
            }

            if (filters.startDate) {
                params.set(
                    "startDate",
                    filters.startDate
                );
            }

            if (filters.endDate) {
                params.set(
                    "endDate",
                    filters.endDate
                );
            }

            const response = await api.get(
                `/purchase-payments?${params.toString()}`
            );

            const data =
                response.data?.data || [];

            const pageData =
                response.data?.pagination || {};

            setPayments(
                Array.isArray(data)
                    ? data
                    : []
            );

            setPagination((prev) => ({
                ...prev,
                page:
                    Number(
                        pageData.page || page
                    ),
                total:
                    Number(
                        pageData.total || 0
                    ),
                pages:
                    Number(
                        pageData.pages || 1
                    ),
            }));
        } catch (err) {
            console.error(
                "Fetch payments error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to load purchase payments"
            );

            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {
        fetchCompanies();
        fetchPayments(1);
    }, []);

    /* =========================================================
       FETCH BRANCHES WHEN COMPANY CHANGES
    ========================================================= */

    useEffect(() => {
        if (filters.company) {
            fetchBranches(
                filters.company
            );
        } else {
            setBranches([]);
        }
    }, [filters.company]);

    /* =========================================================
       FETCH SUPPLIERS WHEN COMPANY / BRANCH CHANGES
    ========================================================= */

    useEffect(() => {
        if (filters.company) {
            fetchSuppliers(
                filters.company,
                filters.branch
            );
        } else {
            setSuppliers([]);
        }
    }, [
        filters.company,
        filters.branch,
    ]);

    /* =========================================================
       FETCH FILTER INVOICES
    ========================================================= */

    useEffect(() => {
        if (filters.company) {
            fetchPurchaseInvoices({
                companyId:
                    filters.company,
                branchId:
                    filters.branch,
                supplierId:
                    filters.supplier,
            });
        } else {
            setPurchaseInvoices([]);
        }
    }, [
        filters.company,
        filters.branch,
        filters.supplier,
    ]);

    /* =========================================================
       FILTER CHANGE
    ========================================================= */

    const handleFilterChange = (
        field,
        value
    ) => {
        setFilters((prev) => {
            const next = {
                ...prev,
                [field]: value,
            };

            if (field === "company") {
                next.branch = "";
                next.supplier = "";
                next.purchaseInvoice = "";
            }

            if (field === "branch") {
                next.supplier = "";
                next.purchaseInvoice = "";
            }

            if (field === "supplier") {
                next.purchaseInvoice = "";
            }

            return next;
        });

        if (
            field === "search"
        ) {
            return;
        }

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));
    };

    /* =========================================================
       SEARCH
    ========================================================= */

    const handleSearch = () => {
        fetchPayments(1);
    };

    /* =========================================================
       RESET FILTERS
    ========================================================= */

    const resetFilters = () => {
        setFilters({
            search: "",
            company: "",
            branch: "",
            supplier: "",
            purchaseInvoice: "",
            paymentMethod: "",
            status: "",
            startDate: "",
            endDate: "",
        });

        setBranches([]);
        setSuppliers([]);
        setPurchaseInvoices([]);

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));

        setTimeout(() => {
            fetchPayments(1);
        }, 0);
    };

    /* =========================================================
       FORM CHANGE
    ========================================================= */

    const handleFormChange = (
        field,
        value
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /* =========================================================
       COMPANY CHANGE IN FORM
    ========================================================= */

    const handleFormCompanyChange = async (
        companyId
    ) => {
        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            supplier: "",
            purchaseInvoice: "",
        }));

        setBranches([]);
        setSuppliers([]);
        setPurchaseInvoices([]);
        setSelectedInvoice(null);

        if (!companyId) {
            return;
        }

        await fetchBranches(companyId);
        await fetchSuppliers(
            companyId,
            ""
        );
        await fetchPurchaseInvoices({
            companyId,
            branchId: "",
            supplierId: "",
        });
    };

    /* =========================================================
       BRANCH CHANGE IN FORM
    ========================================================= */

    const handleFormBranchChange = async (
        branchId
    ) => {
        setFormData((prev) => ({
            ...prev,
            branch: branchId,
            supplier: "",
            purchaseInvoice: "",
        }));

        setSuppliers([]);
        setPurchaseInvoices([]);
        setSelectedInvoice(null);

        if (!formData.company) {
            return;
        }

        await fetchSuppliers(
            formData.company,
            branchId
        );

        await fetchPurchaseInvoices({
            companyId:
                formData.company,
            branchId,
            supplierId: "",
        });
    };

    /* =========================================================
       SUPPLIER CHANGE IN FORM
    ========================================================= */

    const handleFormSupplierChange = async (
        supplierId
    ) => {
        setFormData((prev) => ({
            ...prev,
            supplier: supplierId,
            purchaseInvoice: "",
        }));

        setPurchaseInvoices([]);
        setSelectedInvoice(null);

        if (!formData.company) {
            return;
        }

        await fetchPurchaseInvoices({
            companyId:
                formData.company,
            branchId:
                formData.branch,
            supplierId,
        });
    };

    /* =========================================================
       FETCH SELECTED INVOICE
    ========================================================= */

    const fetchInvoiceDetails = async (
        invoiceId
    ) => {
        if (!invoiceId) {
            setSelectedInvoice(null);
            return;
        }

        setInvoiceDetailsLoading(true);

        try {
            const response = await api.get(
                `/purchase-invoices/${invoiceId}`
            );

            const data =
                response.data?.data;

            const invoice =
                data?.invoice ||
                data;

            setSelectedInvoice(
                invoice || null
            );

            if (invoice) {
                const due =
                    Number(
                        invoice.dueAmount ??
                            Number(
                                invoice.totalAmount ||
                                    0
                            ) -
                            Number(
                                invoice.paidAmount ||
                                    0
                            )
                    );

                setFormData((prev) => ({
                    ...prev,
                    amount:
                        due > 0
                            ? due.toFixed(2)
                            : "",
                }));
            }
        } catch (err) {
            console.error(
                "Fetch invoice details error:",
                err
            );

            setSelectedInvoice(null);

            setError(
                err.response?.data?.message ||
                    "Failed to load invoice details"
            );
        } finally {
            setInvoiceDetailsLoading(false);
        }
    };

    /* =========================================================
       INVOICE CHANGE
    ========================================================= */

    const handleInvoiceChange = async (
        invoiceId
    ) => {
        setFormData((prev) => ({
            ...prev,
            purchaseInvoice: invoiceId,
            amount: "",
        }));

        await fetchInvoiceDetails(
            invoiceId
        );
    };

    /* =========================================================
       OPEN CREATE MODAL
    ========================================================= */

    const openCreateModal = async () => {
        setError("");
        setSuccess("");

        setFormData(initialForm);

        setBranches([]);
        setSuppliers([]);
        setPurchaseInvoices([]);

        setSelectedInvoice(null);

        setShowModal(true);

        if (companies.length === 1) {
            const companyId =
                getId(companies[0]);

            await handleFormCompanyChange(
                companyId
            );
        }
    };

    /* =========================================================
       CLOSE CREATE MODAL
    ========================================================= */

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);

        setFormData(initialForm);

        setSelectedInvoice(null);

        setBranches([]);
        setSuppliers([]);
        setPurchaseInvoices([]);

        setError("");
    };

    /* =========================================================
       VALIDATION
    ========================================================= */

    const validateForm = () => {
        if (!formData.company) {
            return "Company is required";
        }

        if (!formData.branch) {
            return "Branch is required";
        }

        if (!formData.supplier) {
            return "Supplier is required";
        }

        if (!formData.purchaseInvoice) {
            return "Purchase invoice is required";
        }

        if (!formData.paymentDate) {
            return "Payment date is required";
        }

        const amount =
            Number(formData.amount);

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return "Payment amount must be greater than 0";
        }

        const dueAmount =
            Number(
                selectedInvoice?.dueAmount ??
                    Number(
                        selectedInvoice?.totalAmount ||
                            0
                    ) -
                    Number(
                        selectedInvoice?.paidAmount ||
                            0
                    )
            );

        if (
            dueAmount > 0 &&
            amount > dueAmount
        ) {
            return `Payment amount cannot exceed due amount of ${formatCurrency(
                dueAmount
            )}`;
        }

        if (!formData.paymentMethod) {
            return "Payment method is required";
        }

        if (
            formData.paymentMethod ===
                "CHEQUE" &&
            !formData.chequeNumber.trim()
        ) {
            return "Cheque number is required for cheque payments";
        }

        return "";
    };

    /* =========================================================
       BUILD PAYLOAD
    ========================================================= */

    const buildPayload = () => {
        const payload = {
            company: formData.company,
            branch: formData.branch,
            supplier: formData.supplier,
            purchaseInvoice:
                formData.purchaseInvoice,

            paymentDate:
                formData.paymentDate,

            amount:
                Number(formData.amount),

            paymentMethod:
                formData.paymentMethod,

            transactionReference:
                formData.transactionReference.trim(),

            bankName:
                formData.bankName.trim(),

            chequeNumber:
                formData.chequeNumber.trim(),

            chequeDate:
                formData.chequeDate || null,

            notes:
                formData.notes.trim(),

            status:
                formData.status || "COMPLETED",
        };

        return payload;
    };

    /* =========================================================
       CREATE PAYMENT
    ========================================================= */

    const handleCreatePayment = async () => {
        setError("");
        setSuccess("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);

        try {
            const payload =
                buildPayload();

            const response =
                await api.post(
                    "/purchase-payments",
                    payload
                );

            setSuccess(
                response.data?.message ||
                    "Purchase payment created successfully"
            );

            closeModal();

            await fetchPayments(
                pagination.page
            );
        } catch (err) {
            console.error(
                "Create purchase payment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to create purchase payment"
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================================================
       VIEW PAYMENT
    ========================================================= */

    const handleViewPayment = async (
        paymentId
    ) => {
        setError("");

        try {
            const response =
                await api.get(
                    `/purchase-payments/${paymentId}`
                );

            setSelectedPayment(
                response.data?.data ||
                    null
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View payment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to load payment details"
            );
        }
    };

    /* =========================================================
       DELETE PAYMENT
    ========================================================= */

    const handleDeletePayment = async (
        payment
    ) => {
        if (!payment?._id) {
            return;
        }

        if (
            payment.status ===
            "COMPLETED"
        ) {
            setError(
                "Completed payments cannot be deleted"
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete payment ${
                    payment.paymentNumber ||
                    ""
                }?`
            );

        if (!confirmed) {
            return;
        }

        setDeletingId(
            payment._id
        );

        setError("");
        setSuccess("");

        try {
            const response =
                await api.delete(
                    `/purchase-payments/${payment._id}`
                );

            setSuccess(
                response.data?.message ||
                    "Purchase payment deleted successfully"
            );

            await fetchPayments(
                pagination.page
            );
        } catch (err) {
            console.error(
                "Delete payment error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to delete purchase payment"
            );
        } finally {
            setDeletingId(null);
        }
    };

    /* =========================================================
       SUMMARY
    ========================================================= */

    const summary = useMemo(() => {
        const total =
            payments.reduce(
                (sum, payment) =>
                    sum +
                    Number(
                        payment.amount || 0
                    ),
                0
            );

        const completed =
            payments.filter(
                (payment) =>
                    payment.status ===
                    "COMPLETED"
            ).length;

        const pending =
            payments.filter(
                (payment) =>
                    payment.status ===
                    "PENDING"
            ).length;

        const cancelled =
            payments.filter(
                (payment) =>
                    payment.status ===
                    "CANCELLED"
            ).length;

        return {
            total,
            completed,
            pending,
            cancelled,
        };
    }, [payments]);

    /* =========================================================
       PAGINATION
    ========================================================= */

    const goToPage = (page) => {
        if (
            page < 1 ||
            page > pagination.pages ||
            page === pagination.page
        ) {
            return;
        }

        fetchPayments(page);
    };

    /* =========================================================
       PAYMENT METHOD SPECIFIC FIELDS
    ========================================================= */

    const showBankField =
        [
            "BANK_TRANSFER",
            "NEFT",
            "RTGS",
            "IMPS",
        ].includes(
            formData.paymentMethod
        );

    const showChequeFields =
        formData.paymentMethod ===
        "CHEQUE";

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="purchase-payments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="purchase-payments-header">

                <div>
                    <h1>
                        Purchase Payments
                    </h1>

                    <p>
                        Manage supplier invoice payments
                    </p>
                </div>

                <div className="purchase-payments-header-actions">

                    <button
                        type="button"
                        className="purchase-payments-refresh-btn"
                        onClick={() =>
                            fetchPayments(
                                pagination.page
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

                    <button
                        type="button"
                        className="purchase-payments-add-btn"
                        onClick={
                            openCreateModal
                        }
                    >
                        <FiPlus />

                        New Payment
                    </button>

                </div>

            </div>


            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="purchase-payments-alert error">

                    <FiAlertCircle />

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
                <div className="purchase-payments-alert success">

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

            <div className="purchase-payments-summary">

                <div className="purchase-payments-summary-card">

                    <div className="summary-icon">
                        <FiDollarSign />
                    </div>

                    <div>
                        <span>
                            Page Payments
                        </span>

                        <strong>
                            {formatCurrency(
                                summary.total
                            )}
                        </strong>
                    </div>

                </div>

                <div className="purchase-payments-summary-card">

                    <div className="summary-icon">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>
                            Completed
                        </span>

                        <strong>
                            {summary.completed}
                        </strong>
                    </div>

                </div>

                <div className="purchase-payments-summary-card">

                    <div className="summary-icon">
                        <FiClock />
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {summary.pending}
                        </strong>
                    </div>

                </div>

                <div className="purchase-payments-summary-card">

                    <div className="summary-icon">
                        <FiAlertCircle />
                    </div>

                    <div>
                        <span>
                            Cancelled
                        </span>

                        <strong>
                            {summary.cancelled}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="purchase-payments-filters">

                <div className="purchase-payments-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search payment, invoice, supplier..."
                        value={
                            filters.search
                        }
                        onChange={(e) =>
                            handleFilterChange(
                                "search",
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {
                            if (
                                e.key ===
                                "Enter"
                            ) {
                                handleSearch();
                            }
                        }}
                    />

                </div>


                <select
                    value={
                        filters.company
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "company",
                            e.target.value
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
                                    getId(
                                        company
                                    )
                                }
                                value={getId(
                                    company
                                )}
                            >
                                {company.name ||
                                    company.legalName}
                            </option>
                        )
                    )}
                </select>


                <select
                    value={
                        filters.branch
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "branch",
                            e.target.value
                        )
                    }
                    disabled={
                        !filters.company
                    }
                >
                    <option value="">
                        All Branches
                    </option>

                    {branches.map(
                        (branch) => (
                            <option
                                key={
                                    getId(
                                        branch
                                    )
                                }
                                value={getId(
                                    branch
                                )}
                            >
                                {branch.name}
                            </option>
                        )
                    )}
                </select>


                <select
                    value={
                        filters.supplier
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "supplier",
                            e.target.value
                        )
                    }
                    disabled={
                        !filters.company
                    }
                >
                    <option value="">
                        All Suppliers
                    </option>

                    {suppliers.map(
                        (supplier) => (
                            <option
                                key={
                                    getId(
                                        supplier
                                    )
                                }
                                value={getId(
                                    supplier
                                )}
                            >
                                {supplier.name}
                                {supplier.supplierCode
                                    ? ` (${supplier.supplierCode})`
                                    : ""}
                            </option>
                        )
                    )}
                </select>


                <select
                    value={
                        filters.purchaseInvoice
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "purchaseInvoice",
                            e.target.value
                        )
                    }
                    disabled={
                        !filters.company
                    }
                >
                    <option value="">
                        All Purchase Invoices
                    </option>

                    {purchaseInvoices.map(
                        (invoice) => (
                            <option
                                key={
                                    getId(
                                        invoice
                                    )
                                }
                                value={getId(
                                    invoice
                                )}
                            >
                                {getInvoiceNumber(
                                    invoice
                                )}
                            </option>
                        )
                    )}
                </select>


                <select
                    value={
                        filters.paymentMethod
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "paymentMethod",
                            e.target.value
                        )
                    }
                >
                    <option value="">
                        All Methods
                    </option>

                    <option value="CASH">
                        Cash
                    </option>

                    <option value="BANK_TRANSFER">
                        Bank Transfer
                    </option>

                    <option value="UPI">
                        UPI
                    </option>

                    <option value="CHEQUE">
                        Cheque
                    </option>

                    <option value="CARD">
                        Card
                    </option>

                    <option value="NEFT">
                        NEFT
                    </option>

                    <option value="RTGS">
                        RTGS
                    </option>

                    <option value="IMPS">
                        IMPS
                    </option>

                    <option value="OTHER">
                        Other
                    </option>
                </select>


                <select
                    value={
                        filters.status
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "status",
                            e.target.value
                        )
                    }
                >
                    <option value="">
                        All Status
                    </option>

                    <option value="PENDING">
                        Pending
                    </option>

                    <option value="COMPLETED">
                        Completed
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>
                </select>


                <input
                    type="date"
                    value={
                        filters.startDate
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "startDate",
                            e.target.value
                        )
                    }
                />

                <input
                    type="date"
                    value={
                        filters.endDate
                    }
                    onChange={(e) =>
                        handleFilterChange(
                            "endDate",
                            e.target.value
                        )
                    }
                />

                <button
                    type="button"
                    className="purchase-payments-filter-btn"
                    onClick={() =>
                        fetchPayments(1)
                    }
                >
                    <FiSearch />
                    Search
                </button>

                <button
                    type="button"
                    className="purchase-payments-reset-btn"
                    onClick={
                        resetFilters
                    }
                >
                    Reset
                </button>

            </div>


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="purchase-payments-table-card">

                <div className="purchase-payments-table-wrapper">

                    <table className="purchase-payments-table">

                        <thead>
                            <tr>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Supplier
                                </th>

                                <th>
                                    Invoice
                                </th>

                                <th>
                                    Method
                                </th>

                                <th>
                                    Amount
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

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="purchase-payments-empty"
                                    >
                                        Loading payments...
                                    </td>
                                </tr>
                            ) : payments.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="purchase-payments-empty"
                                    >
                                        No purchase payments found.
                                    </td>
                                </tr>
                            ) : (
                                payments.map(
                                    (payment) => (
                                        <tr
                                            key={
                                                payment._id
                                            }
                                        >

                                            <td>
                                                <div className="payment-number-cell">

                                                    <strong>
                                                        {
                                                            payment.paymentNumber ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            getSupplierCode(
                                                                payment.supplier
                                                            )
                                                        }
                                                    </span>

                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        payment.paymentDate
                                                    )
                                                }
                                            </td>

                                            <td>
                                                <div className="payment-supplier-cell">

                                                    <strong>
                                                        {
                                                            getSupplierName(
                                                                payment.supplier
                                                            )
                                                        }
                                                    </strong>

                                                    {getSupplierCode(
                                                        payment.supplier
                                                    ) && (
                                                        <small>
                                                            {
                                                                getSupplierCode(
                                                                    payment.supplier
                                                                )
                                                            }
                                                        </small>
                                                    )}

                                                </div>
                                            </td>

                                            <td>
                                                <span className="payment-invoice-code">
                                                    {
                                                        getInvoiceNumber(
                                                            payment.purchaseInvoice
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    getPaymentMethodLabel(
                                                        payment.paymentMethod
                                                    )
                                                }
                                            </td>

                                            <td>
                                                <strong className="payment-amount">
                                                    {formatCurrency(
                                                        payment.amount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={`payment-status-badge ${getPaymentStatusClass(
                                                        payment.status
                                                    )}`}
                                                >
                                                    {
                                                        getStatusLabel(
                                                            payment.status
                                                        )
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <div className="payment-actions">

                                                    <button
                                                        type="button"
                                                        className="payment-action view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleViewPayment(
                                                                payment._id
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    {payment.status !==
                                                        "COMPLETED" && (
                                                        <button
                                                            type="button"
                                                            className="payment-action delete"
                                                            title="Delete"
                                                            disabled={
                                                                deletingId ===
                                                                payment._id
                                                            }
                                                            onClick={() =>
                                                                handleDeletePayment(
                                                                    payment
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
                                )
                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    PAGINATION
                ================================================= */}

                {pagination.pages >
                    1 && (
                    <div className="purchase-payments-pagination">

                        <button
                            type="button"
                            disabled={
                                pagination.page <=
                                1
                            }
                            onClick={() =>
                                goToPage(
                                    pagination.page -
                                        1
                                )
                            }
                        >
                            Previous
                        </button>

                        <span>
                            Page{" "}
                            <strong>
                                {
                                    pagination.page
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {
                                    pagination.pages
                                }
                            </strong>
                        </span>

                        <button
                            type="button"
                            disabled={
                                pagination.page >=
                                pagination.pages
                            }
                            onClick={() =>
                                goToPage(
                                    pagination.page +
                                        1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>
                )}

            </div>


            {/* =================================================
                CREATE PAYMENT MODAL
            ================================================= */}

            {showModal && (
                <div className="purchase-payments-modal-overlay">

                    <div className="purchase-payments-modal">

                        <div className="purchase-payments-modal-header">

                            <div>
                                <h2>
                                    New Purchase Payment
                                </h2>

                                <p>
                                    Record payment against a purchase invoice
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


                        <div className="purchase-payments-modal-body">

                            {/* =====================================
                                BASIC DETAILS
                            ====================================== */}

                            <div className="payment-form-section">

                                <h3 className="payment-section-title">
                                 <FiBriefcase />
                                    Payment Details
                                </h3>

                                <div className="payment-form-grid">

                                    <div className="payment-form-group">

                                        <label>
                                            Company
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
                                                handleFormCompanyChange(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
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
                                                        {company.name ||
                                                            company.legalName}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>


                                    <div className="payment-form-group">

                                        <label>
                                            Branch
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
                                                handleFormBranchChange(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                !formData.company
                                            }
                                        >
                                            <option value="">
                                                Select Branch
                                            </option>

                                            {branches.map(
                                                (
                                                    branch
                                                ) => (
                                                    <option
                                                        key={getId(
                                                            branch
                                                        )}
                                                        value={getId(
                                                            branch
                                                        )}
                                                    >
                                                        {
                                                            branch.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>


                                    <div className="payment-form-group">

                                        <label>
                                            Supplier
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={
                                                formData.supplier
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFormSupplierChange(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                !formData.company
                                            }
                                        >
                                            <option value="">
                                                Select Supplier
                                            </option>

                                            {suppliers.map(
                                                (
                                                    supplier
                                                ) => (
                                                    <option
                                                        key={getId(
                                                            supplier
                                                        )}
                                                        value={getId(
                                                            supplier
                                                        )}
                                                    >
                                                        {
                                                            supplier.name
                                                        }
                                                        {supplier.supplierCode
                                                            ? ` (${supplier.supplierCode})`
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>


                                    <div className="payment-form-group">

                                        <label>
                                            Purchase Invoice
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={
                                                formData.purchaseInvoice
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleInvoiceChange(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                !formData.supplier ||
                                                invoiceLoading
                                            }
                                        >
                                            <option value="">
                                                {invoiceLoading
                                                    ? "Loading invoices..."
                                                    : "Select Purchase Invoice"}
                                            </option>

                                            {purchaseInvoices.map(
                                                (
                                                    invoice
                                                ) => (
                                                    <option
                                                        key={getId(
                                                            invoice
                                                        )}
                                                        value={getId(
                                                            invoice
                                                        )}
                                                    >
                                                        {
                                                            getInvoiceNumber(
                                                                invoice
                                                            )
                                                        }
                                                        {" — Due "}
                                                        {formatCurrency(
                                                            invoice.dueAmount
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>


                                    <div className="payment-form-group">

                                        <label>
                                            Payment Date
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <div className="payment-input-icon">

                                            <FiCalendar />

                                            <input
                                                type="date"
                                                value={
                                                    formData.paymentDate
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        "paymentDate",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>


                                    <div className="payment-form-group">

                                        <label>
                                            Payment Method
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={
                                                formData.paymentMethod
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFormChange(
                                                    "paymentMethod",
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="CASH">
                                                Cash
                                            </option>

                                            <option value="BANK_TRANSFER">
                                                Bank Transfer
                                            </option>

                                            <option value="UPI">
                                                UPI
                                            </option>

                                            <option value="CHEQUE">
                                                Cheque
                                            </option>

                                            <option value="CARD">
                                                Card
                                            </option>

                                            <option value="NEFT">
                                                NEFT
                                            </option>

                                            <option value="RTGS">
                                                RTGS
                                            </option>

                                            <option value="IMPS">
                                                IMPS
                                            </option>

                                            <option value="OTHER">
                                                Other
                                            </option>
                                        </select>

                                    </div>

                                </div>

                            </div>


                            {/* =====================================
                                INVOICE SUMMARY
                            ====================================== */}

                            {invoiceDetailsLoading && (
                                <div className="payment-invoice-loading">
                                    Loading invoice details...
                                </div>
                            )}

                            {selectedInvoice && (
                                <div className="payment-invoice-summary">

                                    <div className="payment-invoice-summary-header">

                                        <div>
                                            <span>
                                                Purchase Invoice
                                            </span>

                                            <strong>
                                                {
                                                    selectedInvoice.internalInvoiceNumber ||
                                                    selectedInvoice.invoiceNumber ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <span
                                            className={`invoice-payment-status ${String(
                                                selectedInvoice.paymentStatus ||
                                                    ""
                                            )
                                                .toLowerCase()
                                                .replace(
                                                    "_",
                                                    "-"
                                                )}`}
                                        >
                                            {
                                                selectedInvoice.paymentStatus ||
                                                "-"
                                            }
                                        </span>

                                    </div>


                                    <div className="payment-invoice-summary-grid">

                                        <div>
                                            <span>
                                                Invoice Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    selectedInvoice.invoiceDate
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Total Amount
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice.totalAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Already Paid
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice.paidAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Current Due
                                            </span>

                                            <strong className="invoice-current-due">
                                                {formatCurrency(
                                                    selectedInvoice.dueAmount
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* =====================================
                                PAYMENT AMOUNT
                            ====================================== */}

                            <div className="payment-form-section">

                                <h3 className="payment-section-title">
                                    <FiDollarSign />
                                    Amount
                                </h3>

                                <div className="payment-form-grid">

                                    <div className="payment-form-group">

                                        <label>
                                            Payment Amount
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <div className="payment-input-icon">

                                            <FiDollarSign />

                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="Enter payment amount"
                                                value={
                                                    formData.amount
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        "amount",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>

                                        {selectedInvoice && (
                                            <small>
                                                Maximum payable:{" "}
                                                <strong>
                                                    {formatCurrency(
                                                        selectedInvoice.dueAmount
                                                    )}
                                                </strong>
                                            </small>
                                        )}

                                    </div>


                                    <div className="payment-form-group">

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            value={
                                                formData.status
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFormChange(
                                                    "status",
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="COMPLETED">
                                                Completed
                                            </option>

                                            <option value="PENDING">
                                                Pending
                                            </option>

                                            <option value="CANCELLED">
                                                Cancelled
                                            </option>
                                        </select>

                                    </div>

                                </div>

                            </div>


                            {/* =====================================
                                BANK DETAILS
                            ====================================== */}

                            {showBankField && (
                                <div className="payment-form-section">

                                    <h3 className="payment-section-title">
                                        <FiCreditCard />
                                        Bank Details
                                    </h3>

                                    <div className="payment-form-grid">

                                        <div className="payment-form-group">

                                            <label>
                                                Bank Name
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="Enter bank name"
                                                value={
                                                    formData.bankName
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        "bankName",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>


                                        <div className="payment-form-group">

                                            <label>
                                                Transaction Reference
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="UTR / Transaction reference"
                                                value={
                                                    formData.transactionReference
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        "transactionReference",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* =====================================
                                CHEQUE DETAILS
                            ====================================== */}

                            {showChequeFields && (
                                <div className="payment-form-section">

                                    <h3 className="payment-section-title">
                                        <FiFileText />
                                        Cheque Details
                                    </h3>

                                    <div className="payment-form-grid">

                                        <div className="payment-form-group">

                                            <label>
                                                Cheque Number
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="Enter cheque number"
                                                value={
                                                    formData.chequeNumber
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        "chequeNumber",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>


                                        <div className="payment-form-group">

                                            <label>
                                                Cheque Date
                                            </label>

                                            <input
                                                type="date"
                                                value={
                                                    formData.chequeDate
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        "chequeDate",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* =====================================
                                NOTES
                            ====================================== */}

                            <div className="payment-form-section">

                                <h3 className="payment-section-title">
                                    <FiFileText />
                                    Additional Information
                                </h3>

                                <div className="payment-form-group full-width">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        rows="4"
                                        placeholder="Enter payment notes..."
                                        value={
                                            formData.notes
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            handleFormChange(
                                                "notes",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

                        <div className="purchase-payments-modal-footer">

                            <button
                                type="button"
                                className="payment-cancel-btn"
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
                                type="button"
                                className="payment-save-btn"
                                onClick={
                                    handleCreatePayment
                                }
                                disabled={
                                    saving ||
                                    invoiceDetailsLoading
                                }
                            >
                                <FiCheckCircle />

                                {saving
                                    ? "Saving..."
                                    : "Create Payment"}
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                VIEW PAYMENT MODAL
            ================================================= */}

            {showViewModal &&
                selectedPayment && (
                    <div className="purchase-payments-modal-overlay">

                        <div className="purchase-payments-modal view-modal">

                            <div className="purchase-payments-modal-header">

                                <div>
                                    <h2>
                                        Payment Details
                                    </h2>

                                    <p>
                                        {
                                            selectedPayment.paymentNumber ||
                                            "-"
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
                                    <FiX />
                                </button>

                            </div>


                            <div className="purchase-payments-view-body">

                                {/* =================================
                                    PAYMENT HEADER
                                ================================== */}

                                <div className="payment-view-header-card">

                                    <div className="payment-view-icon">
                                        <FiDollarSign />
                                    </div>

                                    <div>
                                        <span>
                                            Payment Number
                                        </span>

                                        <strong>
                                            {
                                                selectedPayment.paymentNumber ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <span
                                        className={`payment-status-badge ${getPaymentStatusClass(
                                            selectedPayment.status
                                        )}`}
                                    >
                                        {
                                            getStatusLabel(
                                                selectedPayment.status
                                            )
                                        }
                                    </span>

                                </div>


                                {/* =================================
                                    PAYMENT INFO
                                ================================== */}

                                <div className="payment-view-info-grid">

                                    <div className="payment-view-info-card">

                                        <span>
                                            <FiCalendar />
                                            Payment Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedPayment.paymentDate
                                            )}
                                        </strong>

                                    </div>


                                    <div className="payment-view-info-card">

                                        <span>
                                            <FiDollarSign />
                                            Amount
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                selectedPayment.amount
                                            )}
                                        </strong>

                                    </div>


                                    <div className="payment-view-info-card">

                                        <span>
                                            <FiCreditCard />
                                            Payment Method
                                        </span>

                                        <strong>
                                            {getPaymentMethodLabel(
                                                selectedPayment.paymentMethod
                                            )}
                                        </strong>

                                    </div>


                                    <div className="payment-view-info-card">

                                        <span>
                                            <FiUser />
                                            Supplier
                                        </span>

                                        <strong>
                                            {getSupplierName(
                                                selectedPayment.supplier
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                {/* =================================
                                    INVOICE
                                ================================== */}

                                <div className="payment-view-section">

                                    <h3>
                                        <FiFileText />
                                        Purchase Invoice
                                    </h3>

                                    <div className="payment-view-invoice-card">

                                        <div>
                                            <span>
                                                Invoice
                                            </span>

                                            <strong>
                                                {getInvoiceNumber(
                                                    selectedPayment.purchaseInvoice
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Total
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedPayment
                                                        .purchaseInvoice
                                                        ?.totalAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Paid
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedPayment
                                                        .purchaseInvoice
                                                        ?.paidAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Due
                                            </span>

                                            <strong className="payment-view-due">
                                                {formatCurrency(
                                                    selectedPayment
                                                        .purchaseInvoice
                                                        ?.dueAmount
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                </div>


                                {/* =================================
                                    BANK / CHEQUE
                                ================================== */}

                                {(selectedPayment.bankName ||
                                    selectedPayment.transactionReference ||
                                    selectedPayment.chequeNumber) && (
                                    <div className="payment-view-section">

                                        <h3>
                                            <FiCreditCard />
                                            Transaction Details
                                        </h3>

                                        <div className="payment-view-details-grid">

                                            {selectedPayment.bankName && (
                                                <div>
                                                    <span>
                                                        Bank Name
                                                    </span>

                                                    <strong>
                                                        {
                                                            selectedPayment.bankName
                                                        }
                                                    </strong>
                                                </div>
                                            )}

                                            {selectedPayment.transactionReference && (
                                                <div>
                                                    <span>
                                                        Transaction Reference
                                                    </span>

                                                    <strong>
                                                        {
                                                            selectedPayment.transactionReference
                                                        }
                                                    </strong>
                                                </div>
                                            )}

                                            {selectedPayment.chequeNumber && (
                                                <div>
                                                    <span>
                                                        Cheque Number
                                                    </span>

                                                    <strong>
                                                        {
                                                            selectedPayment.chequeNumber
                                                        }
                                                    </strong>
                                                </div>
                                            )}

                                            {selectedPayment.chequeDate && (
                                                <div>
                                                    <span>
                                                        Cheque Date
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            selectedPayment.chequeDate
                                                        )}
                                                    </strong>
                                                </div>
                                            )}

                                        </div>

                                    </div>
                                )}


                                {/* =================================
                                    NOTES
                                ================================== */}

                                {selectedPayment.notes && (
                                    <div className="payment-view-notes">

                                        <h3>
                                            Notes
                                        </h3>

                                        <p>
                                            {
                                                selectedPayment.notes
                                            }
                                        </p>

                                    </div>
                                )}

                            </div>


                            <div className="purchase-payments-modal-footer">

                                <button
                                    type="button"
                                    className="payment-cancel-btn"
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
}

export default PurchasePayments;