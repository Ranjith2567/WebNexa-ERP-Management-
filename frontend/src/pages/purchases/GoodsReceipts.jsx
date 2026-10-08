import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEye,
    FiRefreshCw,
    FiPackage,
    FiFileText,
    FiTruck,
    FiHome,
    FiCalendar,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/goodsReceipts.css";

const GoodsReceipts = () => {
    // =========================================================
    // LIST STATES
    // =========================================================

    const [goodsReceipts, setGoodsReceipts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // =========================================================
    // MODAL STATES
    // =========================================================

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedReceipt, setSelectedReceipt] =
        useState(null);

    // =========================================================
    // CREATE FORM
    // =========================================================

    const getToday = () => {
        const date = new Date();

        return date.toISOString().split("T")[0];
    };

    const initialForm = {
        company: "",
        branch: "",
        purchaseOrder: "",
        receiptDate: getToday(),
        invoiceNumber: "",
        invoiceDate: "",
        vehicleNumber: "",
        notes: "",
        rejectionReason: "",
    };

    const [formData, setFormData] =
        useState(initialForm);

    const [purchaseOrders, setPurchaseOrders] =
        useState([]);

    const [selectedPO, setSelectedPO] =
        useState(null);

    const [poItems, setPoItems] =
        useState([]);

    const [receiptItems, setReceiptItems] =
        useState([]);
    const [barcodeValue, setBarcodeValue] =
    useState("");

const [barcodeLoading, setBarcodeLoading] =
    useState(false);
    // =========================================================
    // HELPERS
    // =========================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const getErrorMessage = (err) => {
        return (
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Something went wrong"
        );
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

    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    const formatStatus = (status) => {
        if (!status) return "-";

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) =>
                char.toUpperCase()
            );
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "RECEIVED":
                return "goods-receipts-status goods-receipts-status-received";

            case "PARTIALLY_RECEIVED":
                return "goods-receipts-status goods-receipts-status-partial";

            case "DRAFT":
                return "goods-receipts-status goods-receipts-status-draft";

            case "REJECTED":
                return "goods-receipts-status goods-receipts-status-rejected";

            case "CANCELLED":
                return "goods-receipts-status goods-receipts-status-cancelled";

            default:
                return "goods-receipts-status goods-receipts-status-draft";
        }
    };

    const toDateInput = (date) => {
        if (!date) return "";

        const value = new Date(date);

        if (Number.isNaN(value.getTime())) {
            return "";
        }

        return value.toISOString().split("T")[0];
    };

    const getProductName = (product) => {
        if (!product) return "-";

        if (typeof product === "object") {
            return product.name || product._id || "-";
        }

        return product;
    };

    const getProductId = (product) => {
        if (!product) return "";

        if (typeof product === "object") {
            return product._id || "";
        }

        return product;
    };
     const handleBarcodeLookup = async () => {
    const barcode = barcodeValue.trim();

    if (!barcode) {
        setError("Please enter or scan a barcode.");
        return;
    }

    if (!selectedPO) {
        setError("Please select a Purchase Order first.");
        return;
    }

    try {
        setBarcodeLoading(true);
        setError("");

        const response = await api.get(
            `/barcode/lookup/barcode/${encodeURIComponent(
                barcode
            )}`
        );

        const product = response.data?.data;

        if (!product) {
            setError(
                "Product not found for this barcode."
            );
            return;
        }

        const productId =
            product._id || product.id || "";

        const itemIndex =
            receiptItems.findIndex(
                (item) =>
                    getProductId(item.product) ===
                    productId
            );

        if (itemIndex === -1) {
            setError(
                "This product is not part of the selected Purchase Order."
            );
            return;
        }

        setReceiptItems((currentItems) =>
            currentItems.map((item, index) => {
                if (index !== itemIndex) {
                    return item;
                }

                const received =
                    Number(
                        item.receivedQuantity || 0
                    );

                const pending =
                    Number(
                        item.pendingQuantity || 0
                    );

                if (received >= pending) {
                    return item;
                }

                const newReceived =
                    received + 1;

                const rejected =
                    Number(
                        item.rejectedQuantity || 0
                    );

                return {
                    ...item,
                    receivedQuantity:
                        newReceived,
                    acceptedQuantity:
                        Math.max(
                            newReceived -
                                rejected,
                            0
                        ),
                };
            })
        );

        setBarcodeValue("");
    } catch (err) {
        console.error(
            "Barcode lookup error:",
            err
        );

        setError(
            err.response?.data?.message ||
                "Failed to lookup product by barcode."
        );
    } finally {
        setBarcodeLoading(false);
    }
};
    // =========================================================
    // FETCH COMPANIES
    // =========================================================

    const fetchCompanies = async () => {
        try {
            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            const data =
                response.data?.companies ||
                response.data?.data ||
                [];

            setCompanies(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            console.error(
                "Fetch companies error:",
                err
            );
        }
    };

    // =========================================================
    // FETCH BRANCHES
    // =========================================================

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

    // =========================================================
    // FETCH GOODS RECEIPTS
    // =========================================================

    const fetchGoodsReceipts = async (
        requestedPage = page
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            params.append("page", requestedPage);
            params.append("limit", 10);

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            if (companyFilter) {
                params.append(
                    "company",
                    companyFilter
                );
            }

            if (branchFilter) {
                params.append(
                    "branch",
                    branchFilter
                );
            }

            if (statusFilter) {
                params.append(
                    "status",
                    statusFilter
                );
            }

            if (startDate) {
                params.append(
                    "startDate",
                    startDate
                );
            }

            if (endDate) {
                params.append(
                    "endDate",
                    endDate
                );
            }

            const response = await api.get(
                `/goods-receipts?${params.toString()}`
            );

            const data =
                response.data?.data || [];

            setGoodsReceipts(
                Array.isArray(data) ? data : []
            );

            setTotal(
                Number(response.data?.total || 0)
            );

            setPage(
                Number(response.data?.page || requestedPage)
            );

            setPages(
                Math.max(
                    Number(response.data?.pages || 1),
                    1
                )
            );
        } catch (err) {
            console.error(
                "Fetch goods receipts error:",
                err
            );

            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchCompanies();
        fetchGoodsReceipts(1);
    }, []);

    // =========================================================
    // COMPANY FILTER CHANGE
    // =========================================================

    useEffect(() => {
        setBranchFilter("");

        if (companyFilter) {
            fetchBranches(companyFilter);
        } else {
            setBranches([]);
        }
    }, [companyFilter]);

    // =========================================================
    // FORM COMPANY CHANGE
    // =========================================================

    useEffect(() => {
        if (!formData.company) {
            setBranches([]);
            return;
        }

        fetchBranches(formData.company);
    }, [formData.company]);

    // =========================================================
    // SEARCH
    // =========================================================

    const handleSearch = (e) => {
        e.preventDefault();
        fetchGoodsReceipts(1);
    };

    // =========================================================
    // RESET FILTERS
    // =========================================================

    const handleResetFilters = () => {
        setSearch("");
        setStatusFilter("");
        setCompanyFilter("");
        setBranchFilter("");
        setStartDate("");
        setEndDate("");

        setTimeout(() => {
            fetchGoodsReceipts(1);
        }, 0);
    };

    // =========================================================
    // OPEN CREATE MODAL
    // =========================================================

    const openCreateModal = () => {
        clearMessages();

        setFormData({
            ...initialForm,
            receiptDate: getToday(),
        });

        setPurchaseOrders([]);
        setSelectedPO(null);
        setPoItems([]);
        setReceiptItems([]);

        setShowCreateModal(true);
    };

    // =========================================================
    // CLOSE CREATE MODAL
    // =========================================================

    const closeCreateModal = () => {
        if (loadingForm) return;

        setShowCreateModal(false);

        setFormData({
            ...initialForm,
            receiptDate: getToday(),
        });

        setPurchaseOrders([]);
        setSelectedPO(null);
        setPoItems([]);
        setReceiptItems([]);

        clearMessages();
    };

    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleFormChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================================================
    // FETCH PURCHASE ORDERS FOR CREATE
    // =========================================================

    const fetchPurchaseOrders = async (
        companyId,
        branchId
    ) => {
        if (!companyId || !branchId) {
            setPurchaseOrders([]);
            return;
        }

        try {
            setLoadingForm(true);

            const response = await api.get(
                `/purchase-orders?company=${companyId}&branch=${branchId}&page=1&limit=100`
            );

            const data =
                response.data?.data || [];

            const allowedStatuses = [
                "APPROVED",
                "SENT",
                "PARTIALLY_RECEIVED",
            ];

            const availableOrders =
                Array.isArray(data)
                    ? data.filter((po) =>
                          allowedStatuses.includes(
                              po.status
                          )
                      )
                    : [];

            setPurchaseOrders(
                availableOrders
            );
        } catch (err) {
            console.error(
                "Fetch purchase orders error:",
                err
            );

            setError(
                getErrorMessage(err)
            );
        } finally {
            setLoadingForm(false);
        }
    };

    // =========================================================
    // COMPANY / BRANCH FORM DEPENDENCY
    // =========================================================

    useEffect(() => {
        if (
            formData.company &&
            formData.branch
        ) {
            setFormData((prev) => ({
                ...prev,
                purchaseOrder: "",
            }));

            setSelectedPO(null);
            setPoItems([]);
            setReceiptItems([]);

            fetchPurchaseOrders(
                formData.company,
                formData.branch
            );
        } else {
            setPurchaseOrders([]);
            setSelectedPO(null);
            setPoItems([]);
            setReceiptItems([]);
        }
    }, [
        formData.company,
        formData.branch,
    ]);

    // =========================================================
    // FETCH PURCHASE ORDER DETAILS
    // =========================================================

    const handlePurchaseOrderChange = async (
        e
    ) => {
        const purchaseOrderId =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            purchaseOrder:
                purchaseOrderId,
        }));

        setSelectedPO(null);
        setPoItems([]);
        setReceiptItems([]);

        if (!purchaseOrderId) {
            return;
        }

        try {
            setLoadingForm(true);
            setError("");

            const response =
                await api.get(
                    `/purchase-orders/${purchaseOrderId}`
                );

            const data =
                response.data?.data;

            if (!data) {
                throw new Error(
                    "Purchase order details not found"
                );
            }

            const purchaseOrder =
                data.purchaseOrder;

            const items =
                Array.isArray(data.items)
                    ? data.items
                    : [];

            setSelectedPO(
                purchaseOrder
            );

            /*
             * Only items having pending quantity
             * can be received.
             */

            const availableItems =
                items.filter((item) => {
                    const pending =
                        Number(
                            item.pendingQuantity ??
                                Number(
                                    item.quantity || 0
                                ) -
                                    Number(
                                        item.receivedQuantity ||
                                            0
                                    )
                        );

                    return pending > 0;
                });

            setPoItems(
                availableItems
            );

            const initialReceiptItems =
                availableItems.map(
                    (item) => ({
                        purchaseOrderItem:
                            item._id,

                        product:
                            getProductId(
                                item.product
                            ),

                        productData:
                            item.product,

                        orderedQuantity:
                            Number(
                                item.quantity || 0
                            ),

                        previouslyReceivedQuantity:
                            Number(
                                item.receivedQuantity ||
                                    0
                            ),

                        pendingQuantity:
                            Number(
                                item.pendingQuantity ??
                                    Number(
                                        item.quantity ||
                                            0
                                    ) -
                                        Number(
                                            item.receivedQuantity ||
                                                0
                                        )
                            ),

                        receivedQuantity: 0,

                        rejectedQuantity: 0,

                        acceptedQuantity: 0,

                        unitPrice:
                            Number(
                                item.unitPrice ||
                                    0
                            ),

                        discountPercentage:
                            Number(
                                item.discountPercentage ||
                                    0
                            ),

                        taxPercentage:
                            Number(
                                item.taxPercentage ||
                                    0
                            ),

                        batchNumber: "",

                        serialNumbers: "",

                        expiryDate: "",

                        manufacturingDate:
                            "",

                        notes: "",
                    })
                );

            setReceiptItems(
                initialReceiptItems
            );

            /*
             * Supplier and warehouse are determined
             * from the selected Purchase Order.
             */

            if (
                purchaseOrder?.supplier
            ) {
                // No separate supplier field
                // is required in payload.
            }
        } catch (err) {
            console.error(
                "Fetch purchase order details error:",
                err
            );

            setError(
                getErrorMessage(err)
            );
        } finally {
            setLoadingForm(false);
        }
    };

    // =========================================================
    // UPDATE RECEIPT ITEM
    // =========================================================

    const updateReceiptItem = (
        index,
        field,
        value
    ) => {
        setReceiptItems((prev) => {
            const updated = [...prev];

            const item = {
                ...updated[index],
            };

            if (
                [
                    "receivedQuantity",
                    "rejectedQuantity",
                ].includes(field)
            ) {
                const numericValue =
                    value === ""
                        ? 0
                        : Number(value);

                item[field] =
                    Number.isFinite(
                        numericValue
                    )
                        ? numericValue
                        : 0;
            } else {
                item[field] = value;
            }

            const received =
                Number(
                    item.receivedQuantity || 0
                );

            const rejected =
                Number(
                    item.rejectedQuantity || 0
                );

            item.acceptedQuantity =
                Math.max(
                    received - rejected,
                    0
                );

            updated[index] = item;

            return updated;
        });
    };

    // =========================================================
    // CALCULATE DISPLAY LINE TOTAL
    // =========================================================

    const calculateLineTotal = (item) => {
        const quantity =
            Number(
                item.receivedQuantity || 0
            );

        const price =
            Number(
                item.unitPrice || 0
            );

        const discount =
            Number(
                item.discountPercentage ||
                    0
            );

        const tax =
            Number(
                item.taxPercentage || 0
            );

        const gross =
            quantity * price;

        const discountAmount =
            gross * (discount / 100);

        const taxable =
            gross - discountAmount;

        const taxAmount =
            taxable * (tax / 100);

        return taxable + taxAmount;
    };

    // =========================================================
    // FORM TOTALS
    // =========================================================

    const formTotals = useMemo(() => {
        let quantity = 0;
        let amount = 0;
        let rejected = 0;

        receiptItems.forEach((item) => {
            quantity += Number(
                item.acceptedQuantity || 0
            );

            rejected += Number(
                item.rejectedQuantity || 0
            );

            amount +=
                calculateLineTotal(item);
        });

        return {
            quantity,
            rejected,
            amount,
        };
    }, [receiptItems]);

    // =========================================================
    // VALIDATE RECEIPT
    // =========================================================

    const validateReceipt = () => {
        if (!formData.company) {
            return "Company is required";
        }

        if (!formData.branch) {
            return "Branch is required";
        }

        if (!formData.purchaseOrder) {
            return "Purchase order is required";
        }

        if (!formData.receiptDate) {
            return "Receipt date is required";
        }

        if (
            !receiptItems.length
        ) {
            return "At least one pending purchase order item is required";
        }

        const hasReceivedItem =
            receiptItems.some(
                (item) =>
                    Number(
                        item.receivedQuantity ||
                            0
                    ) > 0
            );

        if (!hasReceivedItem) {
            return "Enter received quantity for at least one item";
        }

        for (
            let i = 0;
            i < receiptItems.length;
            i++
        ) {
            const item =
                receiptItems[i];

            const received =
                Number(
                    item.receivedQuantity ||
                        0
                );

            const rejected =
                Number(
                    item.rejectedQuantity ||
                        0
                );

            const pending =
                Number(
                    item.pendingQuantity ||
                        0
                );

            if (
                received < 0
            ) {
                return `Invalid received quantity for item ${
                    i + 1
                }`;
            }

            if (
                received > pending
            ) {
                return `Received quantity cannot exceed pending quantity for ${
                    getProductName(
                        item.productData
                    )
                }`;
            }

            if (
                rejected < 0
            ) {
                return `Rejected quantity cannot be negative for ${
                    getProductName(
                        item.productData
                    )
                }`;
            }

            if (
                rejected > received
            ) {
                return `Rejected quantity cannot exceed received quantity for ${
                    getProductName(
                        item.productData
                    )
                }`;
            }
        }

        return "";
    };

    // =========================================================
    // BUILD PAYLOAD
    // =========================================================

    const buildPayload = (
        status
    ) => {
        const items =
            receiptItems
                .filter(
                    (item) =>
                        Number(
                            item.receivedQuantity ||
                                0
                        ) > 0
                )
                .map((item) => {
                    const serialNumbers =
                        String(
                            item.serialNumbers ||
                                ""
                        )
                            .split(/[\n,]+/)
                            .map((value) =>
                                value.trim()
                            )
                            .filter(Boolean);

                    return {
                        purchaseOrderItem:
                            item.purchaseOrderItem,

                        product:
                            item.product,

                        receivedQuantity:
                            Number(
                                item.receivedQuantity ||
                                    0
                            ),

                        rejectedQuantity:
                            Number(
                                item.rejectedQuantity ||
                                    0
                            ),

                        batchNumber:
                            item.batchNumber?.trim() ||
                            "",

                        serialNumbers,

                        expiryDate:
                            item.expiryDate ||
                            null,

                        manufacturingDate:
                            item.manufacturingDate ||
                            null,

                        notes:
                            item.notes?.trim() ||
                            "",
                    };
                });

        return {
            company:
                formData.company,

            branch:
                formData.branch,

            purchaseOrder:
                formData.purchaseOrder,

            receiptDate:
                formData.receiptDate,

            invoiceNumber:
                formData.invoiceNumber.trim(),

            invoiceDate:
                formData.invoiceDate ||
                null,

            vehicleNumber:
                formData.vehicleNumber.trim(),

            status,

            notes:
                formData.notes.trim(),

            rejectionReason:
                formData.rejectionReason.trim(),

            items,
        };
    };

    // =========================================================
    // CREATE GOODS RECEIPT
    // =========================================================

    const handleCreateReceipt = async (
        status
    ) => {
        clearMessages();

        const validationError =
            validateReceipt();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoadingForm(true);

            const payload =
                buildPayload(status);

            const response =
                await api.post(
                    "/goods-receipts",
                    payload
                );

            const message =
                response.data?.message ||
                "Goods receipt created successfully";

            setSuccess(message);

            setShowCreateModal(false);

            setFormData({
                ...initialForm,
                receiptDate: getToday(),
            });

            setPurchaseOrders([]);
            setSelectedPO(null);
            setPoItems([]);
            setReceiptItems([]);

            await fetchGoodsReceipts(
                1
            );
        } catch (err) {
            console.error(
                "Create goods receipt error:",
                err
            );

            setError(
                getErrorMessage(err)
            );
        } finally {
            setLoadingForm(false);
        }
    };

    // =========================================================
    // VIEW GOODS RECEIPT
    // =========================================================

    const handleView = async (
        receipt
    ) => {
        try {
            clearMessages();
            setLoadingForm(true);

            const id =
                receipt?._id ||
                receipt?.id;

            const response =
                await api.get(
                    `/goods-receipts/${id}`
                );

            setSelectedReceipt(
                response.data?.data
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "View goods receipt error:",
                err
            );

            setError(
                getErrorMessage(err)
            );
        } finally {
            setLoadingForm(false);
        }
    };

    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {
        const received =
            goodsReceipts.filter(
                (item) =>
                    item.status ===
                    "RECEIVED"
            ).length;

        const partial =
            goodsReceipts.filter(
                (item) =>
                    item.status ===
                    "PARTIALLY_RECEIVED"
            ).length;

        const drafts =
            goodsReceipts.filter(
                (item) =>
                    item.status ===
                    "DRAFT"
            ).length;

        const amount =
            goodsReceipts.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.totalAmount || 0
                    ),
                0
            );

        return {
            received,
            partial,
            drafts,
            amount,
        };
    }, [goodsReceipts]);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="goods-receipts-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="goods-receipts-header">
                <div className="goods-receipts-header-left">
                    <div className="goods-receipts-header-icon">
                        <FiPackage />
                    </div>

                    <div>
                        <h1>
                            Goods Receipts
                        </h1>

                        <p>
                            Manage supplier goods
                            receipts and stock intake
                        </p>
                    </div>
                </div>

                <button
                    className="goods-receipts-btn goods-receipts-btn-primary"
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus />
                    Create GRN
                </button>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
                <div className="goods-receipts-alert goods-receipts-alert-error">
                    <FiAlertCircle />
                    <span>{error}</span>

                    <button
                        className="goods-receipts-modal-close"
                        style={{
                            marginLeft:
                                "auto",
                            width: "28px",
                            height: "28px",
                        }}
                        onClick={() =>
                            setError("")
                        }
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {success && (
                <div className="goods-receipts-alert goods-receipts-alert-success">
                    <FiCheckCircle />
                    <span>{success}</span>

                    <button
                        className="goods-receipts-modal-close"
                        style={{
                            marginLeft:
                                "auto",
                            width: "28px",
                            height: "28px",
                        }}
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

            <div className="goods-receipts-summary">

                <div className="goods-receipts-summary-card">
                    <div className="goods-receipts-summary-top">
                        <span className="goods-receipts-summary-label">
                            Total GRNs
                        </span>

                        <div className="goods-receipts-summary-icon">
                            <FiFileText />
                        </div>
                    </div>

                    <p className="goods-receipts-summary-value">
                        {total}
                    </p>
                </div>

                <div className="goods-receipts-summary-card">
                    <div className="goods-receipts-summary-top">
                        <span className="goods-receipts-summary-label">
                            Received
                        </span>

                        <div className="goods-receipts-summary-icon">
                            <FiCheckCircle />
                        </div>
                    </div>

                    <p className="goods-receipts-summary-value">
                        {summary.received}
                    </p>
                </div>

                <div className="goods-receipts-summary-card">
                    <div className="goods-receipts-summary-top">
                        <span className="goods-receipts-summary-label">
                            Partial / Draft
                        </span>

                        <div className="goods-receipts-summary-icon">
                            <FiClock />
                        </div>
                    </div>

                    <p className="goods-receipts-summary-value">
                        {summary.partial +
                            summary.drafts}
                    </p>
                </div>

                <div className="goods-receipts-summary-card">
                    <div className="goods-receipts-summary-top">
                        <span className="goods-receipts-summary-label">
                            Page Amount
                        </span>

                        <div className="goods-receipts-summary-icon">
                            ₹
                        </div>
                    </div>

                    <p className="goods-receipts-summary-value">
                        ₹
                        {formatAmount(
                            summary.amount
                        )}
                    </p>
                </div>
            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="goods-receipts-filter-card">
                <form
                    onSubmit={
                        handleSearch
                    }
                >
                    <div className="goods-receipts-filter-grid">

                        <div className="goods-receipts-filter-group">
                            <label className="goods-receipts-filter-label">
                                Search
                            </label>

                            <div
                                style={{
                                    position:
                                        "relative",
                                }}
                            >
                                <FiSearch
                                    style={{
                                        position:
                                            "absolute",
                                        left:
                                            "12px",
                                        top:
                                            "50%",
                                        transform:
                                            "translateY(-50%)",
                                        color:
                                            "#64748b",
                                    }}
                                />

                                <input
                                    className="goods-receipts-input"
                                    style={{
                                        paddingLeft:
                                            "36px",
                                    }}
                                    value={
                                        search
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="GRN, invoice, vehicle..."
                                />
                            </div>
                        </div>

                        <div className="goods-receipts-filter-group">
                            <label className="goods-receipts-filter-label">
                                Company
                            </label>

                            <select
                                className="goods-receipts-select"
                                value={
                                    companyFilter
                                }
                                onChange={(
                                    e
                                ) =>
                                    setCompanyFilter(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Companies
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

                        <div className="goods-receipts-filter-group">
                            <label className="goods-receipts-filter-label">
                                Branch
                            </label>

                            <select
                                className="goods-receipts-select"
                                value={
                                    branchFilter
                                }
                                onChange={(
                                    e
                                ) =>
                                    setBranchFilter(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    !companyFilter
                                }
                            >
                                <option value="">
                                    All Branches
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

                        <div className="goods-receipts-filter-group">
                            <label className="goods-receipts-filter-label">
                                Status
                            </label>

                            <select
                                className="goods-receipts-select"
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    e
                                ) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Status
                                </option>

                                <option value="DRAFT">
                                    Draft
                                </option>

                                <option value="PARTIALLY_RECEIVED">
                                    Partially Received
                                </option>

                                <option value="RECEIVED">
                                    Received
                                </option>
                            </select>
                        </div>

                        <div className="goods-receipts-filter-group">
                            <label className="goods-receipts-filter-label">
                                From Date
                            </label>

                            <input
                                type="date"
                                className="goods-receipts-input"
                                value={
                                    startDate
                                }
                                onChange={(
                                    e
                                ) =>
                                    setStartDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="goods-receipts-filter-group">
                            <label className="goods-receipts-filter-label">
                                To Date
                            </label>

                            <input
                                type="date"
                                className="goods-receipts-input"
                                value={
                                    endDate
                                }
                                onChange={(
                                    e
                                ) =>
                                    setEndDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div
                        className="goods-receipts-filter-actions"
                        style={{
                            marginTop:
                                "12px",
                        }}
                    >
                        <button
                            type="submit"
                            className="goods-receipts-btn goods-receipts-btn-primary"
                        >
                            <FiSearch />
                            Search
                        </button>

                        <button
                            type="button"
                            className="goods-receipts-btn goods-receipts-btn-secondary"
                            onClick={
                                handleResetFilters
                            }
                        >
                            <FiRefreshCw />
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="goods-receipts-table-card">

                <div className="goods-receipts-table-header">
                    <div>
                        <h3>
                            Goods Receipt List
                        </h3>

                        <span>
                            {total} receipt
                            {total !== 1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                    <button
                        className="goods-receipts-action-btn"
                        title="Refresh"
                        onClick={() =>
                            fetchGoodsReceipts(
                                page
                            )
                        }
                        disabled={
                            loading
                        }
                    >
                        <FiRefreshCw />
                    </button>
                </div>

                {loading ? (
                    <div className="goods-receipts-loading">
                        <FiRefreshCw className="goods-receipts-loading-icon" />
                        Loading goods receipts...
                    </div>
                ) : goodsReceipts.length ===
                  0 ? (
                    <div className="goods-receipts-empty">
                        <FiPackage className="goods-receipts-empty-icon" />

                        <span>
                            No goods receipts
                            found
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="goods-receipts-table-wrapper">
                            <table className="goods-receipts-table">
                                <thead>
                                    <tr>
                                        <th>
                                            GRN No
                                        </th>

                                        <th>
                                            PO No
                                        </th>

                                        <th>
                                            Supplier
                                        </th>

                                        <th>
                                            Warehouse
                                        </th>

                                        <th>
                                            Receipt Date
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
                                    {goodsReceipts.map(
                                        (
                                            receipt
                                        ) => (
                                            <tr
                                                key={
                                                    receipt._id
                                                }
                                            >
                                                <td>
                                                    <span className="goods-receipts-number">
                                                        {
                                                            receipt.grnNumber
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="goods-receipts-po-number">
                                                        {receipt
                                                            .purchaseOrder
                                                            ?.poNumber ||
                                                            "-"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="goods-receipts-primary-text">
                                                        {receipt
                                                            .supplier
                                                            ?.name ||
                                                            "-"}
                                                    </span>

                                                    {receipt
                                                        .supplier
                                                        ?.supplierCode && (
                                                        <span className="goods-receipts-secondary-text">
                                                            {
                                                                receipt
                                                                    .supplier
                                                                    .supplierCode
                                                            }
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="goods-receipts-primary-text">
                                                        {receipt
                                                            .warehouse
                                                            ?.name ||
                                                            "-"}
                                                    </span>

                                                    {receipt
                                                        .warehouse
                                                        ?.code && (
                                                        <span className="goods-receipts-secondary-text">
                                                            {
                                                                receipt
                                                                    .warehouse
                                                                    .code
                                                            }
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        formatDate(
                                                            receipt.receiptDate
                                                        )
                                                    }
                                                </td>

                                                <td>
                                                    <span className="goods-receipts-quantity">
                                                        {Number(
                                                            receipt.totalQuantity ||
                                                                0
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="goods-receipts-amount">
                                                        ₹
                                                        {formatAmount(
                                                            receipt.totalAmount
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={getStatusClass(
                                                            receipt.status
                                                        )}
                                                    >
                                                        {formatStatus(
                                                            receipt.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="goods-receipts-actions">
                                                        <button
                                                            className="goods-receipts-action-btn goods-receipts-action-view"
                                                            title="View"
                                                            onClick={() =>
                                                                handleView(
                                                                    receipt
                                                                )
                                                            }
                                                        >
                                                            <FiEye />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}

                        <div className="goods-receipts-pagination">
                            <div className="goods-receipts-pagination-info">
                                Page{" "}
                                {page}{" "}
                                of{" "}
                                {pages}
                            </div>

                            <div className="goods-receipts-pagination-buttons">
                                <button
                                    className="goods-receipts-page-btn"
                                    disabled={
                                        page <=
                                        1
                                    }
                                    onClick={() =>
                                        fetchGoodsReceipts(
                                            page -
                                                1
                                        )
                                    }
                                >
                                    <FiChevronLeft />
                                </button>

                                {Array.from(
                                    {
                                        length:
                                            Math.min(
                                                pages,
                                                5
                                            ),
                                    },
                                    (
                                        _,
                                        index
                                    ) => {
                                        let pageNumber =
                                            index +
                                            1;

                                        if (
                                            pages >
                                                5 &&
                                            page >
                                                3
                                        ) {
                                            pageNumber =
                                                page -
                                                2 +
                                                index;

                                            if (
                                                pageNumber >
                                                pages
                                            ) {
                                                pageNumber =
                                                    pages -
                                                    4 +
                                                    index;
                                            }
                                        }

                                        return (
                                            <button
                                                key={
                                                    pageNumber
                                                }
                                                className={`goods-receipts-page-btn ${
                                                    pageNumber ===
                                                    page
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    fetchGoodsReceipts(
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
                                    className="goods-receipts-page-btn"
                                    disabled={
                                        page >=
                                        pages
                                    }
                                    onClick={() =>
                                        fetchGoodsReceipts(
                                            page +
                                                1
                                        )
                                    }
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* =================================================
                CREATE MODAL
            ================================================= */}

            {showCreateModal && (
                <div className="goods-receipts-modal-overlay">

                    <div className="goods-receipts-modal">

                        <div className="goods-receipts-modal-header">
                            <div className="goods-receipts-modal-title">
                                <FiPackage
                                    style={{
                                        color:
                                            "#60a5fa",
                                    }}
                                />

                                <div>
                                    <h2>
                                        Create Goods Receipt
                                    </h2>

                                    <p>
                                        GRN number will
                                        be generated
                                        automatically
                                    </p>
                                </div>
                            </div>

                            <button
                                className="goods-receipts-modal-close"
                                onClick={
                                    closeCreateModal
                                }
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="goods-receipts-modal-body">

                            {/* FORM */}

                            <div className="goods-receipts-form-grid">

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Company{" "}
                                        <span className="goods-receipts-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        className="goods-receipts-select"
                                        name="company"
                                        value={
                                            formData.company
                                        }
                                        onChange={
                                            handleFormChange
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

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Branch{" "}
                                        <span className="goods-receipts-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        className="goods-receipts-select"
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

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Purchase Order{" "}
                                        <span className="goods-receipts-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        className="goods-receipts-select"
                                        value={
                                            formData.purchaseOrder
                                        }
                                        onChange={
                                            handlePurchaseOrderChange
                                        }
                                        disabled={
                                            !formData.branch ||
                                            loadingForm
                                        }
                                    >
                                        <option value="">
                                            Select Purchase Order
                                        </option>

                                        {purchaseOrders.map(
                                            (
                                                po
                                            ) => (
                                                <option
                                                    key={
                                                        po._id
                                                    }
                                                    value={
                                                        po._id
                                                    }
                                                >
                                                    {
                                                        po.poNumber
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        po.status
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Receipt Date{" "}
                                        <span className="goods-receipts-required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        className="goods-receipts-input"
                                        name="receiptDate"
                                        value={
                                            formData.receiptDate
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    />
                                </div>

                                {/* SUPPLIER */}

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Supplier
                                    </label>

                                    <input
                                        className="goods-receipts-input"
                                        value={
                                            selectedPO
                                                ?.supplier
                                                ?.name ||
                                            ""
                                        }
                                        placeholder="Selected from Purchase Order"
                                        readOnly
                                    />
                                </div>

                                {/* WAREHOUSE */}

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Warehouse
                                    </label>

                                    <input
                                        className="goods-receipts-input"
                                        value={
                                            selectedPO
                                                ?.warehouse
                                                ?.name ||
                                            ""
                                        }
                                        placeholder="Selected from Purchase Order"
                                        readOnly
                                    />
                                </div>

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Invoice Number
                                    </label>

                                    <input
                                        className="goods-receipts-input"
                                        name="invoiceNumber"
                                        value={
                                            formData.invoiceNumber
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Supplier invoice number"
                                    />
                                </div>

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Invoice Date
                                    </label>

                                    <input
                                        type="date"
                                        className="goods-receipts-input"
                                        name="invoiceDate"
                                        value={
                                            formData.invoiceDate
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    />
                                </div>

                                <div className="goods-receipts-form-group">
                                    <label className="goods-receipts-form-label">
                                        Vehicle Number
                                    </label>

                                    <input
                                        className="goods-receipts-input"
                                        name="vehicleNumber"
                                        value={
                                            formData.vehicleNumber
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Vehicle number"
                                    />
                                </div>

                                {/* PO INFO */}

                                {selectedPO && (
                                    <div className="goods-receipts-form-group full-width">
                                        <div className="goods-receipts-po-info">

                                            <div className="goods-receipts-info-box">
                                                <span>
                                                    PO Number
                                                </span>

                                                <strong>
                                                    {
                                                        selectedPO.poNumber
                                                    }
                                                </strong>
                                            </div>

                                            <div className="goods-receipts-info-box">
                                                <span>
                                                    PO Status
                                                </span>

                                                <strong>
                                                    {formatStatus(
                                                        selectedPO.status
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="goods-receipts-info-box">
                                                <span>
                                                    PO Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        selectedPO.orderDate
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="goods-receipts-info-box">
                                                <span>
                                                    PO Amount
                                                </span>

                                                <strong>
                                                    ₹
                                                    {formatAmount(
                                                        selectedPO.totalAmount
                                                    )}
                                                </strong>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                {/* NOTES */}

                                <div className="goods-receipts-form-group full-width">
                                    <label className="goods-receipts-form-label">
                                        Notes
                                    </label>

                                    <textarea
                                        className="goods-receipts-textarea"
                                        name="notes"
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>

                            {/* =================================================
                                ITEMS
                            ================================================= */}

                            {selectedPO && (
                                <div className="goods-receipts-section">

                                    <div className="goods-receipts-section-header">
                                        <h3>
                                            Receipt Items
                                        </h3>

                                        <span>
                                            {
                                                receiptItems.length
                                            }{" "}
                                            pending item
                                            {receiptItems.length !==
                                            1
                                                ? "s"
                                                : ""}
                                        </span>
                                    </div>

                                    {receiptItems.length ===
                                    0 ? (
                                        <div className="goods-receipts-empty">
                                            <FiCheckCircle className="goods-receipts-empty-icon" />

                                            <span>
                                                No pending
                                                items in
                                                this purchase
                                                order
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="goods-receipts-items-wrapper">
                                            <table className="goods-receipts-items-table">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            Product
                                                        </th>

                                                        <th>
                                                            Ordered
                                                        </th>

                                                        <th>
                                                            Previously
                                                            Received
                                                        </th>

                                                        <th>
                                                            Pending
                                                        </th>

                                                        <th>
                                                            Receive
                                                        </th>

                                                        <th>
                                                            Reject
                                                        </th>

                                                        <th>
                                                            Accepted
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
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {receiptItems.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    item.purchaseOrderItem
                                                                }
                                                            >
                                                                <td>
                                                                    <div className="goods-receipts-item-product">
                                                                        <strong>
                                                                            {getProductName(
                                                                                item.productData
                                                                            )}
                                                                        </strong>

                                                                        {item
                                                                            .productData
                                                                            ?.sku && (
                                                                            <span>
                                                                                SKU:{" "}
                                                                                {
                                                                                    item
                                                                                        .productData
                                                                                        .sku
                                                                                }
                                                                            </span>
                                                                        )}

                                                                        {item
                                                                            .productData
                                                                            ?.barcode && (
                                                                            <span>
                                                                                Barcode:{" "}
                                                                                {
                                                                                    item
                                                                                        .productData
                                                                                        .barcode
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-readonly">
                                                                        {
                                                                            item.orderedQuantity
                                                                        }
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-readonly">
                                                                        {
                                                                            item.previouslyReceivedQuantity
                                                                        }
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-pending">
                                                                        {
                                                                            item.pendingQuantity
                                                                        }
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={
                                                                            item.pendingQuantity
                                                                        }
                                                                        step="any"
                                                                        className="goods-receipts-item-input"
                                                                        value={
                                                                            item.receivedQuantity
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateReceiptItem(
                                                                                index,
                                                                                "receivedQuantity",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={
                                                                            item.receivedQuantity
                                                                        }
                                                                        step="any"
                                                                        className="goods-receipts-item-input"
                                                                        value={
                                                                            item.rejectedQuantity
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateReceiptItem(
                                                                                index,
                                                                                "rejectedQuantity",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-accepted">
                                                                        {
                                                                            item.acceptedQuantity
                                                                        }
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-readonly">
                                                                        ₹
                                                                        {formatAmount(
                                                                            item.unitPrice
                                                                        )}
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-readonly">
                                                                        {
                                                                            item.discountPercentage
                                                                        }
                                                                        %
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-readonly">
                                                                        {
                                                                            item.taxPercentage
                                                                        }
                                                                        %
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span className="goods-receipts-item-total">
                                                                        ₹
                                                                        {formatAmount(
                                                                            calculateLineTotal(
                                                                                item
                                                                            )
                                                                        )}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                     {/* =================================================
                                               BARCODE SCANNER
                                  ================================================= */}

<div className="goods-receipts-barcode">
    <div className="goods-receipts-barcode-header">
        <label>
            Scan Barcode
        </label>

        <span>
            Scan a product from this Purchase Order
        </span>
    </div>

    <div className="goods-receipts-barcode-input">
        <input
            type="text"
            value={barcodeValue}
            onChange={(e) =>
                setBarcodeValue(
                    e.target.value
                )
            }
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeLookup();
                }
            }}
            placeholder="Scan or enter product barcode"
            disabled={barcodeLoading}
        />

        <button
            type="button"
            onClick={handleBarcodeLookup}
            disabled={
                barcodeLoading ||
                !barcodeValue.trim()
            }
        >
            <FiSearch />

            {barcodeLoading
                ? "Searching..."
                : "Search"}
        </button>
    </div>
</div>
                                    {/* ITEM DETAILS */}

                                    {receiptItems.length >
                                        0 && (
                                        <div className="goods-receipts-item-details">

                                            <h4 className="goods-receipts-item-details-title">
                                                Batch / Serial /
                                                Date Details
                                            </h4>

                                            <div className="goods-receipts-form-group">
                                                <label className="goods-receipts-form-label">
                                                    Item
                                                </label>

                                                <select
                                                    className="goods-receipts-select"
                                                    value={
                                                        ""
                                                    }
                                                    onChange={() => {}}
                                                >
                                                    <option value="">
                                                        Details are
                                                        entered per
                                                        item below
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="goods-receipts-form-group">
                                                <label className="goods-receipts-form-label">
                                                    Batch Number
                                                </label>

                                                <input
                                                    className="goods-receipts-input"
                                                    placeholder="Enter batch number in item row"
                                                    disabled
                                                />
                                            </div>

                                            <div className="goods-receipts-form-group">
                                                <label className="goods-receipts-form-label">
                                                    Serial Numbers
                                                </label>

                                                <input
                                                    className="goods-receipts-input"
                                                    placeholder="Comma separated"
                                                    disabled
                                                />
                                            </div>

                                            <div className="goods-receipts-form-group">
                                                <label className="goods-receipts-form-label">
                                                    Dates
                                                </label>

                                                <input
                                                    className="goods-receipts-input"
                                                    placeholder="Entered in item details"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* =================================================
                                        EXTRA ITEM DETAILS
                                    ================================================= */}

                                    {receiptItems.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    item.purchaseOrderItem
                                                }
                                               style={{
    marginTop: "14px",
    padding: "14px",
    border: "1px solid var(--border-color)",
    borderRadius: "9px",
    background: "var(--input-bg)",
}}
                                            >
                                                <div
                                                    style={{
                                                        marginBottom:
                                                            "12px",
                                                       color: "var(--text-primary)",
                                                        fontSize:
                                                            "12px",
                                                        fontWeight:
                                                            600,
                                                    }}
                                                >
                                                    {getProductName(
                                                        item.productData
                                                    )}
                                                </div>

                                                <div className="goods-receipts-form-grid">

                                                    <div className="goods-receipts-form-group">
                                                        <label className="goods-receipts-form-label">
                                                            Batch Number
                                                        </label>

                                                        <input
                                                            className="goods-receipts-input"
                                                            value={
                                                                item.batchNumber
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateReceiptItem(
                                                                    index,
                                                                    "batchNumber",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Batch number"
                                                        />
                                                    </div>

                                                    <div className="goods-receipts-form-group">
                                                        <label className="goods-receipts-form-label">
                                                            Serial Numbers
                                                        </label>

                                                        <input
                                                            className="goods-receipts-input"
                                                            value={
                                                                item.serialNumbers
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateReceiptItem(
                                                                    index,
                                                                    "serialNumbers",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="SN001, SN002..."
                                                        />
                                                    </div>

                                                    <div className="goods-receipts-form-group">
                                                        <label className="goods-receipts-form-label">
                                                            Manufacturing
                                                            Date
                                                        </label>

                                                        <input
                                                            type="date"
                                                            className="goods-receipts-input"
                                                            value={
                                                                item.manufacturingDate
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateReceiptItem(
                                                                    index,
                                                                    "manufacturingDate",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="goods-receipts-form-group">
                                                        <label className="goods-receipts-form-label">
                                                            Expiry Date
                                                        </label>

                                                        <input
                                                            type="date"
                                                            className="goods-receipts-input"
                                                            value={
                                                                item.expiryDate
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateReceiptItem(
                                                                    index,
                                                                    "expiryDate",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="goods-receipts-form-group full-width">
                                                        <label className="goods-receipts-form-label">
                                                            Item Notes
                                                        </label>

                                                        <input
                                                            className="goods-receipts-input"
                                                            value={
                                                                item.notes
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateReceiptItem(
                                                                    index,
                                                                    "notes",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Item notes"
                                                        />
                                                    </div>

                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* TOTALS */}

                                    <div className="goods-receipts-totals">

                                        <div className="goods-receipts-total-row">
                                            <span>
                                                Accepted Quantity
                                            </span>

                                            <strong>
                                                {
                                                    formTotals.quantity
                                                }
                                            </strong>
                                        </div>

                                        <div className="goods-receipts-total-row">
                                            <span>
                                                Rejected Quantity
                                            </span>

                                            <strong>
                                                {
                                                    formTotals.rejected
                                                }
                                            </strong>
                                        </div>

                                        <div className="goods-receipts-total-row grand-total">
                                            <span>
                                                Total Amount
                                            </span>

                                            <strong>
                                                ₹
                                                {formatAmount(
                                                    formTotals.amount
                                                )}
                                            </strong>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER */}

                        <div className="goods-receipts-modal-footer">

                            <button
                                type="button"
                                className="goods-receipts-btn goods-receipts-btn-secondary"
                                onClick={
                                    closeCreateModal
                                }
                                disabled={
                                    loadingForm
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="goods-receipts-btn goods-receipts-btn-secondary"
                                onClick={() =>
                                    handleCreateReceipt(
                                        "DRAFT"
                                    )
                                }
                                disabled={
                                    loadingForm
                                }
                            >
                                <FiFileText />
                                {loadingForm
                                    ? "Saving..."
                                    : "Save Draft"}
                            </button>

                            <button
                                type="button"
                                className="goods-receipts-btn goods-receipts-btn-success"
                                onClick={() =>
                                    handleCreateReceipt(
                                        "RECEIVED"
                                    )
                                }
                                disabled={
                                    loadingForm
                                }
                            >
                                <FiCheckCircle />

                                {loadingForm
                                    ? "Processing..."
                                    : "Receive Goods"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {showViewModal &&
                selectedReceipt && (
                    <div className="goods-receipts-modal-overlay">

                        <div className="goods-receipts-modal">

                            <div className="goods-receipts-modal-header">
                                <div className="goods-receipts-modal-title">
                                    <FiEye
                                        style={{
                                            color:
                                                "#60a5fa",
                                        }}
                                    />

                                    <div>
                                        <h2>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.grnNumber
                                            }
                                        </h2>

                                        <p>
                                            Goods Receipt
                                            Details
                                        </p>
                                    </div>
                                </div>

                                <button
                                    className="goods-receipts-modal-close"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="goods-receipts-modal-body">

                                <div className="goods-receipts-view-grid">

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            GRN Number
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.grnNumber
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Purchase Order
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.purchaseOrder
                                                    ?.poNumber
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            <span
                                                className={getStatusClass(
                                                    selectedReceipt
                                                        .goodsReceipt
                                                        ?.status
                                                )}
                                            >
                                                {formatStatus(
                                                    selectedReceipt
                                                        .goodsReceipt
                                                        ?.status
                                                )}
                                            </span>
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Company
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.company
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Branch
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.branch
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Supplier
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.supplier
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Warehouse
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.warehouse
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Receipt Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.receiptDate
                                            )}
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Invoice Number
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.invoiceNumber ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Invoice Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.invoiceDate
                                            )}
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Vehicle Number
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.vehicleNumber ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Received By
                                        </span>

                                        <strong>
                                            {
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.receivedBy
                                                    ?.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Total Quantity
                                        </span>

                                        <strong>
                                            {Number(
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.totalQuantity ||
                                                    0
                                            )}
                                        </strong>
                                    </div>

                                    <div className="goods-receipts-view-card">
                                        <span>
                                            Total Amount
                                        </span>

                                        <strong>
                                            ₹
                                            {formatAmount(
                                                selectedReceipt
                                                    .goodsReceipt
                                                    ?.totalAmount
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                {/* VIEW ITEMS */}

                                <div className="goods-receipts-view-items">

                                    <div className="goods-receipts-section-header">
                                        <h3>
                                            Received Items
                                        </h3>

                                        <span>
                                            {
                                                selectedReceipt
                                                    .items
                                                    ?.length ||
                                                0
                                            }{" "}
                                            item(s)
                                        </span>
                                    </div>

                                    <div className="goods-receipts-view-items-wrapper">
                                        <table className="goods-receipts-view-items-table">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        Product
                                                    </th>

                                                    <th>
                                                        Ordered
                                                    </th>

                                                    <th>
                                                        Previously
                                                        Received
                                                    </th>

                                                    <th>
                                                        Received
                                                    </th>

                                                    <th>
                                                        Rejected
                                                    </th>

                                                    <th>
                                                        Accepted
                                                    </th>

                                                    <th>
                                                        Pending
                                                    </th>

                                                    <th>
                                                        Unit Price
                                                    </th>

                                                    <th>
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {(
                                                    selectedReceipt
                                                        .items ||
                                                    []
                                                ).map(
                                                    (
                                                        item
                                                    ) => (
                                                        <tr
                                                            key={
                                                                item._id
                                                            }
                                                        >
                                                            <td>
                                                                <strong>
                                                                    {getProductName(
                                                                        item.product
                                                                    )}
                                                                </strong>

                                                                {item
                                                                    .product
                                                                    ?.sku && (
                                                                    <span className="goods-receipts-secondary-text">
                                                                        {
                                                                            item
                                                                                .product
                                                                                .sku
                                                                        }
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.orderedQuantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.previouslyReceivedQuantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.receivedQuantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.rejectedQuantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.acceptedQuantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.pendingQuantity
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
                                                                    item.lineTotal
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* NOTES */}

                                {selectedReceipt
                                    .goodsReceipt
                                    ?.notes && (
                                    <div
                                        style={{
                                            marginTop:
                                                "20px",
                                        }}
                                    >
                                        <div className="goods-receipts-view-card">
                                            <span>
                                                Notes
                                            </span>

                                            <strong>
                                                {
                                                    selectedReceipt
                                                        .goodsReceipt
                                                        .notes
                                                }
                                            </strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="goods-receipts-modal-footer">
                                <button
                                    className="goods-receipts-btn goods-receipts-btn-secondary"
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
};

export default GoodsReceipts;