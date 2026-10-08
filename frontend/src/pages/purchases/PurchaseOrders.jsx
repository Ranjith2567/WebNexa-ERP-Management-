import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiCheckCircle,
    FiShoppingBag,
    FiCalendar,
    FiX,
    FiPackage,
    FiTruck,
    FiHome,
    FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/purchaseOrders.css";

const STATUS_OPTIONS = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "SENT",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
];

const emptyItem = {
    product: "",
    quantity: 1,
    unitPrice: 0,
    discountPercentage: 0,
    taxPercentage: 0,
    notes: "",
};

const initialForm = {
    company: "",
    branch: "",
    supplier: "",
    warehouse: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    paymentTerms: 0,
    currency: "INR",
    shippingAmount: 0,
    otherCharges: 0,
    notes: "",
    termsAndConditions: "",
    status: "DRAFT",
    items: [{ ...emptyItem }],
};

const PurchaseOrders = () => {
    // =========================================================
    // LIST STATE
    // =========================================================

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // =========================================================
    // MASTER DATA
    // =========================================================

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    // =========================================================
    // MODALS
    // =========================================================

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingPO, setEditingPO] = useState(null);
    const [selectedPO, setSelectedPO] = useState(null);

    const [formData, setFormData] = useState(initialForm);

    // =========================================================
    // HELPERS
    // =========================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const showSuccess = (message) => {
        setError("");
        setSuccess(message);

        setTimeout(() => {
            setSuccess("");
        }, 3000);
    };

    const showError = (message) => {
        setSuccess("");
        setError(message);

        setTimeout(() => {
            setError("");
        }, 5000);
    };

    const formatCurrency = (amount, currency = "INR") => {
        const value = Number(amount || 0);

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "DRAFT":
                return "po-status po-status-draft";

            case "PENDING_APPROVAL":
                return "po-status po-status-pending";

            case "APPROVED":
                return "po-status po-status-approved";

            case "REJECTED":
                return "po-status po-status-rejected";

            case "SENT":
                return "po-status po-status-sent";

            case "PARTIALLY_RECEIVED":
                return "po-status po-status-partial";

            case "RECEIVED":
                return "po-status po-status-received";

            case "CANCELLED":
                return "po-status po-status-cancelled";

            default:
                return "po-status";
        }
    };

    const formatStatus = (status) => {
        if (!status) return "-";

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    // =========================================================
    // LOAD COMPANIES
    // =========================================================

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
            console.error(
                "Failed to load companies:",
                err
            );
        }
    };

    // =========================================================
    // LOAD BRANCHES
    // =========================================================

    const loadBranches = async (companyId) => {
        if (!companyId) {
            setBranches([]);
            return;
        }

        try {
            const response = await api.get(
                `/branches?company=${companyId}&page=1&limit=100`
            );

            setBranches(
                response.data.branches ||
                    response.data.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to load branches:",
                err
            );

            setBranches([]);
        }
    };

    // =========================================================
    // LOAD SUPPLIERS
    // =========================================================

    const loadSuppliers = async (companyId, branchId = "") => {
        if (!companyId) {
            setSuppliers([]);
            return;
        }

        try {
            let url =
                `/suppliers?company=${companyId}&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response = await api.get(url);

            setSuppliers(
                response.data.data ||
                    response.data.suppliers ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to load suppliers:",
                err
            );

            setSuppliers([]);
        }
    };

    // =========================================================
    // LOAD WAREHOUSES
    // =========================================================

    const loadWarehouses = async (
        companyId,
        branchId = ""
    ) => {
        if (!companyId) {
            setWarehouses([]);
            return;
        }

        try {
            let url =
                `/warehouses?company=${companyId}&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response = await api.get(url);

            setWarehouses(
                response.data.warehouses ||
                    response.data.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to load warehouses:",
                err
            );

            setWarehouses([]);
        }
    };

    // =========================================================
    // LOAD PRODUCTS
    // =========================================================

    const loadProducts = async (
        companyId,
        branchId = ""
    ) => {
        if (!companyId) {
            setProducts([]);
            return;
        }

        try {
            let url =
                `/products?company=${companyId}&page=1&limit=100`;

            if (branchId) {
                url += `&branch=${branchId}`;
            }

            const response = await api.get(url);

            setProducts(
                response.data.products ||
                    response.data.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Failed to load products:",
                err
            );

            setProducts([]);
        }
    };

    // =========================================================
    // LOAD LIST
    // =========================================================

    const loadPurchaseOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

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

            if (supplierFilter) {
                params.append(
                    "supplier",
                    supplierFilter
                );
            }

            if (warehouseFilter) {
                params.append(
                    "warehouse",
                    warehouseFilter
                );
            }

            if (statusFilter) {
                params.append(
                    "status",
                    statusFilter
                );
            }

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
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

            params.append("page", page);
            params.append("limit", limit);

            const response = await api.get(
                `/purchase-orders?${params.toString()}`
            );

            setPurchaseOrders(
                response.data.data || []
            );

            setTotalPages(
                response.data.pagination
                    ?.totalPages || 1
            );
        } catch (err) {
            console.error(
                "Failed to load purchase orders:",
                err
            );

            showError(
                err.response?.data?.message ||
                    "Failed to load purchase orders"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        loadPurchaseOrders();
    }, [
        page,
        companyFilter,
        branchFilter,
        supplierFilter,
        warehouseFilter,
        statusFilter,
        startDate,
        endDate,
    ]);

    // =========================================================
    // COMPANY FILTER CHANGE
    // =========================================================

    const handleCompanyFilterChange = async (value) => {
        setCompanyFilter(value);
        setBranchFilter("");
        setSupplierFilter("");
        setWarehouseFilter("");
        setPage(1);

        if (value) {
            await loadBranches(value);
            await loadSuppliers(value);
            await loadWarehouses(value);
        } else {
            setBranches([]);
            setSuppliers([]);
            setWarehouses([]);
        }
    };

    // =========================================================
    // BRANCH FILTER CHANGE
    // =========================================================

    const handleBranchFilterChange = async (value) => {
        setBranchFilter(value);
        setSupplierFilter("");
        setWarehouseFilter("");
        setPage(1);

        if (companyFilter && value) {
            await loadSuppliers(
                companyFilter,
                value
            );

            await loadWarehouses(
                companyFilter,
                value
            );
        } else if (companyFilter) {
            await loadSuppliers(
                companyFilter
            );

            await loadWarehouses(
                companyFilter
            );
        }
    };

    // =========================================================
    // SEARCH
    // =========================================================

    const handleSearch = (value) => {
        setSearch(value);
        setPage(1);
    };

    // =========================================================
    // OPEN CREATE
    // =========================================================

    const openCreateModal = async () => {
        clearMessages();

        setEditingPO(null);

        const defaultCompany =
            companies.length === 1
                ? companies[0]._id
                : "";

        const newForm = {
            ...initialForm,
            company: defaultCompany,
        };

        setFormData(newForm);

        if (defaultCompany) {
            await loadBranches(
                defaultCompany
            );

            await loadSuppliers(
                defaultCompany
            );

            await loadWarehouses(
                defaultCompany
            );

            await loadProducts(
                defaultCompany
            );
        } else {
            setBranches([]);
            setSuppliers([]);
            setWarehouses([]);
            setProducts([]);
        }

        setShowModal(true);
    };

    // =========================================================
    // FORM COMPANY CHANGE
    // =========================================================

    const handleFormCompanyChange = async (value) => {
        setFormData((prev) => ({
            ...prev,
            company: value,
            branch: "",
            supplier: "",
            warehouse: "",
            items: prev.items.map((item) => ({
                ...item,
                product: "",
            })),
        }));

        setBranches([]);
        setSuppliers([]);
        setWarehouses([]);
        setProducts([]);

        if (value) {
            await loadBranches(value);
            await loadSuppliers(value);
            await loadWarehouses(value);
            await loadProducts(value);
        }
    };

    // =========================================================
    // FORM BRANCH CHANGE
    // =========================================================

    const handleFormBranchChange = async (value) => {
        setFormData((prev) => ({
            ...prev,
            branch: value,
            supplier: "",
            warehouse: "",
            items: prev.items.map((item) => ({
                ...item,
                product: "",
            })),
        }));

        setSuppliers([]);
        setWarehouses([]);
        setProducts([]);

        if (
            formData.company &&
            value
        ) {
            await loadSuppliers(
                formData.company,
                value
            );

            await loadWarehouses(
                formData.company,
                value
            );

            await loadProducts(
                formData.company,
                value
            );
        }
    };

    // =========================================================
    // OPEN EDIT
    // =========================================================

    const openEditModal = async (po) => {
        clearMessages();

        try {
            setSaving(true);

            const response = await api.get(
                `/purchase-orders/${po._id}`
            );

            const data =
                response.data.data;

            const purchaseOrder =
                data.purchaseOrder;

            const items =
                data.items || [];

            setEditingPO(
                purchaseOrder
            );

            setFormData({
                company:
                    purchaseOrder.company?._id ||
                    purchaseOrder.company ||
                    "",

                branch:
                    purchaseOrder.branch?._id ||
                    purchaseOrder.branch ||
                    "",

                supplier:
                    purchaseOrder.supplier?._id ||
                    purchaseOrder.supplier ||
                    "",

                warehouse:
                    purchaseOrder.warehouse?._id ||
                    purchaseOrder.warehouse ||
                    "",

                orderDate:
                    purchaseOrder.orderDate
                        ? new Date(
                              purchaseOrder.orderDate
                          )
                              .toISOString()
                              .split("T")[0]
                        : "",

                expectedDeliveryDate:
                    purchaseOrder.expectedDeliveryDate
                        ? new Date(
                              purchaseOrder.expectedDeliveryDate
                          )
                              .toISOString()
                              .split("T")[0]
                        : "",

                paymentTerms:
                    purchaseOrder.paymentTerms ??
                    0,

                currency:
                    purchaseOrder.currency ||
                    "INR",

                shippingAmount:
                    purchaseOrder.shippingAmount ??
                    0,

                otherCharges:
                    purchaseOrder.otherCharges ??
                    0,

                notes:
                    purchaseOrder.notes ||
                    "",

                termsAndConditions:
                    purchaseOrder.termsAndConditions ||
                    "",

                status:
                    purchaseOrder.status ||
                    "DRAFT",

                items:
                    items.length > 0
                        ? items.map((item) => ({
                              product:
                                  item.product?._id ||
                                  item.product ||
                                  "",

                              quantity:
                                  item.quantity ??
                                  1,

                              unitPrice:
                                  item.unitPrice ??
                                  0,

                              discountPercentage:
                                  item.discountPercentage ??
                                  0,

                              taxPercentage:
                                  item.taxPercentage ??
                                  0,

                              notes:
                                  item.notes ||
                                  "",
                          }))
                        : [{ ...emptyItem }],
            });

            await loadBranches(
                purchaseOrder.company?._id ||
                    purchaseOrder.company
            );

            await loadSuppliers(
                purchaseOrder.company?._id ||
                    purchaseOrder.company,
                purchaseOrder.branch?._id ||
                    purchaseOrder.branch
            );

            await loadWarehouses(
                purchaseOrder.company?._id ||
                    purchaseOrder.company,
                purchaseOrder.branch?._id ||
                    purchaseOrder.branch
            );

            await loadProducts(
                purchaseOrder.company?._id ||
                    purchaseOrder.company,
                purchaseOrder.branch?._id ||
                    purchaseOrder.branch
            );

            setShowModal(true);
        } catch (err) {
            console.error(
                "Failed to load purchase order:",
                err
            );

            showError(
                err.response?.data?.message ||
                    "Failed to load purchase order"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // VIEW PO
    // =========================================================

    const openViewModal = async (po) => {
        clearMessages();

        try {
            setSaving(true);

            const response = await api.get(
                `/purchase-orders/${po._id}`
            );

            setSelectedPO(
                response.data.data
            );

            setShowViewModal(true);
        } catch (err) {
            console.error(
                "Failed to load purchase order:",
                err
            );

            showError(
                err.response?.data?.message ||
                    "Failed to load purchase order"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleInputChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================================================
    // ITEM CHANGE
    // =========================================================

    const handleItemChange = (
        index,
        field,
        value
    ) => {
        setFormData((prev) => {
            const updatedItems = [
                ...prev.items,
            ];

            updatedItems[index] = {
                ...updatedItems[index],
                [field]: value,
            };

            return {
                ...prev,
                items: updatedItems,
            };
        });
    };

    // =========================================================
    // ADD ITEM
    // =========================================================

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { ...emptyItem },
            ],
        }));
    };

    // =========================================================
    // REMOVE ITEM
    // =========================================================

    const removeItem = (index) => {
        if (formData.items.length === 1) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            ),
        }));
    };

    // =========================================================
    // CALCULATE PREVIEW
    // =========================================================

    const calculations = useMemo(() => {
        let subtotal = 0;
        let discount = 0;
        let tax = 0;

        formData.items.forEach((item) => {
            const quantity =
                Number(item.quantity) || 0;

            const unitPrice =
                Number(item.unitPrice) || 0;

            const discountPercentage =
                Number(
                    item.discountPercentage
                ) || 0;

            const taxPercentage =
                Number(
                    item.taxPercentage
                ) || 0;

            const gross =
                quantity * unitPrice;

            const discountAmount =
                gross *
                (discountPercentage / 100);

            const taxable =
                gross -
                discountAmount;

            const taxAmount =
                taxable *
                (taxPercentage / 100);

            subtotal += gross;
            discount += discountAmount;
            tax += taxAmount;
        });

        const shipping =
            Number(
                formData.shippingAmount
            ) || 0;

        const otherCharges =
            Number(
                formData.otherCharges
            ) || 0;

        const total =
            subtotal -
            discount +
            tax +
            shipping +
            otherCharges;

        return {
            subtotal,
            discount,
            tax,
            shipping,
            otherCharges,
            total,
        };
    }, [
        formData.items,
        formData.shippingAmount,
        formData.otherCharges,
    ]);

    // =========================================================
    // VALIDATE FORM
    // =========================================================

    const validateForm = () => {
        if (!formData.company) {
            showError(
                "Please select a company"
            );
            return false;
        }

        if (!formData.branch) {
            showError(
                "Please select a branch"
            );
            return false;
        }

        if (!formData.supplier) {
            showError(
                "Please select a supplier"
            );
            return false;
        }

        if (!formData.warehouse) {
            showError(
                "Please select a warehouse"
            );
            return false;
        }

        if (!formData.orderDate) {
            showError(
                "Order date is required"
            );
            return false;
        }

        if (
            !formData.items ||
            formData.items.length === 0
        ) {
            showError(
                "At least one product is required"
            );
            return false;
        }

        for (
            let index = 0;
            index < formData.items.length;
            index++
        ) {
            const item =
                formData.items[index];

            if (!item.product) {
                showError(
                    `Please select product for item ${
                        index + 1
                    }`
                );
                return false;
            }

            if (
                Number(item.quantity) <= 0
            ) {
                showError(
                    `Quantity must be greater than 0 for item ${
                        index + 1
                    }`
                );
                return false;
            }

            if (
                Number(item.unitPrice) < 0
            ) {
                showError(
                    `Invalid unit price for item ${
                        index + 1
                    }`
                );
                return false;
            }

            if (
                Number(
                    item.discountPercentage
                ) < 0 ||
                Number(
                    item.discountPercentage
                ) > 100
            ) {
                showError(
                    `Discount must be between 0 and 100 for item ${
                        index + 1
                    }`
                );
                return false;
            }

            if (
                Number(
                    item.taxPercentage
                ) < 0 ||
                Number(
                    item.taxPercentage
                ) > 100
            ) {
                showError(
                    `Tax must be between 0 and 100 for item ${
                        index + 1
                    }`
                );
                return false;
            }
        }

        return true;
    };

    // =========================================================
    // SAVE PO
    // =========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        clearMessages();

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            const payload = {
                company: formData.company,
                branch: formData.branch,
                supplier: formData.supplier,
                warehouse: formData.warehouse,

                orderDate:
                    formData.orderDate,

                expectedDeliveryDate:
                    formData.expectedDeliveryDate ||
                    null,

                paymentTerms:
                    Number(
                        formData.paymentTerms
                    ) || 0,

                currency:
                    formData.currency ||
                    "INR",

                shippingAmount:
                    Number(
                        formData.shippingAmount
                    ) || 0,

                otherCharges:
                    Number(
                        formData.otherCharges
                    ) || 0,

                notes:
                    formData.notes || "",

                termsAndConditions:
                    formData.termsAndConditions ||
                    "",

                status:
                    formData.status ||
                    "DRAFT",

                items:
                    formData.items.map(
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

                            notes:
                                item.notes ||
                                "",
                        })
                    ),
            };

            let response;

            if (editingPO) {
                response = await api.put(
                    `/purchase-orders/${editingPO._id}`,
                    payload
                );
            } else {
                response = await api.post(
                    "/purchase-orders",
                    payload
                );
            }

            showSuccess(
                response.data.message ||
                    "Purchase order saved successfully"
            );

            setShowModal(false);
            setEditingPO(null);
            setFormData(initialForm);

            await loadPurchaseOrders();
        } catch (err) {
            console.error(
                "Failed to save purchase order:",
                err
            );

            showError(
                err.response?.data?.message ||
                    "Failed to save purchase order"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // APPROVE
    // =========================================================

    const handleApprove = async (po) => {
        const confirmed =
            window.confirm(
                `Approve purchase order ${po.poNumber}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            const response =
                await api.patch(
                    `/purchase-orders/${po._id}/approve`
                );

            showSuccess(
                response.data.message ||
                    "Purchase order approved successfully"
            );

            await loadPurchaseOrders();

            if (
                selectedPO?.purchaseOrder?._id ===
                po._id
            ) {
                setShowViewModal(false);
            }
        } catch (err) {
            console.error(
                "Failed to approve purchase order:",
                err
            );

            showError(
                err.response?.data?.message ||
                    "Failed to approve purchase order"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (po) => {
        const confirmed =
            window.confirm(
                `Delete purchase order ${po.poNumber}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            const response =
                await api.delete(
                    `/purchase-orders/${po._id}`
                );

            showSuccess(
                response.data.message ||
                    "Purchase order deleted successfully"
            );

            if (
                purchaseOrders.length === 1 &&
                page > 1
            ) {
                setPage(
                    (prev) => prev - 1
                );
            } else {
                await loadPurchaseOrders();
            }
        } catch (err) {
            console.error(
                "Failed to delete purchase order:",
                err
            );

            showError(
                err.response?.data?.message ||
                    "Failed to delete purchase order"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // RESET FILTERS
    // =========================================================

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("");
        setCompanyFilter("");
        setBranchFilter("");
        setSupplierFilter("");
        setWarehouseFilter("");
        setStartDate("");
        setEndDate("");
        setPage(1);

        setBranches([]);
        setSuppliers([]);
        setWarehouses([]);
    };

    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {
        const total =
            purchaseOrders.length;

        const draft =
            purchaseOrders.filter(
                (po) =>
                    po.status === "DRAFT"
            ).length;

        const pending =
            purchaseOrders.filter(
                (po) =>
                    po.status ===
                    "PENDING_APPROVAL"
            ).length;

        const approved =
            purchaseOrders.filter(
                (po) =>
                    po.status === "APPROVED"
            ).length;

        const amount =
            purchaseOrders.reduce(
                (sum, po) =>
                    sum +
                    Number(
                        po.totalAmount || 0
                    ),
                0
            );

        return {
            total,
            draft,
            pending,
            approved,
            amount,
        };
    }, [purchaseOrders]);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="purchase-orders-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="purchase-orders-header">
                <div>
                    <div className="purchase-orders-title-row">
                        <div className="purchase-orders-title-icon">
                            <FiShoppingBag />
                        </div>

                        <div>
                            <h1>
                                Purchase Orders
                            </h1>

                            <p>
                                Create and manage purchase
                                orders
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="po-primary-btn"
                    onClick={openCreateModal}
                    disabled={saving}
                >
                    <FiPlus />
                    Create Purchase Order
                </button>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {success && (
                <div className="po-alert po-alert-success">
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

            {error && (
                <div className="po-alert po-alert-error">
                    <FiX />
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

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="po-summary-grid">

                <div className="po-summary-card">
                    <div className="po-summary-icon">
                        <FiShoppingBag />
                    </div>

                    <div>
                        <span>Total Orders</span>
                        <strong>
                            {summary.total}
                        </strong>
                    </div>
                </div>

                <div className="po-summary-card">
                    <div className="po-summary-icon po-summary-draft">
                        <FiEdit2 />
                    </div>

                    <div>
                        <span>Draft</span>
                        <strong>
                            {summary.draft}
                        </strong>
                    </div>
                </div>

                <div className="po-summary-card">
                    <div className="po-summary-icon po-summary-pending">
                        <FiCalendar />
                    </div>

                    <div>
                        <span>Pending Approval</span>
                        <strong>
                            {summary.pending}
                        </strong>
                    </div>
                </div>

                <div className="po-summary-card">
                    <div className="po-summary-icon po-summary-approved">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>Approved</span>
                        <strong>
                            {summary.approved}
                        </strong>
                    </div>
                </div>

                <div className="po-summary-card">
                    <div className="po-summary-icon po-summary-amount">
                        ₹
                    </div>

                    <div>
                        <span>Page Total</span>
                        <strong>
                            {formatCurrency(
                                summary.amount
                            )}
                        </strong>
                    </div>
                </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="po-filter-card">

                <div className="po-filter-row">

                    <div className="po-search-box">
                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search PO number..."
                            value={search}
                            onChange={(event) =>
                                handleSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

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
                                    {company.name ||
                                        company.legalName}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={branchFilter}
                        onChange={(event) =>
                            handleBranchFilterChange(
                                event.target.value
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
                        value={supplierFilter}
                        onChange={(event) => {
                            setSupplierFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !companyFilter
                        }
                    >
                        <option value="">
                            All Suppliers
                        </option>

                        {suppliers.map(
                            (supplier) => (
                                <option
                                    key={
                                        supplier._id
                                    }
                                    value={
                                        supplier._id
                                    }
                                >
                                    {supplier.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={warehouseFilter}
                        onChange={(event) => {
                            setWarehouseFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                        disabled={
                            !companyFilter
                        }
                    >
                        <option value="">
                            All Warehouses
                        </option>

                        {warehouses.map(
                            (warehouse) => (
                                <option
                                    key={
                                        warehouse._id
                                    }
                                    value={
                                        warehouse._id
                                    }
                                >
                                    {warehouse.name}
                                </option>
                            )
                        )}
                    </select>

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

                        {STATUS_OPTIONS.map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {formatStatus(
                                        status
                                    )}
                                </option>
                            )
                        )}
                    </select>

                </div>

                <div className="po-filter-row po-date-row">

                    <div className="po-date-field">
                        <label>
                            From Date
                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => {
                                setStartDate(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        />
                    </div>

                    <div className="po-date-field">
                        <label>
                            To Date
                        </label>

                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => {
                                setEndDate(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        />
                    </div>

                    <button
                        className="po-refresh-btn"
                        onClick={() =>
                            loadPurchaseOrders()
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw />
                    </button>

                    <button
                        className="po-reset-btn"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>

                </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="po-table-card">

                <div className="po-table-header">
                    <div>
                        <h2>
                            Purchase Orders
                        </h2>

                        <span>
                            Manage your purchase
                            orders
                        </span>
                    </div>

                    <span className="po-record-count">
                        {purchaseOrders.length} records
                    </span>
                </div>

                {loading ? (
                    <div className="po-loading">
                        <div className="po-spinner"></div>
                        <p>
                            Loading purchase orders...
                        </p>
                    </div>
                ) : purchaseOrders.length ===
                  0 ? (
                    <div className="po-empty">
                        <FiShoppingBag />

                        <h3>
                            No purchase orders found
                        </h3>

                        <p>
                            Create your first
                            purchase order to get
                            started.
                        </p>

                        <button
                            className="po-primary-btn"
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />
                            Create Purchase Order
                        </button>
                    </div>
                ) : (
                    <div className="po-table-wrapper">
                        <table className="po-table">

                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Warehouse</th>
                                    <th>Order Date</th>
                                    <th>Delivery</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {purchaseOrders.map(
                                    (po) => (
                                        <tr
                                            key={
                                                po._id
                                            }
                                        >
                                            <td>
                                                <div className="po-number-cell">
                                                    <strong>
                                                        {
                                                            po.poNumber
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            po.currency
                                                        }
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="po-name-cell">
                                                    <strong>
                                                        {po
                                                            .supplier
                                                            ?.name ||
                                                            "-"}
                                                    </strong>

                                                    <small>
                                                        {po
                                                            .supplier
                                                            ?.supplierCode ||
                                                            ""}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="po-name-cell">
                                                    <strong>
                                                        {po
                                                            .warehouse
                                                            ?.name ||
                                                            "-"}
                                                    </strong>

                                                    <small>
                                                        {po
                                                            .branch
                                                            ?.name ||
                                                            ""}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        po.orderDate
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        po.expectedDeliveryDate
                                                    )
                                                }
                                            </td>

                                            <td>
                                                <strong className="po-total">
                                                    {formatCurrency(
                                                        po.totalAmount,
                                                        po.currency
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={getStatusClass(
                                                        po.status
                                                    )}
                                                >
                                                    {formatStatus(
                                                        po.status
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="po-actions">

                                                    <button
                                                        className="po-action-btn po-action-view"
                                                        onClick={() =>
                                                            openViewModal(
                                                                po
                                                            )
                                                        }
                                                        title="View"
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    {(po.status ===
                                                        "DRAFT" ||
                                                        po.status ===
                                                            "REJECTED") && (
                                                        <>
                                                            <button
                                                                className="po-action-btn po-action-edit"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        po
                                                                    )
                                                                }
                                                                title="Edit"
                                                            >
                                                                <FiEdit2 />
                                                            </button>

                                                            <button
                                                                className="po-action-btn po-action-delete"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        po
                                                                    )
                                                                }
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </>
                                                    )}

                                                    {po.status ===
                                                        "PENDING_APPROVAL" && (
                                                        <button
                                                            className="po-action-btn po-action-approve"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    po
                                                                )
                                                            }
                                                            title="Approve"
                                                        >
                                                            <FiCheckCircle />
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

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {!loading &&
                    purchaseOrders.length >
                        0 && (
                        <div className="po-pagination">

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
                                Previous
                            </button>

                            <div>
                                Page{" "}
                                <strong>
                                    {page}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {totalPages}
                                </strong>
                            </div>

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
                                Next
                            </button>

                        </div>
                    )}

            </div>

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="po-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="po-modal po-form-modal">

                        <div className="po-modal-header">
                            <div>
                                <h2>
                                    {editingPO
                                        ? "Edit Purchase Order"
                                        : "Create Purchase Order"}
                                </h2>

                                <p>
                                    {editingPO
                                        ? editingPO.poNumber
                                        : "New purchase order"}
                                </p>
                            </div>

                            <button
                                className="po-modal-close"
                                onClick={() =>
                                    setShowModal(
                                        false
                                    )
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

                            <div className="po-modal-body">

                                {/* =================================================
                                    BASIC INFORMATION
                                ================================================= */}

                                <div className="po-section-title">
                                    <FiShoppingBag />
                                    <span>
                                        Order Information
                                    </span>
                                </div>

                                <div className="po-form-grid">

                                    <div className="po-form-group">
                                        <label>
                                            Company *
                                        </label>

                                        <select
                                            value={
                                                formData.company
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                handleFormCompanyChange(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                Boolean(
                                                    editingPO
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

                                    <div className="po-form-group">
                                        <label>
                                            Branch *
                                        </label>

                                        <select
                                            value={
                                                formData.branch
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                handleFormBranchChange(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                !formData.company ||
                                                Boolean(
                                                    editingPO
                                                )
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
                                                        {branch.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Supplier *
                                        </label>

                                        <select
                                            name="supplier"
                                            value={
                                                formData.supplier
                                            }
                                            onChange={
                                                handleInputChange
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
                                                            supplier.name
                                                        }{" "}
                                                        {supplier.supplierCode
                                                            ? `(${supplier.supplierCode})`
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Warehouse *
                                        </label>

                                        <select
                                            name="warehouse"
                                            value={
                                                formData.warehouse
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Warehouse
                                            </option>

                                            {warehouses.map(
                                                (
                                                    warehouse
                                                ) => (
                                                    <option
                                                        key={
                                                            warehouse._id
                                                        }
                                                        value={
                                                            warehouse._id
                                                        }
                                                    >
                                                        {
                                                            warehouse.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Order Date *
                                        </label>

                                        <input
                                            type="date"
                                            name="orderDate"
                                            value={
                                                formData.orderDate
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Expected Delivery
                                        </label>

                                        <input
                                            type="date"
                                            name="expectedDeliveryDate"
                                            value={
                                                formData.expectedDeliveryDate
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                    <div className="po-form-group">
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
                                            onChange={
                                                handleInputChange
                                            }
                                        />

                                        <small>
                                            Payment terms in
                                            days
                                        </small>
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Currency
                                        </label>

                                        <input
                                            type="text"
                                            name="currency"
                                            maxLength="10"
                                            value={
                                                formData.currency
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                </div>

                                {/* =================================================
                                    ITEMS
                                ================================================= */}

                                <div className="po-section-title po-items-title">
                                    <FiPackage />
                                    <span>
                                        Products / Items
                                    </span>

                                    <button
                                        type="button"
                                        className="po-add-item-btn"
                                        onClick={
                                            addItem
                                        }
                                    >
                                        <FiPlus />
                                        Add Item
                                    </button>
                                </div>

                                <div className="po-items-container">

                                    {formData.items.map(
                                        (
                                            item,
                                            index
                                        ) => {
                                            const quantity =
                                                Number(
                                                    item.quantity
                                                ) ||
                                                0;

                                            const unitPrice =
                                                Number(
                                                    item.unitPrice
                                                ) ||
                                                0;

                                            const discountPercentage =
                                                Number(
                                                    item.discountPercentage
                                                ) ||
                                                0;

                                            const taxPercentage =
                                                Number(
                                                    item.taxPercentage
                                                ) ||
                                                0;

                                            const gross =
                                                quantity *
                                                unitPrice;

                                            const discount =
                                                gross *
                                                (discountPercentage /
                                                    100);

                                            const taxable =
                                                gross -
                                                discount;

                                            const tax =
                                                taxable *
                                                (taxPercentage /
                                                    100);

                                            const lineTotal =
                                                taxable +
                                                tax;

                                            return (
                                                <div
                                                    className="po-item-card"
                                                    key={
                                                        index
                                                    }
                                                >

                                                    <div className="po-item-header">
                                                        <span>
                                                            Item{" "}
                                                            {index +
                                                                1}
                                                        </span>

                                                        {formData
                                                            .items
                                                            .length >
                                                            1 && (
                                                            <button
                                                                type="button"
                                                                className="po-remove-item-btn"
                                                                onClick={() =>
                                                                    removeItem(
                                                                        index
                                                                    )
                                                                }
                                                                title="Remove item"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="po-item-grid">

                                                        <div className="po-form-group po-product-field">
                                                            <label>
                                                                Product *
                                                            </label>

                                                            <select
                                                                value={
                                                                    item.product
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "product",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                required
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
                                                                            {product.sku
                                                                                ? `- ${product.sku}`
                                                                                : ""}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="po-form-group">
                                                            <label>
                                                                Quantity *
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "quantity",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </div>

                                                        <div className="po-form-group">
                                                            <label>
                                                                Unit Price *
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    item.unitPrice
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "unitPrice",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </div>

                                                        <div className="po-form-group">
                                                            <label>
                                                                Discount %
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                value={
                                                                    item.discountPercentage
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "discountPercentage",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="po-form-group">
                                                            <label>
                                                                Tax %
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                value={
                                                                    item.taxPercentage
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "taxPercentage",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="po-form-group">
                                                            <label>
                                                                Line Total
                                                            </label>

                                                            <div className="po-line-total">
                                                                {formatCurrency(
                                                                    lineTotal,
                                                                    formData.currency
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="po-form-group po-item-notes">
                                                            <label>
                                                                Item Notes
                                                            </label>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    item.notes
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "notes",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Optional"
                                                            />
                                                        </div>

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                                {/* =================================================
                                    CHARGES
                                ================================================= */}

                                <div className="po-section-title">
                                    <FiTruck />
                                    <span>
                                        Additional Charges
                                    </span>
                                </div>

                                <div className="po-form-grid">

                                    <div className="po-form-group">
                                        <label>
                                            Shipping Amount
                                        </label>

                                        <input
                                            type="number"
                                            name="shippingAmount"
                                            min="0"
                                            step="0.01"
                                            value={
                                                formData.shippingAmount
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Other Charges
                                        </label>

                                        <input
                                            type="number"
                                            name="otherCharges"
                                            min="0"
                                            step="0.01"
                                            value={
                                                formData.otherCharges
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                        />
                                    </div>

                                </div>

                                {/* =================================================
                                    TOTALS
                                ================================================= */}

                                <div className="po-total-box">

                                    <div>
                                        <span>
                                            Subtotal
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                calculations.subtotal,
                                                formData.currency
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Discount
                                        </span>

                                        <strong className="po-discount-text">
                                            -{" "}
                                            {formatCurrency(
                                                calculations.discount,
                                                formData.currency
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Tax
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                calculations.tax,
                                                formData.currency
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Shipping
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                calculations.shipping,
                                                formData.currency
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Other Charges
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                calculations.otherCharges,
                                                formData.currency
                                            )}
                                        </strong>
                                    </div>

                                    <div className="po-grand-total">
                                        <span>
                                            Grand Total
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                calculations.total,
                                                formData.currency
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                {/* =================================================
                                    NOTES
                                ================================================= */}

                                <div className="po-section-title">
                                    <FiHome />
                                    <span>
                                        Notes & Terms
                                    </span>
                                </div>

                                <div className="po-form-grid po-textarea-grid">

                                    <div className="po-form-group">
                                        <label>
                                            Notes
                                        </label>

                                        <textarea
                                            name="notes"
                                            rows="4"
                                            maxLength="2000"
                                            value={
                                                formData.notes
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            placeholder="Enter notes..."
                                        />
                                    </div>

                                    <div className="po-form-group">
                                        <label>
                                            Terms & Conditions
                                        </label>

                                        <textarea
                                            name="termsAndConditions"
                                            rows="4"
                                            maxLength="5000"
                                            value={
                                                formData.termsAndConditions
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            placeholder="Enter terms and conditions..."
                                        />
                                    </div>

                                </div>

                                {/* =================================================
                                    STATUS
                                ================================================= */}

                                <div className="po-form-group po-status-select">
                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                    >
                                        <option value="DRAFT">
                                            Draft
                                        </option>

                                        <option value="PENDING_APPROVAL">
                                            Submit for Approval
                                        </option>
                                    </select>
                                </div>

                            </div>

                            {/* =================================================
                                FOOTER
                            ================================================= */}

                            <div className="po-modal-footer">

                                <button
                                    type="button"
                                    className="po-secondary-btn"
                                    onClick={() =>
                                        setShowModal(
                                            false
                                        )
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="po-primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingPO
                                        ? "Update Purchase Order"
                                        : "Save Purchase Order"}
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
                selectedPO && (
                    <div
                        className="po-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setShowViewModal(
                                    false
                                );
                            }
                        }}
                    >
                        <div className="po-modal po-view-modal">

                            <div className="po-modal-header">
                                <div>
                                    <h2>
                                        Purchase Order
                                    </h2>

                                    <p>
                                        {
                                            selectedPO
                                                .purchaseOrder
                                                ?.poNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    className="po-modal-close"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="po-modal-body">

                                {selectedPO.purchaseOrder && (
                                    <>
                                        <div className="po-view-top">

                                            <div>
                                                <span>
                                                    PO Number
                                                </span>

                                                <strong>
                                                    {
                                                        selectedPO
                                                            .purchaseOrder
                                                            .poNumber
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Status
                                                </span>

                                                <span
                                                    className={getStatusClass(
                                                        selectedPO
                                                            .purchaseOrder
                                                            .status
                                                    )}
                                                >
                                                    {formatStatus(
                                                        selectedPO
                                                            .purchaseOrder
                                                            .status
                                                    )}
                                                </span>
                                            </div>

                                            <div>
                                                <span>
                                                    Order Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        selectedPO
                                                            .purchaseOrder
                                                            .orderDate
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Expected Delivery
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        selectedPO
                                                            .purchaseOrder
                                                            .expectedDeliveryDate
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="po-view-info-grid">

                                            <div className="po-view-info-card">
                                                <span>
                                                    Company
                                                </span>

                                                <strong>
                                                    {selectedPO
                                                        .purchaseOrder
                                                        .company
                                                        ?.name ||
                                                        selectedPO
                                                            .purchaseOrder
                                                            .company
                                                            ?.legalName ||
                                                        "-"}
                                                </strong>
                                            </div>

                                            <div className="po-view-info-card">
                                                <span>
                                                    Branch
                                                </span>

                                                <strong>
                                                    {selectedPO
                                                        .purchaseOrder
                                                        .branch
                                                        ?.name ||
                                                        "-"}
                                                </strong>
                                            </div>

                                            <div className="po-view-info-card">
                                                <span>
                                                    Supplier
                                                </span>

                                                <strong>
                                                    {selectedPO
                                                        .purchaseOrder
                                                        .supplier
                                                        ?.name ||
                                                        "-"}
                                                </strong>
                                            </div>

                                            <div className="po-view-info-card">
                                                <span>
                                                    Warehouse
                                                </span>

                                                <strong>
                                                    {selectedPO
                                                        .purchaseOrder
                                                        .warehouse
                                                        ?.name ||
                                                        "-"}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="po-section-title">
                                            <FiPackage />
                                            <span>
                                                Order Items
                                            </span>
                                        </div>

                                        <div className="po-view-items-wrapper">

                                            <table className="po-view-items-table">

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
                                                            Total
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {(
                                                        selectedPO.items ||
                                                        []
                                                    ).map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    item._id ||
                                                                    index
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
                                                                        item.unitPrice,
                                                                        selectedPO
                                                                            .purchaseOrder
                                                                            .currency
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
                                                                    <strong>
                                                                        {formatCurrency(
                                                                            item.lineTotal,
                                                                            selectedPO
                                                                                .purchaseOrder
                                                                                .currency
                                                                        )}
                                                                    </strong>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>

                                            </table>

                                        </div>

                                        <div className="po-view-bottom">

                                            <div className="po-view-notes">

                                                {selectedPO
                                                    .purchaseOrder
                                                    .notes && (
                                                    <div>
                                                        <h4>
                                                            Notes
                                                        </h4>

                                                        <p>
                                                            {
                                                                selectedPO
                                                                    .purchaseOrder
                                                                    .notes
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedPO
                                                    .purchaseOrder
                                                    .termsAndConditions && (
                                                    <div>
                                                        <h4>
                                                            Terms &
                                                            Conditions
                                                        </h4>

                                                        <p>
                                                            {
                                                                selectedPO
                                                                    .purchaseOrder
                                                                    .termsAndConditions
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                            <div className="po-view-totals">

                                                <div>
                                                    <span>
                                                        Subtotal
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            selectedPO
                                                                .purchaseOrder
                                                                .subtotal,
                                                            selectedPO
                                                                .purchaseOrder
                                                                .currency
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Discount
                                                    </span>

                                                    <strong className="po-discount-text">
                                                        -{" "}
                                                        {formatCurrency(
                                                            selectedPO
                                                                .purchaseOrder
                                                                .discountAmount,
                                                            selectedPO
                                                                .purchaseOrder
                                                                .currency
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Tax
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            selectedPO
                                                                .purchaseOrder
                                                                .taxAmount,
                                                            selectedPO
                                                                .purchaseOrder
                                                                .currency
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Shipping
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            selectedPO
                                                                .purchaseOrder
                                                                .shippingAmount,
                                                            selectedPO
                                                                .purchaseOrder
                                                                .currency
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Other Charges
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            selectedPO
                                                                .purchaseOrder
                                                                .otherCharges,
                                                            selectedPO
                                                                .purchaseOrder
                                                                .currency
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="po-view-grand-total">
                                                    <span>
                                                        Grand Total
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            selectedPO
                                                                .purchaseOrder
                                                                .totalAmount,
                                                            selectedPO
                                                                .purchaseOrder
                                                                .currency
                                                        )}
                                                    </strong>
                                                </div>

                                            </div>

                                        </div>
                                    </>
                                )}

                            </div>

                            <div className="po-modal-footer">

                                <button
                                    type="button"
                                    className="po-secondary-btn"
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                >
                                    Close
                                </button>

                                {selectedPO
                                    .purchaseOrder
                                    ?.status ===
                                    "PENDING_APPROVAL" && (
                                    <button
                                        type="button"
                                        className="po-primary-btn"
                                        onClick={() =>
                                            handleApprove(
                                                selectedPO.purchaseOrder
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        <FiCheckCircle />
                                        Approve
                                    </button>
                                )}

                            </div>

                        </div>
                    </div>
                )}

        </div>
    );
};

export default PurchaseOrders;