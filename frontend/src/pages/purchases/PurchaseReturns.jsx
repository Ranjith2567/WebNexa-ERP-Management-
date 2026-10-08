import { useEffect, useMemo, useState } from "react";

import {
    FiPlus,
    FiSearch,
    FiRefreshCw,
    FiEye,
    FiTrash2,
    FiX,
    FiRotateCcw,
    FiCalendar,
    FiTruck,
    FiFileText,
    FiPackage,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";

import "../../styles/purchaseReturns.css";

// ======================================================
// CONSTANTS
// ======================================================

const RETURN_REASONS = [
    {
        value: "DAMAGED",
        label: "Damaged",
    },
    {
        value: "DEFECTIVE",
        label: "Defective",
    },
    {
        value: "WRONG_PRODUCT",
        label: "Wrong Product",
    },
    {
        value: "EXCESS_QUANTITY",
        label: "Excess Quantity",
    },
    {
        value: "QUALITY_ISSUE",
        label: "Quality Issue",
    },
    {
        value: "EXPIRED",
        label: "Expired",
    },
    {
        value: "OTHER",
        label: "Other",
    },
];

const STATUS_OPTIONS = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "PROCESSED",
    "REFUNDED",
    "CANCELLED",
    "REJECTED",
];

// ======================================================
// HELPERS
// ======================================================

const getArray = (response, keys = []) => {
    const data = response?.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(response)) {
        return response;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }

        if (Array.isArray(response?.[key])) {
            return response[key];
        }
    }

    return [];
};

const getId = (value) => {
    if (!value) return "";

    if (typeof value === "string") {
        return value;
    }

    return value._id || "";
};

const formatDate = (date) => {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return "-";
    }

    return value.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateInput = (date) => {
    if (!date) {
        return new Date().toISOString().split("T")[0];
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return new Date().toISOString().split("T")[0];
    }

    return value.toISOString().split("T")[0];
};

const formatAmount = (amount) => {
    const value = Number(amount || 0);

    return value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getSupplierName = (supplier) => {
    if (!supplier) return "-";

    return (
        supplier.name ||
        supplier.companyName ||
        supplier.supplierCode ||
        "-"
    );
};

const getProductName = (product) => {
    if (!product) return "-";

    return (
        product.name ||
        product.productName ||
        product.sku ||
        "-"
    );
};

const getProductSku = (product) => {
    if (!product) return "-";

    return (
        product.sku ||
        product.barcode ||
        "-"
    );
};

const getReasonLabel = (reason) => {
    const item = RETURN_REASONS.find(
        (entry) => entry.value === reason
    );

    return item?.label || reason || "-";
};

const getStatusClass = (status) => {
    switch (status) {
        case "DRAFT":
            return "purchase-return-status-draft";

        case "PENDING_APPROVAL":
            return "purchase-return-status-pending";

        case "APPROVED":
            return "purchase-return-status-approved";

        case "PROCESSED":
            return "purchase-return-status-processed";

        case "REFUNDED":
            return "purchase-return-status-refunded";

        case "CANCELLED":
            return "purchase-return-status-cancelled";

        case "REJECTED":
            return "purchase-return-status-rejected";

        default:
            return "";
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case "DRAFT":
            return <FiFileText />;

        case "PENDING_APPROVAL":
            return <FiClock />;

        case "APPROVED":
        case "PROCESSED":
        case "REFUNDED":
            return <FiCheckCircle />;

        case "CANCELLED":
        case "REJECTED":
            return <FiXCircle />;

        default:
            return null;
    }
};

const getInitialForm = () => ({
    company: "",
    branch: "",
    supplier: "",

    purchaseOrder: "",
    goodsReceipt: "",
    purchaseInvoice: "",

    returnDate: new Date()
        .toISOString()
        .split("T")[0],

    reason: "DAMAGED",

    creditNoteNumber: "",

    notes: "",

    sourceType: "",

    items: [],
});

// ======================================================
// COMPONENT
// ======================================================

function PurchaseReturns() {
    // ==================================================
    // LIST STATE
    // ==================================================

    const [returns, setReturns] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [filterBranches, setFilterBranches] = useState([]);
    const [filterSuppliers, setFilterSuppliers] = useState([]);

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [goodsReceipts, setGoodsReceipts] = useState([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] =
        useState("");

    const [search, setSearch] = useState("");

    const [filters, setFilters] = useState({
        company: "",
        branch: "",
        supplier: "",
        purchaseOrder: "",
        goodsReceipt: "",
        purchaseInvoice: "",
        status: "",
        reason: "",
        startDate: "",
        endDate: "",
    });

    const [page, setPage] = useState(1);
    const limit = 20;

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalRecords, setTotalRecords] =
        useState(0);

    // ==================================================
    // CREATE MODAL
    // ==================================================

    const [showModal, setShowModal] =
        useState(false);

    const [formData, setFormData] =
        useState(getInitialForm());

    const [sourceItems, setSourceItems] =
        useState([]);

    const [sourceLoading, setSourceLoading] =
        useState(false);

    // ==================================================
    // VIEW MODAL
    // ==================================================

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedReturn, setSelectedReturn] =
        useState(null);

    const [selectedReturnItems, setSelectedReturnItems] =
        useState([]);

    const [viewLoading, setViewLoading] =
        useState(false);

    // ==================================================
    // LOAD COMPANIES
    // ==================================================

    const fetchCompanies = async () => {
        try {
            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            setCompanies(
                getArray(response, [
                    "companies",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load companies:",
                err
            );
        }
    };

    // ==================================================
    // LOAD BRANCHES
    // ==================================================

    const fetchBranches = async (
        companyId
    ) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setBranches(
                getArray(response, [
                    "branches",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load branches:",
                err
            );

            setBranches([]);
        }
    };

    // ==================================================
    // LOAD SUPPLIERS
    // ==================================================

    const fetchSuppliers = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setSuppliers([]);
            return;
        }

        try {
            const response = await api.get(
                `/suppliers?company=${companyId}&branch=${branchId}&page=1&limit=100`
            );

            setSuppliers(
                getArray(response, [
                    "suppliers",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load suppliers:",
                err
            );

            setSuppliers([]);
        }
    };

    // ==================================================
    // FILTER BRANCHES
    // ==================================================

    const fetchFilterBranches = async (
        companyId
    ) => {
        if (!companyId) {
            setFilterBranches([]);
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setFilterBranches(
                getArray(response, [
                    "branches",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load filter branches:",
                err
            );

            setFilterBranches([]);
        }
    };

    // ==================================================
    // FILTER SUPPLIERS
    // ==================================================

    const fetchFilterSuppliers = async (
        companyId,
        branchId
    ) => {
        if (!companyId) {
            setFilterSuppliers([]);
            return;
        }

        try {
            let url =
                `/suppliers?company=${companyId}&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response =
                await api.get(url);

            setFilterSuppliers(
                getArray(response, [
                    "suppliers",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load filter suppliers:",
                err
            );

            setFilterSuppliers([]);
        }
    };

    // ==================================================
    // LOAD SOURCE DOCUMENT LISTS
    // ==================================================
const fetchPurchaseOrders = async () => {
    if (
        !formData.company ||
        !formData.branch
    ) {
        setPurchaseOrders([]);
        return;
    }

    try {
        console.log("PO FETCH:", {
            company: formData.company,
            branch: formData.branch,
        });

        const response = await api.get(
            `/purchase-orders?company=${formData.company}&branch=${formData.branch}&page=1&limit=100`
        );

        console.log(
            "PO RESPONSE:",
            response.data
        );

        setPurchaseOrders(
            getArray(response, [
                "purchaseOrders",
                "orders",
                "data",
            ])
        );
    } catch (err) {
        console.error(
            "Failed to load purchase orders:",
            err
        );

        setPurchaseOrders([]);
    }
};

    const fetchGoodsReceipts = async () => {
        if (
            !formData.company ||
            !formData.branch ||
            !formData.supplier
        ) {
            setGoodsReceipts([]);
            return;
        }

        try {
            const response = await api.get(
                `/goods-receipts?company=${formData.company}&branch=${formData.branch}&supplier=${formData.supplier}&page=1&limit=100`
            );

            setGoodsReceipts(
                getArray(response, [
                    "goodsReceipts",
                    "receipts",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load goods receipts:",
                err
            );

            setGoodsReceipts([]);
        }
    };

    const fetchPurchaseInvoices = async () => {
        if (
            !formData.company ||
            !formData.branch ||
            !formData.supplier
        ) {
            setPurchaseInvoices([]);
            return;
        }

        try {
            const response = await api.get(
                `/purchase-invoices?company=${formData.company}&branch=${formData.branch}&supplier=${formData.supplier}&page=1&limit=100`
            );

            setPurchaseInvoices(
                getArray(response, [
                    "purchaseInvoices",
                    "invoices",
                    "data",
                ])
            );
        } catch (err) {
            console.error(
                "Failed to load purchase invoices:",
                err
            );

            setPurchaseInvoices([]);
        }
    };

    // ==================================================
    // FETCH RETURNS
    // ==================================================

    const fetchReturns = async (
        showLoader = true
    ) => {
        try {
            if (showLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            const params =
                new URLSearchParams();

            params.append(
                "page",
                page.toString()
            );

            params.append(
                "limit",
                limit.toString()
            );

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            Object.entries(filters).forEach(
                ([key, value]) => {
                    if (value) {
                        params.append(
                            key,
                            value
                        );
                    }
                }
            );

            const response = await api.get(
                `/purchase-returns?${params.toString()}`
            );

            const responseData =
                response?.data || {};

            const list =
                responseData.data || [];

            const pagination =
                responseData.pagination || {};

            setReturns(
                Array.isArray(list)
                    ? list
                    : []
            );

            setTotalRecords(
                Number(
                    pagination.total || 0
                )
            );

            setTotalPages(
                Math.max(
                    Number(
                        pagination.pages || 1
                    ),
                    1
                )
            );
        } catch (err) {
            console.error(
                "Failed to load purchase returns:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load purchase returns"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        fetchReturns();
    }, [
        page,
        filters.company,
        filters.branch,
        filters.supplier,
        filters.purchaseOrder,
        filters.goodsReceipt,
        filters.purchaseInvoice,
        filters.status,
        filters.reason,
        filters.startDate,
        filters.endDate,
    ]);

    // ==================================================
    // FORM COMPANY CHANGE
    // ==================================================

    useEffect(() => {
        if (!formData.company) {
            setBranches([]);
            setSuppliers([]);
            setPurchaseOrders([]);
            setGoodsReceipts([]);
            setPurchaseInvoices([]);

            setFormData((prev) => ({
                ...prev,
                branch: "",
                supplier: "",
                purchaseOrder: "",
                goodsReceipt: "",
                purchaseInvoice: "",
                sourceType: "",
                items: [],
            }));

            return;
        }

        fetchBranches(formData.company);
    }, [formData.company]);

    // ==================================================
    // FORM BRANCH CHANGE
    // ==================================================

    useEffect(() => {
        if (
            !formData.company ||
            !formData.branch
        ) {
            setSuppliers([]);
            setPurchaseOrders([]);
            setGoodsReceipts([]);
            setPurchaseInvoices([]);

            return;
        }

        fetchSuppliers(
            formData.company,
            formData.branch
        );
    }, [formData.branch]);

    // ==================================================
    // FORM SUPPLIER CHANGE
    // ==================================================

    useEffect(() => {
        if (
            !formData.company ||
            !formData.branch ||
            !formData.supplier
        ) {
            setPurchaseOrders([]);
            setGoodsReceipts([]);
            setPurchaseInvoices([]);

            return;
        }

        fetchPurchaseOrders();
        fetchGoodsReceipts();
        fetchPurchaseInvoices();
    }, [formData.supplier]);

    // ==================================================
    // FILTER COMPANY CHANGE
    // ==================================================

    useEffect(() => {
        fetchFilterBranches(
            filters.company
        );

        fetchFilterSuppliers(
            filters.company,
            filters.branch
        );
    }, [filters.company]);

    // ==================================================
    // FILTER BRANCH CHANGE
    // ==================================================

    useEffect(() => {
        fetchFilterSuppliers(
            filters.company,
            filters.branch
        );
    }, [filters.branch]);

    // ==================================================
    // SEARCH
    // ==================================================

    const handleSearch = () => {
        setPage(1);
        fetchReturns();
    };

    const handleSearchKeyDown = (
        event
    ) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    // ==================================================
    // FILTER CHANGE
    // ==================================================

    const handleFilterChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setPage(1);

        setFilters((prev) => ({
            ...prev,
            [name]: value,

            ...(name === "company"
                ? {
                      branch: "",
                      supplier: "",
                  }
                : {}),

            ...(name === "branch"
                ? {
                      supplier: "",
                  }
                : {}),
        }));
    };

    // ==================================================
    // RESET FILTERS
    // ==================================================

    const resetFilters = () => {
        setSearch("");

        setFilters({
            company: "",
            branch: "",
            supplier: "",
            purchaseOrder: "",
            goodsReceipt: "",
            purchaseInvoice: "",
            status: "",
            reason: "",
            startDate: "",
            endDate: "",
        });

        setPage(1);
    };

    // ==================================================
    // CREATE MODAL
    // ==================================================

    const openCreateModal = () => {
        setError("");
        setSuccessMessage("");

        setFormData(
            getInitialForm()
        );

        setSourceItems([]);

        setShowModal(true);
    };

    const closeCreateModal = () => {
        if (saving) return;

        setShowModal(false);
        setSourceItems([]);

        setFormData(
            getInitialForm()
        );
    };

    // ==================================================
    // FORM CHANGE
    // ==================================================

    const handleFormChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==================================================
    // SOURCE TYPE CHANGE
    // ==================================================

    const handleSourceTypeChange = (
        event
    ) => {
        const sourceType =
            event.target.value;

        setSourceItems([]);

        setFormData((prev) => ({
            ...prev,

            sourceType,

            purchaseOrder:
                sourceType ===
                "PURCHASE_ORDER"
                    ? prev.purchaseOrder
                    : "",

            goodsReceipt:
                sourceType ===
                "GOODS_RECEIPT"
                    ? prev.goodsReceipt
                    : "",

            purchaseInvoice:
                sourceType ===
                "PURCHASE_INVOICE"
                    ? prev.purchaseInvoice
                    : "",

            items: [],
        }));
    };

    // ==================================================
    // SOURCE DOCUMENT CHANGE
    // ==================================================

    const handleSourceDocumentChange = async (
        event
    ) => {
        const sourceId =
            event.target.value;

        const sourceType =
            formData.sourceType;

        setFormData((prev) => ({
            ...prev,

            purchaseOrder:
                sourceType ===
                "PURCHASE_ORDER"
                    ? sourceId
                    : "",

            goodsReceipt:
                sourceType ===
                "GOODS_RECEIPT"
                    ? sourceId
                    : "",

            purchaseInvoice:
                sourceType ===
                "PURCHASE_INVOICE"
                    ? sourceId
                    : "",

            items: [],
        }));

        setSourceItems([]);

        if (!sourceId) {
            return;
        }

        try {
            setSourceLoading(true);
            setError("");

            let endpoint = "";

            if (
                sourceType ===
                "PURCHASE_ORDER"
            ) {
                endpoint =
                    `/purchase-orders/${sourceId}`;
            }

            if (
                sourceType ===
                "GOODS_RECEIPT"
            ) {
                endpoint =
                    `/goods-receipts/${sourceId}`;
            }

            if (
                sourceType ===
                "PURCHASE_INVOICE"
            ) {
                endpoint =
                    `/purchase-invoices/${sourceId}`;
            }

            if (!endpoint) {
                return;
            }

            const response =
                await api.get(endpoint);

            const data =
                response?.data?.data ||
                {};

            const items =
                Array.isArray(
                    data.items
                )
                    ? data.items
                    : [];

            setSourceItems(items);
        } catch (err) {
            console.error(
                "Failed to load source document:",
                err
            );

            setSourceItems([]);

            setError(
                err?.response?.data?.message ||
                    "Failed to load source document"
            );
        } finally {
            setSourceLoading(false);
        }
    };

    // ==================================================
    // SOURCE ITEM HELPERS
    // ==================================================

    const getSourceItemProduct = (
        item
    ) => {
        if (!item) return null;

        return (
            item.product ||
            item.productId ||
            null
        );
    };

    const getSourceItemAvailableQuantity = (
        item
    ) => {
        if (!item) return 0;

        /*
         * Priority depends on source document.
         * We use the source's actual item quantity
         * fields without creating frontend totals.
         */

        if (
            formData.sourceType ===
            "PURCHASE_ORDER"
        ) {
            return Number(
                item.quantity ||
                    item.orderedQuantity ||
                    0
            );
        }

        if (
            formData.sourceType ===
            "GOODS_RECEIPT"
        ) {
            return Number(
                item.receivedQuantity ||
                    item.acceptedQuantity ||
                    item.quantity ||
                    0
            );
        }

        if (
            formData.sourceType ===
            "PURCHASE_INVOICE"
        ) {
            return Number(
                item.quantity ||
                    item.invoicedQuantity ||
                    0
            );
        }

        return Number(
            item.quantity ||
                item.receivedQuantity ||
                item.acceptedQuantity ||
                0
        );
    };

    const getSourceItemUnitPrice = (
        item
    ) => {
        return Number(
            item?.unitPrice ??
                item?.purchasePrice ??
                item?.price ??
                0
        );
    };

    // ==================================================
    // ADD RETURN ITEM
    // ==================================================

    const addReturnItem = (
        sourceItem
    ) => {
        const product =
            getSourceItemProduct(
                sourceItem
            );

        const productId =
            getId(product);

        if (!productId) {
            setError(
                "Product information is missing from the selected source item"
            );

            return;
        }

        const alreadyAdded =
            formData.items.some(
                (item) =>
                    item.product ===
                    productId
            );

        if (alreadyAdded) {
            setError(
                "This product is already added to the return"
            );

            return;
        }

        const availableQuantity =
            getSourceItemAvailableQuantity(
                sourceItem
            );

        if (
            !Number.isFinite(
                availableQuantity
            ) ||
            availableQuantity <= 0
        ) {
            setError(
                "This item has no returnable quantity"
            );

            return;
        }

        const item = {
            product: productId,

            purchaseOrderItem:
                formData.sourceType ===
                "PURCHASE_ORDER"
                    ? sourceItem._id
                    : "",

            goodsReceiptItem:
                formData.sourceType ===
                "GOODS_RECEIPT"
                    ? sourceItem._id
                    : "",

            purchaseInvoiceItem:
                formData.sourceType ===
                "PURCHASE_INVOICE"
                    ? sourceItem._id
                    : "",

            quantity: 1,

            reason:
                formData.reason,

            batchNumber: "",

            serialNumbers: [],

            notes: "",

            availableQuantity,

            sourceProduct: product,

            sourceItem,
        };

        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                item,
            ],
        }));

        setError("");
    };

    // ==================================================
    // UPDATE RETURN ITEM
    // ==================================================

    const updateReturnItem = (
        index,
        field,
        value
    ) => {
        setFormData((prev) => {
            const items = [
                ...prev.items,
            ];

            const current =
                items[index];

            if (!current) {
                return prev;
            }

            let nextValue = value;

            if (field === "quantity") {
                nextValue =
                    Number(value);
            }

            if (
                field ===
                "reason"
            ) {
                nextValue = value;
            }

            items[index] = {
                ...current,
                [field]:
                    nextValue,
            };

            return {
                ...prev,
                items,
            };
        });
    };

    // ==================================================
    // REMOVE RETURN ITEM
    // ==================================================

    const removeReturnItem = (
        index
    ) => {
        setFormData((prev) => ({
            ...prev,

            items: prev.items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            ),
        }));
    };

    // ==================================================
    // CREATE PURCHASE RETURN
    // ==================================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setError("");
        setSuccessMessage("");

        if (!formData.company) {
            setError(
                "Company is required"
            );
            return;
        }

        if (!formData.branch) {
            setError(
                "Branch is required"
            );
            return;
        }

        if (!formData.supplier) {
            setError(
                "Supplier is required"
            );
            return;
        }

        if (!formData.returnDate) {
            setError(
                "Return date is required"
            );
            return;
        }

        if (!formData.reason) {
            setError(
                "Return reason is required"
            );
            return;
        }

        if (
            formData.items.length ===
            0
        ) {
            setError(
                "Add at least one product to the return"
            );
            return;
        }

        for (
            const item of formData.items
        ) {
            const quantity =
                Number(
                    item.quantity
                );

            if (
                !Number.isFinite(
                    quantity
                ) ||
                quantity <= 0
            ) {
                setError(
                    "Return quantity must be greater than 0"
                );
                return;
            }

            if (
                quantity >
                Number(
                    item.availableQuantity
                )
            ) {
                setError(
                    `Return quantity cannot exceed available quantity for ${getProductName(
                        item.sourceProduct
                    )}`
                );
                return;
            }
        }

        try {
            setSaving(true);

            const payload = {
                company:
                    formData.company,

                branch:
                    formData.branch,

                supplier:
                    formData.supplier,

                ...(formData.purchaseOrder
                    ? {
                          purchaseOrder:
                              formData.purchaseOrder,
                      }
                    : {}),

                ...(formData.goodsReceipt
                    ? {
                          goodsReceipt:
                              formData.goodsReceipt,
                      }
                    : {}),

                ...(formData.purchaseInvoice
                    ? {
                          purchaseInvoice:
                              formData.purchaseInvoice,
                      }
                    : {}),

                returnDate:
                    formData.returnDate,

                reason:
                    formData.reason,

                creditNoteNumber:
                    formData.creditNoteNumber.trim(),

                notes:
                    formData.notes.trim(),

                items:
                    formData.items.map(
                        (item) => ({
                            product:
                                item.product,

                            ...(item.purchaseOrderItem
                                ? {
                                      purchaseOrderItem:
                                          item.purchaseOrderItem,
                                  }
                                : {}),

                            ...(item.goodsReceiptItem
                                ? {
                                      goodsReceiptItem:
                                          item.goodsReceiptItem,
                                  }
                                : {}),

                            ...(item.purchaseInvoiceItem
                                ? {
                                      purchaseInvoiceItem:
                                          item.purchaseInvoiceItem,
                                  }
                                : {}),

                            quantity:
                                Number(
                                    item.quantity
                                ),

                            reason:
                                item.reason ||
                                formData.reason,

                            batchNumber:
                                item.batchNumber.trim(),

                            serialNumbers:
                                Array.isArray(
                                    item.serialNumbers
                                )
                                    ? item.serialNumbers
                                    : [],

                            notes:
                                item.notes.trim(),
                        })
                    ),
            };

            const response =
                await api.post(
                    "/purchase-returns",
                    payload
                );

            setSuccessMessage(
                response?.data?.message ||
                    "Purchase return created successfully"
            );

            setShowModal(false);

            setFormData(
                getInitialForm()
            );

            setSourceItems([]);

            setPage(1);

            await fetchReturns(false);
        } catch (err) {
            console.error(
                "Failed to create purchase return:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to create purchase return"
            );
        } finally {
            setSaving(false);
        }
    };

    // ==================================================
    // VIEW PURCHASE RETURN
    // ==================================================

    const handleView = async (
        returnId
    ) => {
        try {
            setViewLoading(true);
            setError("");

            const response =
                await api.get(
                    `/purchase-returns/${returnId}`
                );

            const data =
                response?.data?.data ||
                {};

            setSelectedReturn(
                data.purchaseReturn ||
                    null
            );

            setSelectedReturnItems(
                Array.isArray(
                    data.items
                )
                    ? data.items
                    : []
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "Failed to load purchase return:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load purchase return"
            );
        } finally {
            setViewLoading(false);
        }
    };

    const closeViewModal = () => {
        if (viewLoading) return;

        setShowViewModal(false);
        setSelectedReturn(null);
        setSelectedReturnItems([]);
    };

    // ==================================================
    // DELETE
    // ==================================================

    const handleDelete = async (
        item
    ) => {
        if (
            ![
                "DRAFT",
                "REJECTED",
            ].includes(item.status)
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete purchase return ${item.returnNumber}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(
                `/purchase-returns/${item._id}`
            );

            setSuccessMessage(
                "Purchase return deleted successfully"
            );

            await fetchReturns(false);
        } catch (err) {
            console.error(
                "Failed to delete purchase return:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to delete purchase return"
            );
        }
    };

    // ==================================================
    // PAGINATION
    // ==================================================

    const goToPage = (
        nextPage
    ) => {
        if (
            nextPage < 1 ||
            nextPage > totalPages
        ) {
            return;
        }

        setPage(nextPage);
    };

    // ==================================================
    // SUMMARY
    // ==================================================

    const summary = useMemo(() => {
        const totalAmount =
            returns.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.totalAmount ||
                            0
                    ),
                0
            );

        const pending =
            returns.filter(
                (item) =>
                    item.status ===
                    "PENDING_APPROVAL"
            ).length;

        const processed =
            returns.filter(
                (item) =>
                    item.status ===
                    "PROCESSED"
            ).length;

        const rejected =
            returns.filter(
                (item) =>
                    item.status ===
                    "REJECTED"
            ).length;

        return {
            totalAmount,
            pending,
            processed,
            rejected,
        };
    }, [returns]);

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="purchase-returns-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="purchase-returns-header">

                <div className="purchase-returns-header-left">

                    <div className="purchase-returns-title-row">

                        <div className="purchase-returns-title-icon">
                            <FiRotateCcw />
                        </div>

                        <div>
                            <h1>
                                Purchase Returns
                            </h1>

                            <p>
                                Manage supplier purchase returns
                            </p>
                        </div>

                    </div>

                </div>

                <div className="purchase-returns-header-actions">

                    <button
                        type="button"
                        className="purchase-returns-refresh-btn"
                        onClick={() =>
                            fetchReturns(false)
                        }
                        disabled={
                            refreshing
                        }
                    >
                        <FiRefreshCw
                            className={
                                refreshing
                                    ? "spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        className="purchase-returns-add-btn"
                        onClick={
                            openCreateModal
                        }
                    >
                        <FiPlus />

                        New Purchase Return
                    </button>

                </div>

            </div>

            {/* ==================================================
                ALERTS
            ================================================== */}

            {error && (
                <div className="purchase-returns-alert error">

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

            {successMessage && (
                <div className="purchase-returns-alert success">

                    <FiCheckCircle />

                    <span>
                        {successMessage}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccessMessage("")
                        }
                    >
                        <FiX />
                    </button>

                </div>
            )}

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="purchase-returns-summary">

                <div className="purchase-returns-summary-card">

                    <div className="summary-icon total">
                        <FiRotateCcw />
                    </div>

                    <div className="purchase-returns-summary-info">

                        <span className="purchase-returns-summary-label">
                            Page Return Value
                        </span>

                        <strong className="purchase-returns-summary-value">
                            ₹
                            {formatAmount(
                                summary.totalAmount
                            )}
                        </strong>

                    </div>

                </div>

                <div className="purchase-returns-summary-card">

                    <div className="summary-icon pending">
                        <FiClock />
                    </div>

                    <div className="purchase-returns-summary-info">

                        <span className="purchase-returns-summary-label">
                            Pending Approval
                        </span>

                        <strong className="purchase-returns-summary-value">
                            {summary.pending}
                        </strong>

                    </div>

                </div>

                <div className="purchase-returns-summary-card">

                    <div className="summary-icon processed">
                        <FiCheckCircle />
                    </div>

                    <div className="purchase-returns-summary-info">

                        <span className="purchase-returns-summary-label">
                            Processed
                        </span>

                        <strong className="purchase-returns-summary-value">
                            {summary.processed}
                        </strong>

                    </div>

                </div>

                <div className="purchase-returns-summary-card">

                    <div className="summary-icon rejected">
                        <FiXCircle />
                    </div>

                    <div className="purchase-returns-summary-info">

                        <span className="purchase-returns-summary-label">
                            Rejected
                        </span>

                        <strong className="purchase-returns-summary-value">
                            {summary.rejected}
                        </strong>

                    </div>

                </div>

            </div>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="purchase-returns-filters">

                <div className="purchase-returns-filter-row">

                    <div className="purchase-returns-search">

                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search return number, supplier, PO, GRN or invoice..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            onKeyDown={
                                handleSearchKeyDown
                            }
                        />

                    </div>

                    <select
                        name="company"
                        value={
                            filters.company
                        }
                        onChange={
                            handleFilterChange
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
                        name="branch"
                        value={
                            filters.branch
                        }
                        onChange={
                            handleFilterChange
                        }
                        disabled={
                            !filters.company
                        }
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
                                    {branch.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        name="supplier"
                        value={
                            filters.supplier
                        }
                        onChange={
                            handleFilterChange
                        }
                        disabled={
                            !filters.company
                        }
                    >
                        <option value="">
                            All Suppliers
                        </option>

                        {filterSuppliers.map(
                            (supplier) => (
                                <option
                                    key={
                                        supplier._id
                                    }
                                    value={
                                        supplier._id
                                    }
                                >
                                    {getSupplierName(
                                        supplier
                                    )}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        name="status"
                        value={
                            filters.status
                        }
                        onChange={
                            handleFilterChange
                        }
                    >
                        <option value="">
                            All Status
                        </option>

                        {STATUS_OPTIONS.map(
                            (status) => (
                                <option
                                    key={
                                        status
                                    }
                                    value={
                                        status
                                    }
                                >
                                    {status.replace(
                                        /_/g,
                                        " "
                                    )}
                                </option>
                            )
                        )}
                    </select>

                </div>

                <div className="purchase-returns-filter-bottom">

                    <select
                        name="reason"
                        value={
                            filters.reason
                        }
                        onChange={
                            handleFilterChange
                        }
                    >
                        <option value="">
                            All Reasons
                        </option>

                        {RETURN_REASONS.map(
                            (reason) => (
                                <option
                                    key={
                                        reason.value
                                    }
                                    value={
                                        reason.value
                                    }
                                >
                                    {reason.label}
                                </option>
                            )
                        )}
                    </select>

                    <input
                        type="date"
                        name="startDate"
                        value={
                            filters.startDate
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                    <input
                        type="date"
                        name="endDate"
                        value={
                            filters.endDate
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                    <button
                        type="button"
                        className="purchase-returns-filter-btn"
                        onClick={
                            handleSearch
                        }
                    >
                        <FiSearch />
                        Search
                    </button>

                    <button
                        type="button"
                        className="purchase-returns-reset-btn"
                        onClick={
                            resetFilters
                        }
                    >
                        Reset
                    </button>

                </div>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="purchase-returns-table-card">

                <div className="purchase-returns-table-header">

                    <div>
                        <h2>
                            Purchase Return Records
                        </h2>

                        <span>
                            {totalRecords} total records
                        </span>
                    </div>

                    <button
                        type="button"
                        className="purchase-returns-table-refresh"
                        onClick={() =>
                            fetchReturns(false)
                        }
                        disabled={
                            refreshing
                        }
                    >
                        <FiRefreshCw
                            className={
                                refreshing
                                    ? "spin"
                                    : ""
                            }
                        />
                    </button>

                </div>

                {loading ? (
                    <div className="purchase-returns-loading">

                        <div className="purchase-returns-spinner" />

                        <p>
                            Loading purchase returns...
                        </p>

                    </div>
                ) : returns.length === 0 ? (
                    <div className="purchase-returns-empty">

                        <div className="empty-icon">
                            <FiRotateCcw />
                        </div>

                        <h3>
                            No Purchase Returns Found
                        </h3>

                        <p>
                            No purchase return records
                            match your current filters.
                        </p>

                        <button
                            type="button"
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />
                            Create Purchase Return
                        </button>

                    </div>
                ) : (
                    <div className="purchase-returns-table-wrapper">

                        <table className="purchase-returns-table">

                            <thead>
                                <tr>

                                    <th>
                                        Return Number
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Supplier
                                    </th>

                                    <th>
                                        Reference
                                    </th>

                                    <th>
                                        Reason
                                    </th>

                                    <th>
                                        Quantity
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

                                {returns.map(
                                    (item) => (
                                        <tr
                                            key={
                                                item._id
                                            }
                                        >

                                            <td>
                                                <div className="return-number-cell">

                                                    <FiRotateCcw />

                                                    <strong>
                                                        {
                                                            item.returnNumber
                                                        }
                                                    </strong>

                                                </div>
                                            </td>

                                            <td>
                                                <div className="return-date-cell">

                                                    <FiCalendar />

                                                    {formatDate(
                                                        item.returnDate
                                                    )}

                                                </div>
                                            </td>

                                            <td>
                                                <div className="return-supplier-cell">

                                                    <strong>
                                                        {getSupplierName(
                                                            item.supplier
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {item
                                                            .supplier
                                                            ?.supplierCode ||
                                                            "-"}
                                                    </span>

                                                </div>
                                            </td>

                                            <td>
                                                <div className="return-reference-cell">

                                                    {item.purchaseInvoice ? (
                                                        <span>
                                                            <FiFileText />

                                                            {item
                                                                .purchaseInvoice
                                                                ?.invoiceNumber ||
                                                                item
                                                                    .purchaseInvoice
                                                                    ?.internalInvoiceNumber ||
                                                                "-"}
                                                        </span>
                                                    ) : item.goodsReceipt ? (
                                                        <span>
                                                            <FiPackage />

                                                            {item
                                                                .goodsReceipt
                                                                ?.grnNumber ||
                                                                "-"}
                                                        </span>
                                                    ) : item.purchaseOrder ? (
                                                        <span>
                                                            <FiFileText />

                                                            {item
                                                                .purchaseOrder
                                                                ?.poNumber ||
                                                                "-"}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            No reference
                                                        </span>
                                                    )}

                                                </div>
                                            </td>

                                            <td>
                                                <span className="return-reason-badge">
                                                    {getReasonLabel(
                                                        item.reason
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <strong>
                                                    {Number(
                                                        item.totalQuantity ||
                                                            0
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="return-amount">
                                                    ₹
                                                    {formatAmount(
                                                        item.totalAmount
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`purchase-return-status-badge ${getStatusClass(
                                                        item.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        item.status
                                                    )}

                                                    {item.status
                                                        ? item.status.replace(
                                                              /_/g,
                                                              " "
                                                          )
                                                        : "-"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="purchase-return-actions">

                                                    <button
                                                        type="button"
                                                        className="return-action view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                item._id
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    {[
                                                        "DRAFT",
                                                        "REJECTED",
                                                    ].includes(
                                                        item.status
                                                    ) && (
                                                        <button
                                                            type="button"
                                                            className="return-action delete"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item
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

                {!loading &&
                    returns.length > 0 && (
                        <div className="purchase-returns-pagination">

                            <span>
                                Page {page} of{" "}
                                {totalPages}
                            </span>

                            <div>

                                <button
                                    type="button"
                                    disabled={
                                        page <=
                                        1
                                    }
                                    onClick={() =>
                                        goToPage(
                                            page -
                                                1
                                        )
                                    }
                                >
                                    <FiChevronLeft />
                                    Previous
                                </button>

                                {Array.from(
                                    {
                                        length: Math.min(
                                            totalPages,
                                            5
                                        ),
                                    },
                                    (_, index) => {
                                        let pageNumber;

                                        if (
                                            totalPages <=
                                            5
                                        ) {
                                            pageNumber =
                                                index +
                                                1;
                                        } else if (
                                            page <=
                                            3
                                        ) {
                                            pageNumber =
                                                index +
                                                1;
                                        } else if (
                                            page >=
                                            totalPages -
                                                2
                                        ) {
                                            pageNumber =
                                                totalPages -
                                                4 +
                                                index;
                                        } else {
                                            pageNumber =
                                                page -
                                                2 +
                                                index;
                                        }

                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    pageNumber
                                                }
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
                                                {
                                                    pageNumber
                                                }
                                            </button>
                                        );
                                    }
                                )}

                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        totalPages
                                    }
                                    onClick={() =>
                                        goToPage(
                                            page +
                                                1
                                        )
                                    }
                                >
                                    Next
                                    <FiChevronRight />
                                </button>

                            </div>

                        </div>
                    )}

            </div>

            {/* ==================================================
                CREATE MODAL
            ================================================== */}

            {showModal && (
                <div
                    className="purchase-returns-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCreateModal();
                        }
                    }}
                >

                    <div className="purchase-returns-modal large">

                        <div className="purchase-returns-modal-header">

                            <div>
                                <div className="purchase-returns-modal-title">
                                    Create Purchase Return
                                </div>

                                <div className="purchase-returns-modal-subtitle">
                                    Create a supplier return and send it for approval
                                </div>
                            </div>

                            <button
                                type="button"
                                className="purchase-returns-modal-close"
                                onClick={
                                    closeCreateModal
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

                            <div className="purchase-returns-modal-body">

                                {/* ==========================
                                    BASIC INFORMATION
                                ========================== */}

                                <section className="return-form-section">

                                    <div className="return-section-title">
                                        <FiFileText />

                                        <span>
                                            Return Information
                                        </span>
                                    </div>

                                    <div className="return-form-grid">

                                        <div className="return-form-group">

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

                                        <div className="return-form-group">

                                            <label>
                                                Branch
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

                                        <div className="return-form-group">

                                            <label>
                                                Supplier
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                name="supplier"
                                                value={
                                                    formData.supplier
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
                                                    Select Supplier
                                                </option>

                                                {suppliers.map(
                                                    (
                                                        supplier
                                                    ) => (
                                                        <option
                                                            key={
                                                                supplier._id
                                                            }
                                                            value={
                                                                supplier._id
                                                            }
                                                        >
                                                            {
                                                                supplier.supplierCode
                                                            }{" "}
                                                            -{" "}
                                                            {getSupplierName(
                                                                supplier
                                                            )}
                                                        </option>
                                                    )
                                                )}

                                            </select>

                                        </div>

                                        <div className="return-form-group">

                                            <label>
                                                Return Date
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <div className="return-input-icon">

                                                <FiCalendar />

                                                <input
                                                    type="date"
                                                    name="returnDate"
                                                    value={
                                                        formData.returnDate
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    required
                                                />

                                            </div>

                                        </div>

                                        <div className="return-form-group">

                                            <label>
                                                Return Reason
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                name="reason"
                                                value={
                                                    formData.reason
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                required
                                            >
                                                {RETURN_REASONS.map(
                                                    (
                                                        reason
                                                    ) => (
                                                        <option
                                                            key={
                                                                reason.value
                                                            }
                                                            value={
                                                                reason.value
                                                            }
                                                        >
                                                            {
                                                                reason.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                        </div>

                                        <div className="return-form-group">

                                            <label>
                                                Credit Note Number
                                            </label>

                                            <input
                                                type="text"
                                                name="creditNoteNumber"
                                                value={
                                                    formData.creditNoteNumber
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                placeholder="Optional credit note number"
                                            />

                                        </div>

                                    </div>

                                </section>

                                {/* ==========================
                                    SOURCE DOCUMENT
                                ========================== */}

                                <section className="return-form-section">

                                    <div className="return-section-title">
                                        <FiTruck />

                                        <span>
                                            Return Reference
                                        </span>
                                    </div>

                                    <div className="return-form-grid">

                                        <div className="return-form-group">

                                            <label>
                                                Reference Type
                                            </label>

                                            <select
                                                value={
                                                    formData.sourceType
                                                }
                                                onChange={
                                                    handleSourceTypeChange
                                                }
                                                disabled={
                                                    !formData.supplier
                                                }
                                            >
                                                <option value="">
                                                    Select Reference
                                                </option>

                                                <option value="PURCHASE_ORDER">
                                                    Purchase Order
                                                </option>

                                                <option value="GOODS_RECEIPT">
                                                    Goods Receipt
                                                </option>

                                                <option value="PURCHASE_INVOICE">
                                                    Purchase Invoice
                                                </option>

                                            </select>

                                        </div>

                                        <div className="return-form-group">

                                            <label>
                                                Reference Document
                                            </label>

                                            <select
                                                value={
                                                    formData.sourceType ===
                                                    "PURCHASE_ORDER"
                                                        ? formData.purchaseOrder
                                                        : formData.sourceType ===
                                                          "GOODS_RECEIPT"
                                                        ? formData.goodsReceipt
                                                        : formData.purchaseInvoice
                                                }
                                                onChange={
                                                    handleSourceDocumentChange
                                                }
                                                disabled={
                                                    !formData.sourceType
                                                }
                                            >
                                                <option value="">
                                                    Select Document
                                                </option>

                                                {formData.sourceType ===
                                                    "PURCHASE_ORDER" &&
                                                    purchaseOrders.map(
                                                        (
                                                            order
                                                        ) => (
                                                            <option
                                                                key={
                                                                    order._id
                                                                }
                                                                value={
                                                                    order._id
                                                                }
                                                            >
                                                                {
                                                                    order.poNumber
                                                                }
                                                            </option>
                                                        )
                                                    )}

                                                {formData.sourceType ===
                                                    "GOODS_RECEIPT" &&
                                                    goodsReceipts.map(
                                                        (
                                                            receipt
                                                        ) => (
                                                            <option
                                                                key={
                                                                    receipt._id
                                                                }
                                                                value={
                                                                    receipt._id
                                                                }
                                                            >
                                                                {
                                                                    receipt.grnNumber
                                                                }
                                                            </option>
                                                        )
                                                    )}

                                                {formData.sourceType ===
                                                    "PURCHASE_INVOICE" &&
                                                    purchaseInvoices.map(
                                                        (
                                                            invoice
                                                        ) => (
                                                            <option
                                                                key={
                                                                    invoice._id
                                                                }
                                                                value={
                                                                    invoice._id
                                                                }
                                                            >
                                                                {invoice.invoiceNumber ||
                                                                    invoice.internalInvoiceNumber}
                                                            </option>
                                                        )
                                                    )}

                                            </select>

                                        </div>

                                    </div>

                                    {sourceLoading && (
                                        <div className="return-source-loading">

                                            <FiRefreshCw className="spin" />

                                            Loading source items...

                                        </div>
                                    )}

                                    {!sourceLoading &&
                                        sourceItems.length >
                                            0 && (
                                            <div className="return-source-items">

                                                <div className="return-source-items-header">

                                                    <h3>
                                                        Available Items
                                                    </h3>

                                                    <span>
                                                        Select products to return
                                                    </span>

                                                </div>

                                                <div className="return-source-items-list">

                                                    {sourceItems.map(
                                                        (
                                                            sourceItem
                                                        ) => {
                                                            const product =
                                                                getSourceItemProduct(
                                                                    sourceItem
                                                                );

                                                            const availableQuantity =
                                                                getSourceItemAvailableQuantity(
                                                                    sourceItem
                                                                );

                                                            const isAdded =
                                                                formData.items.some(
                                                                    (
                                                                        item
                                                                    ) =>
                                                                        item.product ===
                                                                        getId(
                                                                            product
                                                                        )
                                                                );

                                                            return (
                                                                <div
                                                                    className="return-source-item"
                                                                    key={
                                                                        sourceItem._id
                                                                    }
                                                                >

                                                                    <div className="return-source-product">

                                                                        <div className="return-source-product-name">
                                                                            {getProductName(
                                                                                product
                                                                            )}
                                                                        </div>

                                                                        <div className="return-source-product-code">
                                                                            SKU:{" "}
                                                                            {getProductSku(
                                                                                product
                                                                            )}
                                                                        </div>

                                                                    </div>

                                                                    <div className="return-source-item-info">
                                                                        Available:{" "}
                                                                        {
                                                                            availableQuantity
                                                                        }
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className="return-add-item-btn"
                                                                        onClick={() =>
                                                                            addReturnItem(
                                                                                sourceItem
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isAdded ||
                                                                            availableQuantity <=
                                                                                0
                                                                        }
                                                                    >
                                                                        <FiPlus />

                                                                        {isAdded
                                                                            ? "Added"
                                                                            : "Add"}
                                                                    </button>

                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                </div>

                                            </div>
                                        )}

                                </section>

                                {/* ==========================
                                    RETURN ITEMS
                                ========================== */}

                                <section className="return-form-section">

                                    <div className="return-section-title">
                                        <FiPackage />

                                        <span>
                                            Return Items
                                        </span>
                                    </div>

                                    {formData.items.length ===
                                    0 ? (
                                        <div className="return-items-empty">
                                            No products selected for return.
                                        </div>
                                    ) : (
                                        <div className="return-items-table-wrapper">

                                            <table className="return-items-table">

                                                <thead>
                                                    <tr>

                                                        <th>
                                                            Product
                                                        </th>

                                                        <th>
                                                            Available
                                                        </th>

                                                        <th>
                                                            Return Qty
                                                        </th>

                                                        <th>
                                                            Reason
                                                        </th>

                                                        <th>
                                                            Batch
                                                        </th>

                                                        <th>
                                                            Notes
                                                        </th>

                                                        <th>
                                                            Action
                                                        </th>

                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {formData.items.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={`${item.product}-${index}`}
                                                            >

                                                                <td>
                                                                    <div className="return-item-product">
                                                                        {getProductName(
                                                                            item.sourceProduct
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                <td>
                                                                    {
                                                                        item.availableQuantity
                                                                    }
                                                                </td>

                                                                <td>
                                                                    <input
                                                                        className="return-item-input"
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        max={
                                                                            item.availableQuantity
                                                                        }
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            updateReturnItem(
                                                                                index,
                                                                                "quantity",
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td>
                                                                    <select
                                                                        className="return-item-select"
                                                                        value={
                                                                            item.reason
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            updateReturnItem(
                                                                                index,
                                                                                "reason",
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    >
                                                                        {RETURN_REASONS.map(
                                                                            (
                                                                                reason
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        reason.value
                                                                                    }
                                                                                    value={
                                                                                        reason.value
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        reason.label
                                                                                    }
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>
                                                                </td>

                                                                <td>
                                                                    <input
                                                                        className="return-item-input"
                                                                        type="text"
                                                                        placeholder="Batch"
                                                                        value={
                                                                            item.batchNumber
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            updateReturnItem(
                                                                                index,
                                                                                "batchNumber",
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td>
                                                                    <input
                                                                        className="return-item-input"
                                                                        type="text"
                                                                        placeholder="Optional"
                                                                        value={
                                                                            item.notes
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            updateReturnItem(
                                                                                index,
                                                                                "notes",
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="return-item-remove"
                                                                        title="Remove"
                                                                        onClick={() =>
                                                                            removeReturnItem(
                                                                                index
                                                                            )
                                                                        }
                                                                    >
                                                                        <FiTrash2 />
                                                                    </button>
                                                                </td>

                                                            </tr>
                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>
                                    )}

                                    <div className="return-total-note">
                                        Final return amount, discount, tax and
                                        totals are calculated by the backend.
                                    </div>

                                </section>

                                {/* ==========================
                                    NOTES
                                ========================== */}

                                <section className="return-form-section">

                                    <div className="return-section-title">
                                        <FiFileText />

                                        <span>
                                            Additional Notes
                                        </span>
                                    </div>

                                    <div className="return-form-group">

                                        <textarea
                                            name="notes"
                                            value={
                                                formData.notes
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter any additional notes..."
                                            maxLength={2000}
                                        />

                                    </div>

                                </section>

                            </div>

                            <div className="purchase-returns-modal-footer">

                                <button
                                    type="button"
                                    className="purchase-return-cancel-btn"
                                    onClick={
                                        closeCreateModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="purchase-return-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FiRefreshCw className="spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle />
                                            Create Return
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

            {showViewModal && (
                <div
                    className="purchase-returns-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeViewModal();
                        }
                    }}
                >

                    <div className="purchase-returns-modal large">

                        <div className="purchase-returns-modal-header">

                            <div>
                                <div className="purchase-returns-modal-title">
                                    Purchase Return Details
                                </div>

                                <div className="purchase-returns-modal-subtitle">
                                    Complete return information
                                </div>
                            </div>

                            <button
                                type="button"
                                className="purchase-returns-modal-close"
                                onClick={
                                    closeViewModal
                                }
                            >
                                <FiX />
                            </button>

                        </div>

                        {viewLoading ? (
                            <div className="purchase-returns-loading">

                                <div className="purchase-returns-spinner" />

                                <p>
                                    Loading purchase return...
                                </p>

                            </div>
                        ) : selectedReturn ? (
                            <div className="purchase-returns-modal-body purchase-returns-view-body">

                                {/* ==========================
                                    HEADER
                                ========================== */}

                                <div className="return-view-header-card">

                                    <div>
                                        <div className="return-view-number">
                                            {
                                                selectedReturn.returnNumber
                                            }
                                        </div>

                                        <div className="return-view-date">
                                            Return Date:{" "}
                                            {formatDate(
                                                selectedReturn.returnDate
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        className={`purchase-return-status-badge ${getStatusClass(
                                            selectedReturn.status
                                        )}`}
                                    >
                                        {getStatusIcon(
                                            selectedReturn.status
                                        )}

                                        {selectedReturn.status?.replace(
                                            /_/g,
                                            " "
                                        )}
                                    </span>

                                </div>

                                {/* ==========================
                                    BASIC INFO
                                ========================== */}

                                <div className="return-view-info-grid">

                                    <div className="return-view-info-card">

                                        <div className="return-view-info-label">
                                            Company
                                        </div>

                                        <div className="return-view-info-value">
                                            {
                                                selectedReturn
                                                    .company
                                                    ?.name ||
                                                "-"
                                            }
                                        </div>

                                    </div>

                                    <div className="return-view-info-card">

                                        <div className="return-view-info-label">
                                            Branch
                                        </div>

                                        <div className="return-view-info-value">
                                            {
                                                selectedReturn
                                                    .branch
                                                    ?.name ||
                                                "-"
                                            }
                                        </div>

                                    </div>

                                    <div className="return-view-info-card">

                                        <div className="return-view-info-label">
                                            Supplier
                                        </div>

                                        <div className="return-view-info-value">
                                            {getSupplierName(
                                                selectedReturn.supplier
                                            )}
                                        </div>

                                    </div>

                                    <div className="return-view-info-card">

                                        <div className="return-view-info-label">
                                            Reason
                                        </div>

                                        <div className="return-view-info-value">
                                            {getReasonLabel(
                                                selectedReturn.reason
                                            )}
                                        </div>

                                    </div>

                                </div>

                                {/* ==========================
                                    REFERENCES
                                ========================== */}

                                <div className="return-view-section">

                                    <div className="return-view-section-title">
                                        Reference Documents
                                    </div>

                                    <div className="return-view-reference-grid">

                                        <div className="return-view-reference-card">

                                            <div className="return-view-reference-label">
                                                Purchase Order
                                            </div>

                                            <div className="return-view-reference-value">
                                                {
                                                    selectedReturn
                                                        .purchaseOrder
                                                        ?.poNumber ||
                                                    "-"
                                                }
                                            </div>

                                        </div>

                                        <div className="return-view-reference-card">

                                            <div className="return-view-reference-label">
                                                Goods Receipt
                                            </div>

                                            <div className="return-view-reference-value">
                                                {
                                                    selectedReturn
                                                        .goodsReceipt
                                                        ?.grnNumber ||
                                                    "-"
                                                }
                                            </div>

                                        </div>

                                        <div className="return-view-reference-card">

                                            <div className="return-view-reference-label">
                                                Purchase Invoice
                                            </div>

                                            <div className="return-view-reference-value">
                                                {
                                                    selectedReturn
                                                        .purchaseInvoice
                                                        ?.invoiceNumber ||
                                                    selectedReturn
                                                        .purchaseInvoice
                                                        ?.internalInvoiceNumber ||
                                                    "-"
                                                }
                                            </div>

                                        </div>

                                        <div className="return-view-reference-card">

                                            <div className="return-view-reference-label">
                                                Credit Note
                                            </div>

                                            <div className="return-view-reference-value">
                                                {
                                                    selectedReturn
                                                        .creditNoteNumber ||
                                                    "-"
                                                }
                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* ==========================
                                    ITEMS
                                ========================== */}

                                <div className="return-view-section">

                                    <div className="return-view-section-title">
                                        Returned Items
                                    </div>

                                    <div className="return-view-items-wrapper">

                                        <table className="return-view-items-table">

                                            <thead>
                                                <tr>

                                                    <th>
                                                        Product
                                                    </th>

                                                    <th>
                                                        Quantity
                                                    </th>

                                                    <th>
                                                        Unit Price
                                                    </th>

                                                    <th>
                                                        Discount
                                                    </th>

                                                    <th>
                                                        Tax
                                                    </th>

                                                    <th>
                                                        Total
                                                    </th>

                                                    <th>
                                                        Reason
                                                    </th>

                                                </tr>
                                            </thead>

                                            <tbody>

                                                {selectedReturnItems.length >
                                                0 ? (
                                                    selectedReturnItems.map(
                                                        (
                                                            item
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    item._id
                                                                }
                                                            >

                                                                <td>
                                                                    <div className="return-view-product">
                                                                        {getProductName(
                                                                            item.product
                                                                        )}
                                                                    </div>

                                                                    <small>
                                                                        SKU:{" "}
                                                                        {getProductSku(
                                                                            item.product
                                                                        )}
                                                                    </small>
                                                                </td>

                                                                <td>
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </td>

                                                                <td>
                                                                    ₹
                                                                    {formatAmount(
                                                                        item.unitPrice
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    ₹
                                                                    {formatAmount(
                                                                        item.discountAmount
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    ₹
                                                                    {formatAmount(
                                                                        item.taxAmount
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    ₹
                                                                    {formatAmount(
                                                                        item.lineTotal
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {getReasonLabel(
                                                                        item.reason
                                                                    )}
                                                                </td>

                                                            </tr>
                                                        )
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                7
                                                            }
                                                        >
                                                            No items found
                                                        </td>
                                                    </tr>
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                                {/* ==========================
                                    TOTALS
                                ========================== */}

                                <div className="return-view-totals">

                                    <div className="return-view-total-row">

                                        <span>
                                            Subtotal
                                        </span>

                                        <strong>
                                            ₹
                                            {formatAmount(
                                                selectedReturn.subtotal
                                            )}
                                        </strong>

                                    </div>

                                    <div className="return-view-total-row">

                                        <span>
                                            Discount
                                        </span>

                                        <strong>
                                            ₹
                                            {formatAmount(
                                                selectedReturn.discountAmount
                                            )}
                                        </strong>

                                    </div>

                                    <div className="return-view-total-row">

                                        <span>
                                            Tax
                                        </span>

                                        <strong>
                                            ₹
                                            {formatAmount(
                                                selectedReturn.taxAmount
                                            )}
                                        </strong>

                                    </div>

                                    <div className="return-view-total-row grand-total">

                                        <span>
                                            Total
                                        </span>

                                        <strong>
                                            ₹
                                            {formatAmount(
                                                selectedReturn.totalAmount
                                            )}
                                        </strong>

                                    </div>

                                </div>

                                {/* ==========================
                                    NOTES
                                ========================== */}

                                {selectedReturn.notes && (
                                    <div className="return-view-notes">

                                        <strong>
                                            Notes
                                        </strong>

                                        {selectedReturn.notes}

                                    </div>
                                )}

                                {selectedReturn.rejectionReason && (
                                    <div className="return-view-rejection">

                                        <strong>
                                            Rejection Reason
                                        </strong>

                                        {
                                            selectedReturn.rejectionReason
                                        }

                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="purchase-returns-empty">
                                <div className="empty-icon">
                                    <FiAlertCircle />
                                </div>

                                <h3>
                                    Purchase Return Not Found
                                </h3>
                            </div>
                        )}

                        <div className="purchase-returns-modal-footer">

                            <button
                                type="button"
                                className="purchase-return-cancel-btn"
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

export default PurchaseReturns;