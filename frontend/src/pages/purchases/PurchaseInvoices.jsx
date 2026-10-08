import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEye,
    FiEdit2,
    FiTrash2,
    FiFileText,
    FiRefreshCw,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiPackage,
    FiTruck,
    FiCalendar,
    FiDollarSign,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/purchaseInvoices.css";

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
    company: "",
    branch: "",
    supplier: "",
    purchaseOrder: "",
    goodsReceipt: "",

    invoiceNumber: "",
    invoiceDate: today,
    dueDate: "",

    paymentTerms: 0,
    currency: "INR",

    shippingAmount: 0,
    otherCharges: 0,
    roundOffAmount: 0,
    paidAmount: 0,

    notes: "",
    termsAndConditions: "",
};

const emptyItem = {
    product: "",
    productData: null,

    quantity: 1,
    unitPrice: 0,

    discountPercentage: 0,
    taxPercentage: 0,
    cessPercentage: 0,

    purchaseOrderItem: "",
    goodsReceiptItem: "",

    notes: "",
};

const PurchaseInvoices = () => {
    /* =====================================================
       LIST STATE
    ===================================================== */

    const [invoices, setInvoices] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [goodsReceipts, setGoodsReceipts] = useState([]);

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] =
        useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    /* =====================================================
       MODAL STATE
    ===================================================== */

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingInvoice, setEditingInvoice] =
        useState(null);

    const [selectedInvoice, setSelectedInvoice] =
        useState(null);

    /* =====================================================
       FORM STATE
    ===================================================== */

    const [formData, setFormData] =
        useState(emptyForm);

    const [invoiceItems, setInvoiceItems] =
        useState([{ ...emptyItem }]);

    /* =====================================================
       HELPERS
    ===================================================== */

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleError = (err, fallback) => {
        console.error(err);

        const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            fallback;

        setError(message);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Number(value || 0));
    };

    const formatDate = (value) => {
        if (!value) return "-";

        return new Date(value).toLocaleDateString(
            "en-IN"
        );
    };

    const getStatusClass = (status) => {
        return String(status || "")
            .toLowerCase()
            .replaceAll("_", "-");
    };

    /* =====================================================
       FETCH COMPANIES
    ===================================================== */

    const fetchCompanies = async () => {
        try {
            const response = await api.get(
                "/companies?page=1&limit=100"
            );

            setCompanies(
                response.data?.companies ||
                    response.data?.data ||
                    []
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load companies"
            );
        }
    };

    /* =====================================================
       FETCH BRANCHES
    ===================================================== */

    const fetchBranches = async (companyId) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setBranches(
                response.data?.branches ||
                    response.data?.data ||
                    []
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load branches"
            );
        }
    };

    /* =====================================================
       FETCH SUPPLIERS
    ===================================================== */

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
                response.data?.data ||
                    response.data?.suppliers ||
                    []
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load suppliers"
            );
        }
    };

    /* =====================================================
       FETCH PRODUCTS
    ===================================================== */

    const fetchProducts = async (companyId) => {
        if (!companyId) {
            setProducts([]);
            return;
        }

        try {
            const response = await api.get(
                `/products?company=${companyId}&page=1&limit=100`
            );

            setProducts(
                response.data?.products ||
                    response.data?.data ||
                    []
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load products"
            );
        }
    };

    /* =====================================================
       FETCH PURCHASE ORDERS
    ===================================================== */

    const fetchPurchaseOrders = async (
        companyId,
        branchId,
        supplierId
    ) => {
        if (
            !companyId ||
            !branchId ||
            !supplierId
        ) {
            setPurchaseOrders([]);
            return;
        }

        try {
            const response = await api.get(
                `/purchase-orders?company=${companyId}&branch=${branchId}&supplier=${supplierId}&page=1&limit=100`
            );

            setPurchaseOrders(
                response.data?.data ||
                    response.data?.purchaseOrders ||
                    []
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load purchase orders"
            );
        }
    };

    /* =====================================================
       FETCH GOODS RECEIPTS
    ===================================================== */

    const fetchGoodsReceipts = async (
        companyId,
        branchId,
        supplierId
    ) => {
        if (
            !companyId ||
            !branchId ||
            !supplierId
        ) {
            setGoodsReceipts([]);
            return;
        }

        try {
            const response = await api.get(
                `/goods-receipts?company=${companyId}&branch=${branchId}&supplier=${supplierId}&page=1&limit=100`
            );

            setGoodsReceipts(
                response.data?.data ||
                    response.data?.goodsReceipts ||
                    []
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load goods receipts"
            );
        }
    };

    /* =====================================================
       FETCH INVOICES
    ===================================================== */

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            clearMessages();

            const params = new URLSearchParams();

            params.append("page", page);
            params.append("limit", limit);

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            if (statusFilter) {
                params.append(
                    "status",
                    statusFilter
                );
            }

            if (paymentStatusFilter) {
                params.append(
                    "paymentStatus",
                    paymentStatusFilter
                );
            }

            const response = await api.get(
                `/purchase-invoices?${params.toString()}`
            );

            setInvoices(
                response.data?.data || []
            );

            setTotalPages(
                response.data?.pagination
                    ?.totalPages || 1
            );
        } catch (err) {
            handleError(
                err,
                "Failed to load purchase invoices"
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
        fetchInvoices();
    }, [
        page,
        search,
        statusFilter,
        paymentStatusFilter,
    ]);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* =====================================================
       COMPANY CHANGE
    ===================================================== */

    const handleCompanyChange = async (e) => {
        const companyId =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            supplier: "",
            purchaseOrder: "",
            goodsReceipt: "",
        }));

        setBranches([]);
        setSuppliers([]);
        setPurchaseOrders([]);
        setGoodsReceipts([]);

        await fetchBranches(companyId);
        await fetchProducts(companyId);
    };

    /* =====================================================
       BRANCH CHANGE
    ===================================================== */

    const handleBranchChange = async (e) => {
        const branchId =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            branch: branchId,
            supplier: "",
            purchaseOrder: "",
            goodsReceipt: "",
        }));

        setSuppliers([]);
        setPurchaseOrders([]);
        setGoodsReceipts([]);

        await fetchSuppliers(
            formData.company,
            branchId
        );
    };

    /* =====================================================
       SUPPLIER CHANGE
    ===================================================== */

    const handleSupplierChange = async (e) => {
        const supplierId =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            supplier: supplierId,
            purchaseOrder: "",
            goodsReceipt: "",
        }));

        setPurchaseOrders([]);
        setGoodsReceipts([]);

        await fetchPurchaseOrders(
            formData.company,
            formData.branch,
            supplierId
        );

        await fetchGoodsReceipts(
            formData.company,
            formData.branch,
            supplierId
        );
    };

    /* =====================================================
       PURCHASE ORDER CHANGE
    ===================================================== */

    const handlePurchaseOrderChange = (
        e
    ) => {
        const value =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            purchaseOrder: value,
        }));
    };

    /* =====================================================
       GOODS RECEIPT CHANGE
    ===================================================== */

    const handleGoodsReceiptChange = (
        e
    ) => {
        const value =
            e.target.value;

        setFormData((prev) => ({
            ...prev,
            goodsReceipt: value,
        }));
    };

    /* =====================================================
       ITEM PRODUCT CHANGE
    ===================================================== */

    const handleItemProductChange = (
        index,
        productId
    ) => {
        const product =
            products.find(
                (item) =>
                    item._id === productId
            );

        setInvoiceItems((prev) =>
            prev.map((item, itemIndex) => {
                if (
                    itemIndex !== index
                ) {
                    return item;
                }

                return {
                    ...item,
                    product: productId,
                    productData:
                        product || null,
                    unitPrice:
                        product?.purchasePrice ||
                        0,
                    purchaseOrderItem: "",
                    goodsReceiptItem: "",
                };
            })
        );
    };

    /* =====================================================
       ITEM CHANGE
    ===================================================== */

    const handleItemChange = (
        index,
        field,
        value
    ) => {
        setInvoiceItems((prev) =>
            prev.map((item, itemIndex) => {
                if (
                    itemIndex !== index
                ) {
                    return item;
                }

                return {
                    ...item,
                    [field]: value,
                };
            })
        );
    };

    /* =====================================================
       ADD ITEM
    ===================================================== */

    const addItem = () => {
        setInvoiceItems((prev) => [
            ...prev,
            { ...emptyItem },
        ]);
    };

    /* =====================================================
       REMOVE ITEM
    ===================================================== */

    const removeItem = (index) => {
        if (invoiceItems.length === 1) {
            return;
        }

        setInvoiceItems((prev) =>
            prev.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    /* =====================================================
       ITEM CALCULATION
    ===================================================== */

    const calculateItem = (item) => {
        const quantity =
            Number(item.quantity) || 0;

        const unitPrice =
            Number(item.unitPrice) || 0;

        const discountPercentage =
            Number(
                item.discountPercentage
            ) || 0;

        const taxPercentage =
            Number(item.taxPercentage) || 0;

        const cessPercentage =
            Number(item.cessPercentage) || 0;

        const grossAmount =
            quantity * unitPrice;

        const discountAmount =
            grossAmount *
            (discountPercentage / 100);

        const taxableAmount =
            grossAmount -
            discountAmount;

        const taxAmount =
            taxableAmount *
            (taxPercentage / 100);

        const cessAmount =
            taxableAmount *
            (cessPercentage / 100);

        const lineTotal =
            taxableAmount +
            taxAmount +
            cessAmount;

        return {
            grossAmount,
            discountAmount,
            taxableAmount,
            taxAmount,
            cessAmount,
            lineTotal,
        };
    };

    /* =====================================================
       INVOICE TOTALS
    ===================================================== */

    const totals = useMemo(() => {
        let subtotal = 0;
        let discountAmount = 0;
        let taxAmount = 0;
        let totalAmount = 0;

        invoiceItems.forEach((item) => {
            const calculated =
                calculateItem(item);

            subtotal +=
                calculated.grossAmount;

            discountAmount +=
                calculated.discountAmount;

            taxAmount +=
                calculated.taxAmount;

            totalAmount +=
                calculated.lineTotal;
        });

        const shippingAmount =
            Number(
                formData.shippingAmount
            ) || 0;

        const otherCharges =
            Number(
                formData.otherCharges
            ) || 0;

        const roundOffAmount =
            Number(
                formData.roundOffAmount
            ) || 0;

        totalAmount =
            totalAmount +
            shippingAmount +
            otherCharges +
            roundOffAmount;

        const paidAmount =
            Number(
                formData.paidAmount
            ) || 0;

        const dueAmount =
            Math.max(
                totalAmount -
                    paidAmount,
                0
            );

        let paymentStatus =
            "UNPAID";

        if (paidAmount > 0 && dueAmount > 0) {
            paymentStatus =
                "PARTIALLY_PAID";
        }

        if (
            totalAmount > 0 &&
            dueAmount === 0
        ) {
            paymentStatus = "PAID";
        }

        return {
            subtotal,
            discountAmount,
            taxAmount,
            shippingAmount,
            otherCharges,
            roundOffAmount,
            totalAmount,
            paidAmount,
            dueAmount,
            paymentStatus,
        };
    }, [
        invoiceItems,
        formData.shippingAmount,
        formData.otherCharges,
        formData.roundOffAmount,
        formData.paidAmount,
    ]);

    /* =====================================================
       OPEN CREATE MODAL
    ===================================================== */

    const openCreateModal = () => {
        clearMessages();

        setEditingInvoice(null);

        setFormData({
            ...emptyForm,
            invoiceDate: today,
        });

        setInvoiceItems([
            { ...emptyItem },
        ]);

        setBranches([]);
        setSuppliers([]);
        setPurchaseOrders([]);
        setGoodsReceipts([]);
        setProducts([]);

        setShowModal(true);
    };

    /* =====================================================
       OPEN EDIT MODAL
       Backend allows ONLY header/payment fields
       ===================================================== */

    const openEditModal = async (
        invoice
    ) => {
        try {
            clearMessages();

            setSaving(true);

            const response =
                await api.get(
                    `/purchase-invoices/${invoice._id}`
                );

            const data =
                response.data?.data;

            const fullInvoice =
                data?.invoice;

            if (!fullInvoice) {
                throw new Error(
                    "Invoice data not found"
                );
            }

            setEditingInvoice(
                fullInvoice
            );

            setFormData({
                company:
                    fullInvoice.company?._id ||
                    fullInvoice.company ||
                    "",

                branch:
                    fullInvoice.branch?._id ||
                    fullInvoice.branch ||
                    "",

                supplier:
                    fullInvoice.supplier?._id ||
                    fullInvoice.supplier ||
                    "",

                purchaseOrder:
                    fullInvoice.purchaseOrder?._id ||
                    fullInvoice.purchaseOrder ||
                    "",

                goodsReceipt:
                    fullInvoice.goodsReceipt?._id ||
                    fullInvoice.goodsReceipt ||
                    "",

                invoiceNumber:
                    fullInvoice.invoiceNumber ||
                    "",

                invoiceDate:
                    fullInvoice.invoiceDate
                        ? new Date(
                              fullInvoice.invoiceDate
                          )
                              .toISOString()
                              .split("T")[0]
                        : "",

                dueDate:
                    fullInvoice.dueDate
                        ? new Date(
                              fullInvoice.dueDate
                          )
                              .toISOString()
                              .split("T")[0]
                        : "",

                paymentTerms:
                    fullInvoice.paymentTerms ||
                    0,

                currency:
                    fullInvoice.currency ||
                    "INR",

                shippingAmount:
                    fullInvoice.shippingAmount ||
                    0,

                otherCharges:
                    fullInvoice.otherCharges ||
                    0,

                roundOffAmount:
                    fullInvoice.roundOffAmount ||
                    0,

                paidAmount:
                    fullInvoice.paidAmount ||
                    0,

                notes:
                    fullInvoice.notes ||
                    "",

                termsAndConditions:
                    fullInvoice.termsAndConditions ||
                    "",
            });

            await fetchBranches(
                fullInvoice.company?._id ||
                    fullInvoice.company
            );

            await fetchSuppliers(
                fullInvoice.company?._id ||
                    fullInvoice.company,
                fullInvoice.branch?._id ||
                    fullInvoice.branch
            );

            await fetchProducts(
                fullInvoice.company?._id ||
                    fullInvoice.company
            );

            setInvoiceItems(
                data?.items?.length
                    ? data.items.map(
                          (item) => ({
                              product:
                                  item.product?._id ||
                                  item.product ||
                                  "",

                              productData:
                                  item.product ||
                                  null,

                              quantity:
                                  item.quantity ||
                                  0,

                              unitPrice:
                                  item.unitPrice ||
                                  0,

                              discountPercentage:
                                  item.discountPercentage ||
                                  0,

                              taxPercentage:
                                  item.taxPercentage ||
                                  0,

                              cessPercentage:
                                  item.cessPercentage ||
                                  0,

                              purchaseOrderItem:
                                  item.purchaseOrderItem?._id ||
                                  item.purchaseOrderItem ||
                                  "",

                              goodsReceiptItem:
                                  item.goodsReceiptItem?._id ||
                                  item.goodsReceiptItem ||
                                  "",

                              notes:
                                  item.notes ||
                                  "",
                          })
                      )
                    : [
                          {
                              ...emptyItem,
                          },
                      ]
            );

            setShowModal(true);
        } catch (err) {
            handleError(
                err,
                "Failed to load invoice"
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       VALIDATE CREATE
    ===================================================== */

    const validateCreate = () => {
        if (!formData.company) {
            return "Company is required";
        }

        if (!formData.branch) {
            return "Branch is required";
        }

        if (!formData.supplier) {
            return "Supplier is required";
        }

        if (!formData.invoiceNumber.trim()) {
            return "Invoice number is required";
        }

        if (!formData.invoiceDate) {
            return "Invoice date is required";
        }

        if (!invoiceItems.length) {
            return "At least one invoice item is required";
        }

        const productsUsed = new Set();

        for (
            let i = 0;
            i < invoiceItems.length;
            i++
        ) {
            const item =
                invoiceItems[i];

            if (!item.product) {
                return `Product is required in item ${
                    i + 1
                }`;
            }

            if (
                productsUsed.has(
                    item.product
                )
            ) {
                return `Duplicate product found in item ${
                    i + 1
                }`;
            }

            productsUsed.add(
                item.product
            );

            if (
                Number(item.quantity) <= 0
            ) {
                return `Quantity must be greater than 0 in item ${
                    i + 1
                }`;
            }

            if (
                Number(item.unitPrice) < 0
            ) {
                return `Unit price cannot be negative in item ${
                    i + 1
                }`;
            }

            if (
                Number(
                    item.discountPercentage
                ) < 0 ||
                Number(
                    item.discountPercentage
                ) > 100
            ) {
                return `Invalid discount percentage in item ${
                    i + 1
                }`;
            }

            if (
                Number(
                    item.taxPercentage
                ) < 0 ||
                Number(
                    item.taxPercentage
                ) > 100
            ) {
                return `Invalid tax percentage in item ${
                    i + 1
                }`;
            }

            if (
                Number(
                    item.cessPercentage
                ) < 0 ||
                Number(
                    item.cessPercentage
                ) > 100
            ) {
                return `Invalid cess percentage in item ${
                    i + 1
                }`;
            }
        }

        if (
            Number(formData.shippingAmount) <
            0
        ) {
            return "Shipping amount cannot be negative";
        }

        if (
            Number(formData.otherCharges) <
            0
        ) {
            return "Other charges cannot be negative";
        }

        if (
            Number(formData.paidAmount) <
            0
        ) {
            return "Paid amount cannot be negative";
        }

        if (
            Number(formData.paidAmount) >
            totals.totalAmount
        ) {
            return "Paid amount cannot exceed total amount";
        }

        return "";
    };

    /* =====================================================
       BUILD CREATE PAYLOAD
       Backend calculates totals
       ===================================================== */

    const buildCreatePayload = () => {
        return {
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

            invoiceNumber:
                formData.invoiceNumber.trim(),

            invoiceDate:
                formData.invoiceDate,

            dueDate:
                formData.dueDate || null,

            paymentTerms:
                Number(
                    formData.paymentTerms
                ) || 0,

            currency:
                formData.currency
                    .trim()
                    .toUpperCase(),

            shippingAmount:
                Number(
                    formData.shippingAmount
                ) || 0,

            otherCharges:
                Number(
                    formData.otherCharges
                ) || 0,

            roundOffAmount:
                Number(
                    formData.roundOffAmount
                ) || 0,

            paidAmount:
                Number(
                    formData.paidAmount
                ) || 0,

            notes:
                formData.notes.trim(),

            termsAndConditions:
                formData.termsAndConditions.trim(),

            items: invoiceItems.map(
                (item) => ({
                    product:
                        item.product,

                    quantity:
                        Number(
                            item.quantity
                        ),

                    unitPrice:
                        Number(
                            item.unitPrice
                        ),

                    discountPercentage:
                        Number(
                            item.discountPercentage
                        ) || 0,

                    taxPercentage:
                        Number(
                            item.taxPercentage
                        ) || 0,

                    cessPercentage:
                        Number(
                            item.cessPercentage
                        ) || 0,

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

                    notes:
                        item.notes?.trim() ||
                        "",
                })
            ),
        };
    };

    /* =====================================================
       CREATE INVOICE
    ===================================================== */

    const handleCreateInvoice =
        async () => {
            const validation =
                validateCreate();

            if (validation) {
                setError(validation);
                return;
            }

            try {
                setSaving(true);
                clearMessages();

                const payload =
                    buildCreatePayload();

                await api.post(
                    "/purchase-invoices",
                    payload
                );

                setSuccess(
                    "Purchase invoice created successfully"
                );

                setShowModal(false);

                await fetchInvoices();
            } catch (err) {
                handleError(
                    err,
                    "Failed to create purchase invoice"
                );
            } finally {
                setSaving(false);
            }
        };

    /* =====================================================
       UPDATE INVOICE
       Only header/payment fields
    ===================================================== */

    const handleUpdateInvoice =
        async () => {
            if (!editingInvoice?._id) {
                return;
            }

            try {
                setSaving(true);
                clearMessages();

                const payload = {
                    invoiceDate:
                        formData.invoiceDate,

                    dueDate:
                        formData.dueDate ||
                        null,

                    paymentTerms:
                        Number(
                            formData.paymentTerms
                        ) || 0,

                    currency:
                        formData.currency
                            .trim()
                            .toUpperCase(),

                    shippingAmount:
                        Number(
                            formData.shippingAmount
                        ) || 0,

                    otherCharges:
                        Number(
                            formData.otherCharges
                        ) || 0,

                    roundOffAmount:
                        Number(
                            formData.roundOffAmount
                        ) || 0,

                    paidAmount:
                        Number(
                            formData.paidAmount
                        ) || 0,

                    notes:
                        formData.notes.trim(),

                    termsAndConditions:
                        formData.termsAndConditions.trim(),
                };

                await api.put(
                    `/purchase-invoices/${editingInvoice._id}`,
                    payload
                );

                setSuccess(
                    "Purchase invoice updated successfully"
                );

                setShowModal(false);

                await fetchInvoices();
            } catch (err) {
                handleError(
                    err,
                    "Failed to update purchase invoice"
                );
            } finally {
                setSaving(false);
            }
        };

    /* =====================================================
       SAVE
    ===================================================== */

    const handleSubmit = () => {
        if (editingInvoice) {
            handleUpdateInvoice();
        } else {
            handleCreateInvoice();
        }
    };

    /* =====================================================
       VIEW INVOICE
    ===================================================== */

    const handleView = async (
        invoice
    ) => {
        try {
            clearMessages();

            setLoading(true);

            const response =
                await api.get(
                    `/purchase-invoices/${invoice._id}`
                );

            setSelectedInvoice(
                response.data?.data || null
            );

            setShowViewModal(true);
        } catch (err) {
            handleError(
                err,
                "Failed to load invoice details"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       DELETE
       Backend allows only DRAFT
    ===================================================== */

    const handleDelete = async (
        invoice
    ) => {
        if (
            invoice.status !==
            "DRAFT"
        ) {
            setError(
                "Only draft purchase invoices can be deleted"
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Delete purchase invoice ${invoice.invoiceNumber}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            clearMessages();

            await api.delete(
                `/purchase-invoices/${invoice._id}`
            );

            setSuccess(
                "Purchase invoice deleted successfully"
            );

            await fetchInvoices();
        } catch (err) {
            handleError(
                err,
                "Failed to delete purchase invoice"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingInvoice(null);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedInvoice(null);
    };

    /* =====================================================
       RESET FILTER
    ===================================================== */

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("");
        setPaymentStatusFilter("");
        setPage(1);
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="purchase-invoices-page">

            {/* =================================================
               PAGE HEADER
            ================================================= */}

            <div className="purchase-invoices-header">

                <div>
                    <h1>
                        Purchase Invoices
                    </h1>

                    <p>
                        Manage supplier purchase invoices
                    </p>
                </div>

                <div className="purchase-invoices-header-actions">

                    <button
                        className="purchase-invoices-refresh-btn"
                        onClick={fetchInvoices}
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
                        className="purchase-invoices-add-btn"
                        onClick={
                            openCreateModal
                        }
                    >
                        <FiPlus />

                        New Invoice
                    </button>

                </div>
            </div>

            {/* =================================================
               ALERTS
            ================================================= */}

            {success && (
                <div className="purchase-invoices-alert success">
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

            {error && (
                <div className="purchase-invoices-alert error">
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

            {/* =================================================
               SUMMARY
            ================================================= */}

            <div className="purchase-invoices-summary">

                <div className="purchase-invoices-summary-card">

                    <div className="summary-icon">
                        <FiFileText />
                    </div>

                    <div>
                        <span>
                            Total Invoices
                        </span>

                        <strong>
                            {invoices.length}
                        </strong>
                    </div>

                </div>

                <div className="purchase-invoices-summary-card">

                    <div className="summary-icon">
                        <FiDollarSign />
                    </div>

                    <div>
                        <span>
                            Current Page Value
                        </span>

                        <strong>
                            {formatCurrency(
                                invoices.reduce(
                                    (
                                        total,
                                        invoice
                                    ) =>
                                        total +
                                        Number(
                                            invoice.totalAmount ||
                                                0
                                        ),
                                    0
                                )
                            )}
                        </strong>
                    </div>

                </div>

                <div className="purchase-invoices-summary-card">

                    <div className="summary-icon">
                        <FiPackage />
                    </div>

                    <div>
                        <span>
                            Paid
                        </span>

                        <strong>
                            {
                                invoices.filter(
                                    (invoice) =>
                                        invoice.paymentStatus ===
                                        "PAID"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

                <div className="purchase-invoices-summary-card">

                    <div className="summary-icon">
                        <FiTruck />
                    </div>

                    <div>
                        <span>
                            Pending Payment
                        </span>

                        <strong>
                            {
                                invoices.filter(
                                    (invoice) =>
                                        invoice.paymentStatus ===
                                            "UNPAID" ||
                                        invoice.paymentStatus ===
                                            "PARTIALLY_PAID"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
               FILTERS
            ================================================= */}

            <div className="purchase-invoices-filters">

                <div className="purchase-invoices-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search invoice, internal number or supplier..."
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

                    <option value="DRAFT">
                        Draft
                    </option>

                    <option value="POSTED">
                        Posted
                    </option>

                    <option value="PARTIALLY_PAID">
                        Partially Paid
                    </option>

                    <option value="PAID">
                        Paid
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>
                </select>

                <select
                    value={
                        paymentStatusFilter
                    }
                    onChange={(e) => {
                        setPaymentStatusFilter(
                            e.target.value
                        );
                        setPage(1);
                    }}
                >
                    <option value="">
                        All Payment Status
                    </option>

                    <option value="UNPAID">
                        Unpaid
                    </option>

                    <option value="PARTIALLY_PAID">
                        Partially Paid
                    </option>

                    <option value="PAID">
                        Paid
                    </option>

                    <option value="OVERDUE">
                        Overdue
                    </option>

                    <option value="CANCELLED">
                        Cancelled
                    </option>
                </select>

                <button
                    className="purchase-invoices-reset-btn"
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

            <div className="purchase-invoices-table-card">

                <div className="purchase-invoices-table-wrapper">

                    <table className="purchase-invoices-table">

                        <thead>
                            <tr>
                                <th>
                                    Invoice
                                </th>

                                <th>
                                    Internal No.
                                </th>

                                <th>
                                    Supplier
                                </th>

                                <th>
                                    Invoice Date
                                </th>

                                <th>
                                    Purchase Order
                                </th>

                                <th>
                                    GRN
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Paid
                                </th>

                                <th>
                                    Due
                                </th>

                                <th>
                                    Payment
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
                                        colSpan="12"
                                        className="purchase-invoices-empty"
                                    >
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="12"
                                        className="purchase-invoices-empty"
                                    >
                                        No purchase invoices found
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(
                                    (
                                        invoice
                                    ) => (
                                        <tr
                                            key={
                                                invoice._id
                                            }
                                        >

                                            <td>
                                                <div className="invoice-number-cell">
                                                    <strong>
                                                        {
                                                            invoice.invoiceNumber
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            invoice.currency
                                                        }
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="invoice-code">
                                                    {
                                                        invoice.internalInvoiceNumber ||
                                                        "-"
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="supplier-cell">

                                                    <strong>
                                                        {invoice
                                                            .supplier
                                                            ?.name ||
                                                            "-"}
                                                    </strong>

                                                    <small>
                                                        {invoice
                                                            .supplier
                                                            ?.supplierCode ||
                                                            ""}
                                                    </small>

                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        invoice.invoiceDate
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {invoice
                                                    .purchaseOrder
                                                    ?.poNumber ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {invoice
                                                    .goodsReceipt
                                                    ?.grnNumber ||
                                                    "-"}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatCurrency(
                                                        invoice.totalAmount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {formatCurrency(
                                                    invoice.paidAmount
                                                )}
                                            </td>

                                            <td>
                                                <strong className="invoice-due-amount">
                                                    {formatCurrency(
                                                        invoice.dueAmount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={`invoice-status-badge payment-${getStatusClass(
                                                        invoice.paymentStatus
                                                    )}`}
                                                >
                                                    {String(
                                                        invoice.paymentStatus ||
                                                            "-"
                                                    ).replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`invoice-status-badge status-${getStatusClass(
                                                        invoice.status
                                                    )}`}
                                                >
                                                    {String(
                                                        invoice.status ||
                                                            "-"
                                                    ).replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </td>

                                            <td>

                                                <div className="invoice-actions">

                                                    <button
                                                        className="invoice-action view"
                                                        title="View"
                                                        onClick={() =>
                                                            handleView(
                                                                invoice
                                                            )
                                                        }
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    {[
                                                        "DRAFT",
                                                        "POSTED",
                                                    ].includes(
                                                        invoice.status
                                                    ) && (
                                                        <button
                                                            className="invoice-action edit"
                                                            title="Edit"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    invoice
                                                                )
                                                            }
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                    )}

                                                    {invoice.status ===
                                                        "DRAFT" && (
                                                        <button
                                                            className="invoice-action delete"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    invoice
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

                <div className="purchase-invoices-pagination">

                    <span>
                        Page {page} of{" "}
                        {totalPages}
                    </span>

                    <div>

                        <button
                            disabled={
                                page <= 1
                            }
                            onClick={() =>
                                setPage(
                                    (prev) =>
                                        prev - 1
                                )
                            }
                        >
                            <FiChevronLeft />
                        </button>

                        <button
                            disabled={
                                page >=
                                totalPages
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

            </div>

            {/* =====================================================
               CREATE / EDIT MODAL
            ===================================================== */}

            {showModal && (
                <div className="purchase-invoices-modal-overlay">

                    <div className="purchase-invoices-modal">

                        <div className="purchase-invoices-modal-header">

                            <div>
                                <h2>
                                    {editingInvoice
                                        ? "Edit Purchase Invoice"
                                        : "Create Purchase Invoice"}
                                </h2>

                                <p>
                                    {editingInvoice
                                        ? "Update invoice and payment details"
                                        : "Create a new supplier purchase invoice"}
                                </p>
                            </div>

                            <button
                                onClick={
                                    closeModal
                                }
                            >
                                <FiX />
                            </button>

                        </div>

                        <div className="purchase-invoices-modal-body">

                            {/* =========================================
                               BASIC DETAILS
                            ========================================= */}

                            <div className="invoice-form-section">

                                <div className="invoice-section-title">
                                    <FiFileText />

                                    <div>
                                        <h3>
                                            Invoice Details
                                        </h3>

                                        <span>
                                            Supplier and document information
                                        </span>
                                    </div>
                                </div>

                                <div className="invoice-form-grid">

                                    <div className="invoice-form-group">

                                        <label>
                                            Company *
                                        </label>

                                        <select
                                            name="company"
                                            value={
                                                formData.company
                                            }
                                            onChange={
                                                handleCompanyChange
                                            }
                                            disabled={
                                                !!editingInvoice
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

                                    <div className="invoice-form-group">

                                        <label>
                                            Branch *
                                        </label>

                                        <select
                                            name="branch"
                                            value={
                                                formData.branch
                                            }
                                            onChange={
                                                handleBranchChange
                                            }
                                            disabled={
                                                !!editingInvoice ||
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

                                    <div className="invoice-form-group">

                                        <label>
                                            Supplier *
                                        </label>

                                        <select
                                            name="supplier"
                                            value={
                                                formData.supplier
                                            }
                                            onChange={
                                                handleSupplierChange
                                            }
                                            disabled={
                                                !!editingInvoice ||
                                                !formData.branch
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
                                                        key={
                                                            supplier._id
                                                        }
                                                        value={
                                                            supplier._id
                                                        }
                                                    >
                                                        {
                                                            supplier.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                    <div className="invoice-form-group">

                                        <label>
                                            Supplier Invoice Number *
                                        </label>

                                        <input
                                            type="text"
                                            name="invoiceNumber"
                                            value={
                                                formData.invoiceNumber
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter supplier invoice number"
                                            disabled={
                                                !!editingInvoice
                                            }
                                        />

                                    </div>

                                    <div className="invoice-form-group">

                                        <label>
                                            Invoice Date *
                                        </label>

                                        <input
                                            type="date"
                                            name="invoiceDate"
                                            value={
                                                formData.invoiceDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    <div className="invoice-form-group">

                                        <label>
                                            Due Date
                                        </label>

                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={
                                                formData.dueDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    <div className="invoice-form-group">

                                        <label>
                                            Payment Terms (Days)
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="paymentTerms"
                                            value={
                                                formData.paymentTerms
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    <div className="invoice-form-group">

                                        <label>
                                            Currency
                                        </label>

                                        <input
                                            type="text"
                                            name="currency"
                                            value={
                                                formData.currency
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            maxLength="10"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* =========================================
                               REFERENCES
                            ========================================= */}

                            {!editingInvoice && (
                                <div className="invoice-form-section">

                                    <div className="invoice-section-title">
                                        <FiPackage />

                                        <div>
                                            <h3>
                                                Purchase References
                                            </h3>

                                            <span>
                                                Optional PO and GRN references
                                            </span>
                                        </div>
                                    </div>

                                    <div className="invoice-form-grid">

                                        <div className="invoice-form-group">

                                            <label>
                                                Purchase Order
                                            </label>

                                            <select
                                                value={
                                                    formData.purchaseOrder
                                                }
                                                onChange={
                                                    handlePurchaseOrderChange
                                                }
                                                disabled={
                                                    !formData.supplier
                                                }
                                            >
                                                <option value="">
                                                    No Purchase Order
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
                                                            {po.status}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                        </div>

                                        <div className="invoice-form-group">

                                            <label>
                                                Goods Receipt
                                            </label>

                                            <select
                                                value={
                                                    formData.goodsReceipt
                                                }
                                                onChange={
                                                    handleGoodsReceiptChange
                                                }
                                                disabled={
                                                    !formData.supplier
                                                }
                                            >
                                                <option value="">
                                                    No Goods Receipt
                                                </option>

                                                {goodsReceipts.map(
                                                    (
                                                        grn
                                                    ) => (
                                                        <option
                                                            key={
                                                                grn._id
                                                            }
                                                            value={
                                                                grn._id
                                                            }
                                                        >
                                                            {
                                                                grn.grnNumber
                                                            }{" "}
                                                            -{" "}
                                                            {grn.status}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* =========================================
                               ITEMS
                            ========================================= */}

                            <div className="invoice-form-section">

                                <div className="invoice-section-title invoice-items-heading">

                                    <div className="invoice-section-title-left">
                                        <FiPackage />

                                        <div>
                                            <h3>
                                                Invoice Items
                                            </h3>

                                            <span>
                                                Products and pricing
                                            </span>
                                        </div>
                                    </div>

                                    {!editingInvoice && (
                                        <button
                                            className="invoice-add-item-btn"
                                            onClick={
                                                addItem
                                            }
                                        >
                                            <FiPlus />

                                            Add Item
                                        </button>
                                    )}

                                </div>

                                <div className="invoice-items-wrapper">

                                    <table className="invoice-items-table">

                                        <thead>
                                            <tr>
                                                <th>
                                                    Product
                                                </th>

                                                <th>
                                                    Qty
                                                </th>

                                                <th>
                                                    Unit Price
                                                </th>

                                                <th>
                                                    Discount %
                                                </th>

                                                <th>
                                                    Tax %
                                                </th>

                                                <th>
                                                    Cess %
                                                </th>

                                                <th>
                                                    Line Total
                                                </th>

                                                {!editingInvoice && (
                                                    <th>
                                                        Action
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {invoiceItems.map(
                                                (
                                                    item,
                                                    index
                                                ) => {
                                                    const calculated =
                                                        calculateItem(
                                                            item
                                                        );

                                                    return (
                                                        <tr
                                                            key={
                                                                index
                                                            }
                                                        >

                                                            <td>

                                                                <select
                                                                    value={
                                                                        item.product
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleItemProductChange(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !!editingInvoice
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Select Product
                                                                    </option>

                                                                    {products.map(
                                                                        (
                                                                            product
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    product._id
                                                                                }
                                                                                value={
                                                                                    product._id
                                                                                }
                                                                            >
                                                                                {
                                                                                    product.name
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    product.sku
                                                                                }
                                                                                )
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>

                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    value={
                                                                        item.quantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "quantity",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !!editingInvoice
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={
                                                                        item.unitPrice
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "unitPrice",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !!editingInvoice
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    value={
                                                                        item.discountPercentage
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "discountPercentage",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !!editingInvoice
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    value={
                                                                        item.taxPercentage
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "taxPercentage",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !!editingInvoice
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    value={
                                                                        item.cessPercentage
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "cessPercentage",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !!editingInvoice
                                                                    }
                                                                />

                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {formatCurrency(
                                                                        calculated.lineTotal
                                                                    )}
                                                                </strong>
                                                            </td>

                                                            {!editingInvoice && (
                                                                <td>

                                                                    <button
                                                                        className="invoice-remove-item-btn"
                                                                        onClick={() =>
                                                                            removeItem(
                                                                                index
                                                                            )
                                                                        }
                                                                        title="Remove item"
                                                                    >
                                                                        <FiTrash2 />
                                                                    </button>

                                                                </td>
                                                            )}

                                                        </tr>
                                                    );
                                                }
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                            {/* =========================================
                               TOTALS + PAYMENT
                            ========================================= */}

                            <div className="invoice-bottom-grid">

                                <div className="invoice-form-section">

                                    <div className="invoice-section-title">
                                        <FiDollarSign />

                                        <div>
                                            <h3>
                                                Charges & Payment
                                            </h3>

                                            <span>
                                                Invoice payment information
                                            </span>
                                        </div>
                                    </div>

                                    <div className="invoice-form-grid">

                                        <div className="invoice-form-group">

                                            <label>
                                                Shipping Amount
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="shippingAmount"
                                                value={
                                                    formData.shippingAmount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>

                                        <div className="invoice-form-group">

                                            <label>
                                                Other Charges
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="otherCharges"
                                                value={
                                                    formData.otherCharges
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>

                                        <div className="invoice-form-group">

                                            <label>
                                                Round Off
                                            </label>

                                            <input
                                                type="number"
                                                step="0.01"
                                                name="roundOffAmount"
                                                value={
                                                    formData.roundOffAmount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>

                                        <div className="invoice-form-group">

                                            <label>
                                                Paid Amount
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="paidAmount"
                                                value={
                                                    formData.paidAmount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>

                                <div className="invoice-total-card">

                                    <div className="invoice-total-row">
                                        <span>
                                            Subtotal
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.subtotal
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row">
                                        <span>
                                            Discount
                                        </span>

                                        <strong>
                                            -{" "}
                                            {formatCurrency(
                                                totals.discountAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row">
                                        <span>
                                            Tax
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.taxAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row">
                                        <span>
                                            Shipping
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.shippingAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row">
                                        <span>
                                            Other Charges
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.otherCharges
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row">
                                        <span>
                                            Round Off
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.roundOffAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-divider" />

                                    <div className="invoice-total-row grand-total">
                                        <span>
                                            Total Amount
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.totalAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row">
                                        <span>
                                            Paid
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.paidAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-total-row due-row">
                                        <span>
                                            Due
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                totals.dueAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div className="invoice-payment-status">

                                        <span>
                                            Payment Status
                                        </span>

                                        <strong>
                                            {totals.paymentStatus.replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {/* =========================================
                               NOTES
                            ========================================= */}

                            <div className="invoice-form-section">

                                <div className="invoice-section-title">
                                    <FiFileText />

                                    <div>
                                        <h3>
                                            Additional Information
                                        </h3>

                                        <span>
                                            Notes and terms
                                        </span>
                                    </div>
                                </div>

                                <div className="invoice-textarea-grid">

                                    <div className="invoice-form-group">

                                        <label>
                                            Notes
                                        </label>

                                        <textarea
                                            name="notes"
                                            rows="4"
                                            value={
                                                formData.notes
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter invoice notes..."
                                        />

                                    </div>

                                    <div className="invoice-form-group">

                                        <label>
                                            Terms & Conditions
                                        </label>

                                        <textarea
                                            name="termsAndConditions"
                                            rows="4"
                                            value={
                                                formData.termsAndConditions
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter terms and conditions..."
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* =============================================
                           MODAL FOOTER
                        ============================================= */}

                        <div className="purchase-invoices-modal-footer">

                            <button
                                className="invoice-cancel-btn"
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
                                className="invoice-save-btn"
                                onClick={
                                    handleSubmit
                                }
                                disabled={
                                    saving
                                }
                            >
                                {saving
                                    ? "Saving..."
                                    : editingInvoice
                                    ? "Update Invoice"
                                    : "Create Invoice"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* =====================================================
               VIEW MODAL
            ===================================================== */}

            {showViewModal &&
                selectedInvoice && (
                    <div className="purchase-invoices-modal-overlay">

                        <div className="purchase-invoices-modal view-modal">

                            <div className="purchase-invoices-modal-header">

                                <div>
                                    <h2>
                                        Purchase Invoice
                                    </h2>

                                    <p>
                                        {
                                            selectedInvoice
                                                .invoice
                                                ?.internalInvoiceNumber
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

                            <div className="purchase-invoices-view-body">

                                {/* =====================================
                                   HEADER
                                ===================================== */}

                                <div className="invoice-view-header-card">

                                    <div>
                                        <span>
                                            Supplier Invoice
                                        </span>

                                        <strong>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.invoiceNumber
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Internal Number
                                        </span>

                                        <strong>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.internalInvoiceNumber
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Invoice Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedInvoice
                                                    .invoice
                                                    ?.invoiceDate
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong
                                            className={`invoice-status-badge status-${getStatusClass(
                                                selectedInvoice
                                                    .invoice
                                                    ?.status
                                            )}`}
                                        >
                                            {String(
                                                selectedInvoice
                                                    .invoice
                                                    ?.status ||
                                                    "-"
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                {/* =====================================
                                   SUPPLIER / REFERENCE
                                ===================================== */}

                                <div className="invoice-view-info-grid">

                                    <div className="invoice-view-info-card">

                                        <h3>
                                            Supplier
                                        </h3>

                                        <p>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.supplier
                                                    ?.name
                                            }
                                        </p>

                                        <small>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.supplier
                                                    ?.supplierCode
                                            }
                                        </small>

                                        <small>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.supplier
                                                    ?.phone
                                            }
                                        </small>

                                    </div>

                                    <div className="invoice-view-info-card">

                                        <h3>
                                            Purchase Order
                                        </h3>

                                        <p>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.purchaseOrder
                                                    ?.poNumber ||
                                                    "-"
                                            }
                                        </p>

                                        <small>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.purchaseOrder
                                                    ?.status ||
                                                    ""
                                            }
                                        </small>

                                    </div>

                                    <div className="invoice-view-info-card">

                                        <h3>
                                            Goods Receipt
                                        </h3>

                                        <p>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.goodsReceipt
                                                    ?.grnNumber ||
                                                    "-"
                                            }
                                        </p>

                                        <small>
                                            {
                                                selectedInvoice
                                                    .invoice
                                                    ?.goodsReceipt
                                                    ?.status ||
                                                    ""
                                            }
                                        </small>

                                    </div>

                                </div>

                                {/* =====================================
                                   ITEMS
                                ===================================== */}

                                <div className="invoice-view-section">

                                    <h3>
                                        Invoice Items
                                    </h3>

                                    <div className="invoice-items-wrapper">

                                        <table className="invoice-items-table view-items">

                                            <thead>
                                                <tr>
                                                    <th>
                                                        Product
                                                    </th>

                                                    <th>
                                                        Qty
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
                                                        Cess
                                                    </th>

                                                    <th>
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                {(
                                                    selectedInvoice.items ||
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
                                                                    {item
                                                                        .product
                                                                        ?.name ||
                                                                        "-"}
                                                                </strong>

                                                                <small>
                                                                    {item
                                                                        .product
                                                                        ?.sku ||
                                                                        ""}
                                                                </small>
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.quantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {formatCurrency(
                                                                    item.unitPrice
                                                                )}
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.discountPercentage
                                                                }
                                                                %
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.taxPercentage
                                                                }
                                                                %
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.cessPercentage
                                                                }
                                                                %
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {formatCurrency(
                                                                        item.lineTotal
                                                                    )}
                                                                </strong>
                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                                {/* =====================================
                                   TOTALS
                                ===================================== */}

                                <div className="invoice-view-total-wrapper">

                                    <div className="invoice-view-total-card">

                                        <div>
                                            <span>
                                                Subtotal
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.subtotal
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Discount
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.discountAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Tax
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.taxAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Shipping
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.shippingAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Other Charges
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.otherCharges
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Round Off
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.roundOffAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div className="view-grand-total">
                                            <span>
                                                Total
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
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
                                                    selectedInvoice
                                                        .invoice
                                                        ?.paidAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div className="view-due-total">
                                            <span>
                                                Due
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    selectedInvoice
                                                        .invoice
                                                        ?.dueAmount
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* =====================================
                                   NOTES
                                ===================================== */}

                                {(selectedInvoice
                                    .invoice
                                    ?.notes ||
                                    selectedInvoice
                                        .invoice
                                        ?.termsAndConditions) && (
                                    <div className="invoice-view-notes">

                                        {selectedInvoice
                                            .invoice
                                            ?.notes && (
                                            <div>
                                                <h3>
                                                    Notes
                                                </h3>

                                                <p>
                                                    {
                                                        selectedInvoice
                                                            .invoice
                                                            .notes
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {selectedInvoice
                                            .invoice
                                            ?.termsAndConditions && (
                                            <div>
                                                <h3>
                                                    Terms & Conditions
                                                </h3>

                                                <p>
                                                    {
                                                        selectedInvoice
                                                            .invoice
                                                            .termsAndConditions
                                                    }
                                                </p>
                                            </div>
                                        )}

                                    </div>
                                )}

                            </div>

                            <div className="purchase-invoices-modal-footer">

                                <button
                                    className="invoice-cancel-btn"
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
};

export default PurchaseInvoices;