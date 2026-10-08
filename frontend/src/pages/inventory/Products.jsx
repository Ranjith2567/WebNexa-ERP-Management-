import React, { useEffect, useMemo, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiPackage,
    FiRefreshCw,
    FiFilter,
    FiX,
    FiAlertTriangle,
    FiCheckCircle,
    FiTag,
    FiLayers,
    FiBox,
    FiDollarSign,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/products.css";

const initialForm = {
    company: "",
    branch: "",
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category: "",
    brand: "",
    unit: "",
    purchasePrice: "",
    sellingPrice: "",
    taxRate: "",
    openingStock: "",
    minimumStock: "",
    maximumStock: "",
    isActive: true,
};

function Products() {
    /* =====================================================
       DATA
    ===================================================== */

    const [products, setProducts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);

    /* =====================================================
       LOADING / ERROR
    ===================================================== */

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /* =====================================================
       SEARCH / FILTER
    ===================================================== */

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [lowStockFilter, setLowStockFilter] = useState(false);

    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");
    const [unitFilter, setUnitFilter] = useState("");

    const [showFilters, setShowFilters] = useState(false);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });

    const limit = 10;

    /* =====================================================
       MODALS
    ===================================================== */

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

const [editingProduct, setEditingProduct] = useState(null);
const [selectedProduct, setSelectedProduct] = useState(null);
const [deleteProduct, setDeleteProduct] = useState(null);

const [barcodeImageUrl, setBarcodeImageUrl] = useState("");
const [qrImageUrl, setQrImageUrl] = useState("");
const [barcodeLoading, setBarcodeLoading] = useState(false);

    /* =====================================================
       FORM
    ===================================================== */

    const [formData, setFormData] = useState(initialForm);

    /* =====================================================
       LOAD COMPANIES
    ===================================================== */

    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies", {
                params: {
                    page: 1,
                    limit: 100,
                },
            });

            setCompanies(
                response.data.companies ||
                    response.data.data ||
                    []
            );
        } catch (err) {
            console.error("Failed to load companies:", err);
        }
    };

    /* =====================================================
       LOAD BRANCHES
    ===================================================== */

    const fetchBranches = async (companyId = "") => {
        try {
            const params = {
                page: 1,
                limit: 100,
            };

            if (companyId) {
                params.company = companyId;
            }

            const response = await api.get("/branches", {
                params,
            });

            setBranches(response.data.branches || []);
        } catch (err) {
            console.error("Failed to load branches:", err);
            setBranches([]);
        }
    };

    /* =====================================================
       LOAD CATEGORIES
    ===================================================== */

    const fetchCategories = async (companyId = "") => {
        try {
            const params = {
                page: 1,
                limit: 100,
            };

            if (companyId) {
                params.company = companyId;
            }

            const response = await api.get("/categories", {
                params,
            });

            setCategories(response.data.categories || []);
        } catch (err) {
            console.error("Failed to load categories:", err);
            setCategories([]);
        }
    };

    /* =====================================================
       LOAD BRANDS
    ===================================================== */

    const fetchBrands = async (companyId = "") => {
        try {
            const params = {
                page: 1,
                limit: 100,
            };

            if (companyId) {
                params.company = companyId;
            }

            const response = await api.get("/brands", {
                params,
            });

            setBrands(response.data.brands || []);
        } catch (err) {
            console.error("Failed to load brands:", err);
            setBrands([]);
        }
    };

    /* =====================================================
       LOAD UNITS
    ===================================================== */

    const fetchUnits = async (companyId = "") => {
        try {
            const params = {
                page: 1,
                limit: 100,
            };

            if (companyId) {
                params.company = companyId;
            }

            const response = await api.get("/units", {
                params,
            });

            setUnits(response.data.units || []);
        } catch (err) {
            console.error("Failed to load units:", err);
            setUnits([]);
        }
    };

    /* =====================================================
       LOAD MASTER DATA
    ===================================================== */

    useEffect(() => {
        fetchCompanies();
        fetchBranches();
        fetchCategories();
        fetchBrands();
        fetchUnits();
    }, []);

    /* =====================================================
       COMPANY FILTER DATA
    ===================================================== */

    useEffect(() => {
        if (!companyFilter) {
            fetchBranches();
            fetchCategories();
            fetchBrands();
            fetchUnits();
            return;
        }

        fetchBranches(companyFilter);
        fetchCategories(companyFilter);
        fetchBrands(companyFilter);
        fetchUnits(companyFilter);

        setBranchFilter("");
        setCategoryFilter("");
        setBrandFilter("");
        setUnitFilter("");
    }, [companyFilter]);

    /* =====================================================
       FETCH PRODUCTS
    ===================================================== */

    const fetchProducts = async (requestedPage = page) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: requestedPage,
                limit,
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

            if (categoryFilter) {
                params.category = categoryFilter;
            }

            if (brandFilter) {
                params.brand = brandFilter;
            }

            if (unitFilter) {
                params.unit = unitFilter;
            }

            if (activeFilter === "active") {
                params.isActive = true;
            }

            if (activeFilter === "inactive") {
                params.isActive = false;
            }

            if (lowStockFilter) {
                params.lowStock = true;
            }

            const response = await api.get("/products", {
                params,
            });

            setProducts(response.data.products || []);

            setPagination(
                response.data.pagination || {
                    page: requestedPage,
                    limit,
                    total: response.data.total || 0,
                    pages: response.data.pages || 0,
                }
            );
        } catch (err) {
            console.error("Failed to load products:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load products"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       FETCH WHEN FILTER / PAGE CHANGES
    ===================================================== */

    useEffect(() => {
        fetchProducts(page);
    }, [
        page,
        activeFilter,
        lowStockFilter,
        companyFilter,
        branchFilter,
        categoryFilter,
        brandFilter,
        unitFilter,
    ]);

    /* =====================================================
       SEARCH DEBOUNCE
    ===================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchProducts(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    /* =====================================================
       CLEAR ALERTS
    ===================================================== */

    useEffect(() => {
        if (!success && !error) {
            return;
        }

        const timer = setTimeout(() => {
            setSuccess("");
            setError("");
        }, 4000);

        return () => clearTimeout(timer);
    }, [success, error]);

    /* =====================================================
       HANDLE FORM INPUT
    ===================================================== */

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    /* =====================================================
       HANDLE COMPANY CHANGE IN FORM
    ===================================================== */

    const handleFormCompanyChange = async (e) => {
        const companyId = e.target.value;

        setFormData((prev) => ({
            ...prev,
            company: companyId,
            branch: "",
            category: "",
            brand: "",
            unit: "",
        }));

        if (!companyId) {
            setBranches([]);
            setCategories([]);
            setBrands([]);
            setUnits([]);
            return;
        }

        await Promise.all([
            fetchBranches(companyId),
            fetchCategories(companyId),
            fetchBrands(companyId),
            fetchUnits(companyId),
        ]);
    };

    /* =====================================================
       OPEN CREATE MODAL
    ===================================================== */

    const openCreateModal = async () => {
        setEditingProduct(null);

        setFormData({
            ...initialForm,
            company:
                companies.length === 1
                    ? companies[0]._id
                    : "",
        });

        if (companies.length === 1) {
            await Promise.all([
                fetchBranches(companies[0]._id),
                fetchCategories(companies[0]._id),
                fetchBrands(companies[0]._id),
                fetchUnits(companies[0]._id),
            ]);
        }

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

    const openEditModal = async (product) => {
        setEditingProduct(product);

        const companyId =
            product.company?._id ||
            product.company ||
            "";

        setFormData({
            company: companyId,
            branch:
                product.branch?._id ||
                product.branch ||
                "",
            name: product.name || "",
            sku: product.sku || "",
            barcode: product.barcode || "",
            description:
                product.description || "",
            category:
                product.category?._id ||
                product.category ||
                "",
            brand:
                product.brand?._id ||
                product.brand ||
                "",
            unit:
                product.unit?._id ||
                product.unit ||
                "",
            purchasePrice:
                product.purchasePrice ?? "",
            sellingPrice:
                product.sellingPrice ?? "",
            taxRate:
                product.taxRate ?? "",
            openingStock:
                product.openingStock ?? "",
            minimumStock:
                product.minimumStock ?? "",
            maximumStock:
                product.maximumStock ?? "",
            isActive:
                product.isActive !== false,
        });

        if (companyId) {
            await Promise.all([
                fetchBranches(companyId),
                fetchCategories(companyId),
                fetchBrands(companyId),
                fetchUnits(companyId),
            ]);
        }

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =====================================================
       CLOSE FORM MODAL
    ===================================================== */

    const closeModal = () => {
        if (formLoading) return;

        setShowModal(false);
        setEditingProduct(null);
        setFormData(initialForm);
    };

    /* =====================================================
       SUBMIT PRODUCT
    ===================================================== */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormLoading(true);
        setError("");
        setSuccess("");

        try {
            const minimumStock =
                Number(formData.minimumStock || 0);

            const maximumStock =
                Number(formData.maximumStock || 0);

            if (
                maximumStock > 0 &&
                maximumStock < minimumStock
            ) {
                setError(
                    "Maximum stock cannot be lower than minimum stock"
                );
                setFormLoading(false);
                return;
            }

            if (
                Number(formData.taxRate || 0) < 0 ||
                Number(formData.taxRate || 0) > 100
            ) {
                setError(
                    "Tax rate must be between 0 and 100"
                );
                setFormLoading(false);
                return;
            }

            const payload = {
                branch: formData.branch,
                name: formData.name.trim(),
                sku: formData.sku.trim().toUpperCase(),
                barcode:
                    formData.barcode.trim(),
                description:
                    formData.description.trim(),
                category:
                    formData.category || null,
                brand:
                    formData.brand || null,
                unit:
                    formData.unit || null,

                purchasePrice:
                    Number(formData.purchasePrice || 0),

                sellingPrice:
                    Number(formData.sellingPrice || 0),

                taxRate:
                    Number(formData.taxRate || 0),

                openingStock:
                    Number(formData.openingStock || 0),

                minimumStock:
                    Number(formData.minimumStock || 0),

                maximumStock:
                    Number(formData.maximumStock || 0),

                isActive: formData.isActive,
            };

            if (!editingProduct) {
                payload.company = formData.company;
            }

            if (editingProduct) {
                const response = await api.put(
                    `/products/${editingProduct._id}`,
                    payload
                );

                setSuccess(
                    response.data.message ||
                        "Product updated successfully"
                );
            } else {
                const response = await api.post(
                    "/products",
                    {
                        ...payload,
                        company: formData.company,
                    }
                );

                setSuccess(
                    response.data.message ||
                        "Product created successfully"
                );
            }

            closeModal();
            setPage(1);
            await fetchProducts(1);
        } catch (err) {
            console.error(
                "Failed to save product:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to save product"
            );
        } finally {
            setFormLoading(false);
        }
    };

    /* =====================================================
       OPEN VIEW MODAL
    ===================================================== */

   const openViewModal = async (product) => {
    setShowViewModal(true);
    setViewLoading(true);
    setSelectedProduct(null);

    setBarcodeImageUrl("");
    setQrImageUrl("");
    setBarcodeLoading(false);

    try {
        const response = await api.get(
            `/products/${product._id}`
        );

        const productData =
            response.data.product;

        setSelectedProduct(
            productData
                ? {
                      ...productData,
                      stockSummary:
                          response.data.stockSummary,
                      stocks:
                          response.data.stocks || [],
                  }
                : null
        );

        if (productData) {
            try {
                setBarcodeLoading(true);

                if (productData.barcode) {
                    const barcodeResponse =
                        await api.get(
                            `/barcode/product/${productData._id}`,
                            {
                                responseType: "blob",
                            }
                        );

                    setBarcodeImageUrl(
                        URL.createObjectURL(
                            barcodeResponse.data
                        )
                    );
                }

                const qrResponse =
                    await api.get(
                        `/barcode/product/${productData._id}/qr`,
                        {
                            responseType: "blob",
                        }
                    );

                setQrImageUrl(
                    URL.createObjectURL(
                        qrResponse.data
                    )
                );
            } catch (codeError) {
                console.error(
                    "Failed to generate product barcode/QR:",
                    codeError
                );

                setBarcodeImageUrl("");
                setQrImageUrl("");
            } finally {
                setBarcodeLoading(false);
            }
        }
    } catch (err) {
        console.error(
            "Failed to load product:",
            err
        );

        setError(
            err.response?.data?.message ||
                "Failed to load product details"
        );

        setShowViewModal(false);
    } finally {
        setViewLoading(false);
    }
};

    /* =====================================================
       DELETE CONFIRMATION
    ===================================================== */

    const openDeleteModal = (product) => {
        setDeleteProduct(product);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (formLoading) return;

        setShowDeleteModal(false);
        setDeleteProduct(null);
    };

    /* =====================================================
       DELETE PRODUCT
    ===================================================== */

    const handleDelete = async () => {
        if (!deleteProduct) return;

        setFormLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.delete(
                `/products/${deleteProduct._id}`
            );

            setSuccess(
                response.data.message ||
                    "Product deleted successfully"
            );

            closeDeleteModal();

            const currentPage = page;

            if (
                products.length === 1 &&
                currentPage > 1
            ) {
                setPage(currentPage - 1);
                await fetchProducts(
                    currentPage - 1
                );
            } else {
                await fetchProducts(currentPage);
            }
        } catch (err) {
            console.error(
                "Failed to delete product:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to delete product"
            );
        } finally {
            setFormLoading(false);
        }
    };

    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    const clearFilters = () => {
        setSearch("");
        setActiveFilter("all");
        setLowStockFilter(false);
        setCompanyFilter("");
        setBranchFilter("");
        setCategoryFilter("");
        setBrandFilter("");
        setUnitFilter("");
        setPage(1);
    };

    /* =====================================================
       PAGINATION
    ===================================================== */

    const goToPage = (newPage) => {
        if (
            newPage < 1 ||
            newPage > pagination.pages
        ) {
            return;
        }

        setPage(newPage);
    };

    /* =====================================================
       SUMMARY
    ===================================================== */

    const summary = useMemo(() => {
        const active = products.filter(
            (product) => product.isActive
        ).length;

        const inactive = products.filter(
            (product) => !product.isActive
        ).length;

        const lowStock = products.filter(
            (product) => {
                const available =
                    Number(
                        product.stockSummary
                            ?.totalAvailableQuantity || 0
                    );

                const minimum =
                    Number(
                        product.minimumStock || 0
                    );

                return (
                    minimum > 0 &&
                    available <= minimum
                );
            }
        ).length;

        const stockQuantity = products.reduce(
            (sum, product) =>
                sum +
                Number(
                    product.stockSummary
                        ?.totalAvailableQuantity || 0
                ),
            0
        );

        return {
            total: pagination.total || 0,
            active,
            inactive,
            lowStock,
            stockQuantity,
        };
    }, [products, pagination.total]);

    /* =====================================================
       FORMAT HELPERS
    ===================================================== */

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    const getCompanyName = (company) => {
        if (!company) return "-";

        return (
            company.name ||
            company.legalName ||
            "-"
        );
    };

    const getBranchName = (branch) => {
        if (!branch) return "-";

        if (
            branch.name &&
            branch.branchCode
        ) {
            return `${branch.name} (${branch.branchCode})`;
        }

        return branch.name || "-";
    };

    const getCategoryName = (category) => {
        if (!category) return "-";

        if (
            category.name &&
            category.code
        ) {
            return `${category.name} (${category.code})`;
        }

        return category.name || "-";
    };

    const getBrandName = (brand) => {
        if (!brand) return "-";

        if (
            brand.name &&
            brand.code
        ) {
            return `${brand.name} (${brand.code})`;
        }

        return brand.name || "-";
    };

    const getUnitName = (unit) => {
        if (!unit) return "-";

        if (unit.symbol) {
            return `${unit.name} (${unit.symbol})`;
        }

        return unit.name || "-";
    };

    const isLowStock = (product) => {
        const available =
            Number(
                product.stockSummary
                    ?.totalAvailableQuantity || 0
            );

        const minimum =
            Number(product.minimumStock || 0);

        return (
            minimum > 0 &&
            available <= minimum
        );
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="products-page">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="products-header">
                <div>
                    <div className="products-title-row">
                        <div className="products-title-icon">
                            <FiPackage />
                        </div>

                        <div>
                            <h1>Products</h1>

                            <p>
                                Manage products, pricing
                                and inventory settings
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="products-primary-btn"
                    onClick={openCreateModal}
                >
                    <FiPlus />
                    Add Product
                </button>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {success && (
                <div className="products-alert products-alert-success">
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
                <div className="products-alert products-alert-error">
                    <FiAlertTriangle />
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

            <div className="products-summary-grid">
                <div className="products-summary-card">
                    <div className="products-summary-icon products-icon-blue">
                        <FiPackage />
                    </div>

                    <div>
                        <span>Total Products</span>
                        <strong>
                            {summary.total}
                        </strong>
                    </div>
                </div>

                <div className="products-summary-card">
                    <div className="products-summary-icon products-icon-green">
                        <FiCheckCircle />
                    </div>

                    <div>
                        <span>Active</span>
                        <strong>
                            {summary.active}
                        </strong>
                    </div>
                </div>

                <div className="products-summary-card">
                    <div className="products-summary-icon products-icon-orange">
                        <FiAlertTriangle />
                    </div>

                    <div>
                        <span>Low Stock</span>
                        <strong>
                            {summary.lowStock}
                        </strong>
                    </div>
                </div>

                <div className="products-summary-card">
                    <div className="products-summary-icon products-icon-purple">
                        <FiBox />
                    </div>

                    <div>
                        <span>Available Stock</span>
                        <strong>
                            {summary.stockQuantity}
                        </strong>
                    </div>
                </div>
            </div>

            {/* =================================================
                SEARCH / TOOLBAR
            ================================================= */}

            <div className="products-toolbar">
                <div className="products-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search product, SKU or barcode..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                    {search && (
                        <button
                            className="products-search-clear"
                            onClick={() =>
                                setSearch("")
                            }
                        >
                            <FiX />
                        </button>
                    )}
                </div>

                <div className="products-toolbar-actions">
                    <div className="products-status-tabs">
                        <button
                            className={
                                activeFilter ===
                                "all"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {
                                setActiveFilter(
                                    "all"
                                );
                                setPage(1);
                            }}
                        >
                            All
                        </button>

                        <button
                            className={
                                activeFilter ===
                                "active"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {
                                setActiveFilter(
                                    "active"
                                );
                                setPage(1);
                            }}
                        >
                            Active
                        </button>

                        <button
                            className={
                                activeFilter ===
                                "inactive"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {
                                setActiveFilter(
                                    "inactive"
                                );
                                setPage(1);
                            }}
                        >
                            Inactive
                        </button>
                    </div>

                    <button
                        className={
                            lowStockFilter
                                ? "products-filter-btn active"
                                : "products-filter-btn"
                        }
                        onClick={() => {
                            setLowStockFilter(
                                !lowStockFilter
                            );
                            setPage(1);
                        }}
                    >
                        <FiAlertTriangle />
                        Low Stock
                    </button>

                    <button
                        className={
                            showFilters
                                ? "products-filter-btn active"
                                : "products-filter-btn"
                        }
                        onClick={() =>
                            setShowFilters(
                                !showFilters
                            )
                        }
                    >
                        <FiFilter />
                        Filters
                    </button>

                    <button
                        className="products-refresh-btn"
                        onClick={() =>
                            fetchProducts(page)
                        }
                        title="Refresh"
                    >
                        <FiRefreshCw
                            className={
                                loading
                                    ? "products-spin"
                                    : ""
                            }
                        />
                    </button>
                </div>
            </div>

            {/* =================================================
                FILTER PANEL
            ================================================= */}

            {showFilters && (
                <div className="products-filter-panel">
                    <div className="products-filter-header">
                        <div>
                            <h3>
                                Product Filters
                            </h3>

                            <p>
                                Filter products by
                                classification
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                setShowFilters(false)
                            }
                        >
                            <FiX />
                        </button>
                    </div>

                    <div className="products-filter-grid">
                        <div className="products-field">
                            <label>Company</label>

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
                                            {getCompanyName(
                                                company
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="products-field">
                            <label>Branch</label>

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
                                            {getBranchName(
                                                branch
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="products-field">
                            <label>Category</label>

                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    All Categories
                                </option>

                                {categories.map(
                                    (category) => (
                                        <option
                                            key={
                                                category._id
                                            }
                                            value={
                                                category._id
                                            }
                                        >
                                            {getCategoryName(
                                                category
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="products-field">
                            <label>Brand</label>

                            <select
                                value={brandFilter}
                                onChange={(e) => {
                                    setBrandFilter(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    All Brands
                                </option>

                                {brands.map(
                                    (brand) => (
                                        <option
                                            key={
                                                brand._id
                                            }
                                            value={
                                                brand._id
                                            }
                                        >
                                            {getBrandName(
                                                brand
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="products-field">
                            <label>Unit</label>

                            <select
                                value={unitFilter}
                                onChange={(e) => {
                                    setUnitFilter(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    All Units
                                </option>

                                {units.map(
                                    (unit) => (
                                        <option
                                            key={
                                                unit._id
                                            }
                                            value={
                                                unit._id
                                            }
                                        >
                                            {getUnitName(
                                                unit
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="products-filter-footer">
                        <button
                            className="products-clear-btn"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* =================================================
                PRODUCT TABLE
            ================================================= */}

            <div className="products-table-card">
                <div className="products-table-header">
                    <div>
                        <h2>Product List</h2>

                        <span>
                            {pagination.total || 0}{" "}
                            products found
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="products-loading">
                        <div className="products-spinner"></div>
                        <p>
                            Loading products...
                        </p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="products-empty">
                        <div className="products-empty-icon">
                            <FiPackage />
                        </div>

                        <h3>
                            No products found
                        </h3>

                        <p>
                            Try changing your
                            search or filters,
                            or create a new
                            product.
                        </p>

                        <button
                            className="products-primary-btn"
                            onClick={
                                openCreateModal
                            }
                        >
                            <FiPlus />
                            Add Product
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="products-table-wrapper">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Product
                                        </th>
                                        <th>
                                            SKU
                                        </th>
                                        <th>
                                            Category
                                        </th>
                                        <th>
                                            Brand
                                        </th>
                                        <th>
                                            Pricing
                                        </th>
                                        <th>
                                            Stock
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
                                    {products.map(
                                        (
                                            product
                                        ) => {
                                            const lowStock =
                                                isLowStock(
                                                    product
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        product._id
                                                    }
                                                >
                                                    <td>
                                                        <div className="products-product-cell">
                                                            <div className="products-product-icon">
                                                                <FiPackage />
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        product.name
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {getBranchName(
                                                                        product.branch
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="products-code">
                                                            {
                                                                product.sku
                                                            }
                                                        </span>

                                                        {product.barcode && (
                                                            <small className="products-barcode">
                                                                {
                                                                    product.barcode
                                                                }
                                                            </small>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="products-secondary-text">
                                                            {getCategoryName(
                                                                product.category
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="products-secondary-text">
                                                            {getBrandName(
                                                                product.brand
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="products-price-cell">
                                                            <strong>
                                                                {formatCurrency(
                                                                    product.sellingPrice
                                                                )}
                                                            </strong>

                                                            <span>
                                                                Buy:{" "}
                                                                {formatCurrency(
                                                                    product.purchasePrice
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div
                                                            className={
                                                                lowStock
                                                                    ? "products-stock-cell low"
                                                                    : "products-stock-cell"
                                                            }
                                                        >
                                                            <strong>
                                                                {Number(
                                                                    product
                                                                        .stockSummary
                                                                        ?.totalAvailableQuantity ||
                                                                        0
                                                                )}
                                                            </strong>

                                                            <span>
                                                                Min:{" "}
                                                                {Number(
                                                                    product.minimumStock ||
                                                                        0
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                product.isActive
                                                                    ? "products-status active"
                                                                    : "products-status inactive"
                                                            }
                                                        >
                                                            <span></span>

                                                            {product.isActive
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </span>

                                                        {lowStock && (
                                                            <span className="products-low-badge">
                                                                Low Stock
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <div className="products-actions">
                                                            <button
                                                                className="products-action-btn view"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        product
                                                                    )
                                                                }
                                                                title="View"
                                                            >
                                                                <FiEye />
                                                            </button>

                                                            <button
                                                                className="products-action-btn edit"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        product
                                                                    )
                                                                }
                                                                title="Edit"
                                                            >
                                                                <FiEdit2 />
                                                            </button>

                                                            <button
                                                                className="products-action-btn delete"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        product
                                                                    )
                                                                }
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* =================================================
                            PAGINATION
                        ================================================= */}

                        {pagination.pages > 0 && (
                            <div className="products-pagination">
                                <span>
                                    Showing{" "}
                                    <strong>
                                        {(page - 1) *
                                            limit +
                                            1}
                                    </strong>{" "}
                                    to{" "}
                                    <strong>
                                        {Math.min(
                                            page *
                                                limit,
                                            pagination.total
                                        )}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {
                                            pagination.total
                                        }
                                    </strong>
                                </span>

                                <div className="products-pagination-buttons">
                                    <button
                                        disabled={
                                            page === 1
                                        }
                                        onClick={() =>
                                            goToPage(
                                                page - 1
                                            )
                                        }
                                    >
                                        Previous
                                    </button>

                                    {Array.from(
                                        {
                                            length: Math.min(
                                                pagination.pages,
                                                5
                                            ),
                                        },
                                        (_, index) => {
                                            let pageNumber =
                                                index + 1;

                                            if (
                                                pagination.pages >
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
                                                    pagination.pages
                                                ) {
                                                    pageNumber =
                                                        pagination.pages -
                                                        4 +
                                                        index;
                                                }
                                            }

                                            return (
                                                <button
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
                                        disabled={
                                            page ===
                                            pagination.pages
                                        }
                                        onClick={() =>
                                            goToPage(
                                                page + 1
                                            )
                                        }
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* =========================================================
                CREATE / EDIT MODAL
            ========================================================= */}

            {showModal && (
                <div className="products-modal-overlay">
                    <div className="products-modal products-form-modal">
                        <div className="products-modal-header">
                            <div>
                                <h2>
                                    {editingProduct
                                        ? "Edit Product"
                                        : "Add Product"}
                                </h2>

                                <p>
                                    {editingProduct
                                        ? "Update product information"
                                        : "Create a new product"}
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                disabled={
                                    formLoading
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
                            <div className="products-modal-body">
                                {/* ================================
                                    BASIC DETAILS
                                ================================= */}

                                <div className="products-form-section">
                                    <div className="products-section-title">
                                        <FiPackage />

                                        <div>
                                            <h3>
                                                Basic Details
                                            </h3>

                                            <p>
                                                Product identification
                                                information
                                            </p>
                                        </div>
                                    </div>

                                    <div className="products-form-grid">
                                        <div className="products-field">
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
                                                    handleFormCompanyChange
                                                }
                                                disabled={
                                                    !!editingProduct
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Select
                                                    company
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
                                                            {getCompanyName(
                                                                company
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            {editingProduct && (
                                                <small className="products-field-help">
                                                    Company
                                                    cannot be
                                                    changed
                                                    while
                                                    editing.
                                                </small>
                                            )}
                                        </div>

                                        <div className="products-field">
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
                                                    handleChange
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Select
                                                    branch
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
                                                            {getBranchName(
                                                                branch
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Product
                                                Name
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
                                                placeholder="Enter product name"
                                                maxLength={
                                                    150
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                SKU
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                name="sku"
                                                value={
                                                    formData.sku
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. PROD-001"
                                                maxLength={
                                                    50
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Barcode
                                            </label>

                                            <input
                                                type="text"
                                                name="barcode"
                                                value={
                                                    formData.barcode
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter barcode"
                                                maxLength={
                                                    100
                                                }
                                            />
                                        </div>

                                        <div className="products-field products-field-full">
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
                                                placeholder="Enter product description"
                                                maxLength={
                                                    1000
                                                }
                                                rows="3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ================================
                                    CLASSIFICATION
                                ================================= */}

                                <div className="products-form-section">
                                    <div className="products-section-title">
                                        <FiLayers />

                                        <div>
                                            <h3>
                                                Classification
                                            </h3>

                                            <p>
                                                Organize the
                                                product
                                            </p>
                                        </div>
                                    </div>

                                    <div className="products-form-grid">
                                        <div className="products-field">
                                            <label>
                                                Category
                                            </label>

                                            <select
                                                name="category"
                                                value={
                                                    formData.category
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >
                                                <option value="">
                                                    No category
                                                </option>

                                                {categories.map(
                                                    (
                                                        category
                                                    ) => (
                                                        <option
                                                            key={
                                                                category._id
                                                            }
                                                            value={
                                                                category._id
                                                            }
                                                        >
                                                            {getCategoryName(
                                                                category
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Brand
                                            </label>

                                            <select
                                                name="brand"
                                                value={
                                                    formData.brand
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >
                                                <option value="">
                                                    No brand
                                                </option>

                                                {brands.map(
                                                    (
                                                        brand
                                                    ) => (
                                                        <option
                                                            key={
                                                                brand._id
                                                            }
                                                            value={
                                                                brand._id
                                                            }
                                                        >
                                                            {getBrandName(
                                                                brand
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Unit
                                            </label>

                                            <select
                                                name="unit"
                                                value={
                                                    formData.unit
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >
                                                <option value="">
                                                    No unit
                                                </option>

                                                {units.map(
                                                    (
                                                        unit
                                                    ) => (
                                                        <option
                                                            key={
                                                                unit._id
                                                            }
                                                            value={
                                                                unit._id
                                                            }
                                                        >
                                                            {getUnitName(
                                                                unit
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ================================
                                    PRICING & TAX
                                ================================= */}

                                <div className="products-form-section">
                                    <div className="products-section-title">
                                        <FiDollarSign />

                                        <div>
                                            <h3>
                                                Pricing &
                                                Tax
                                            </h3>

                                            <p>
                                                Product
                                                pricing
                                                configuration
                                            </p>
                                        </div>
                                    </div>

                                    <div className="products-form-grid">
                                        <div className="products-field">
                                            <label>
                                                Purchase
                                                Price
                                            </label>

                                            <div className="products-input-prefix">
                                                <span>
                                                    ₹
                                                </span>

                                                <input
                                                    type="number"
                                                    name="purchasePrice"
                                                    value={
                                                        formData.purchasePrice
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Selling
                                                Price
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <div className="products-input-prefix">
                                                <span>
                                                    ₹
                                                </span>

                                                <input
                                                    type="number"
                                                    name="sellingPrice"
                                                    value={
                                                        formData.sellingPrice
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Tax Rate
                                            </label>

                                            <div className="products-input-suffix">
                                                <input
                                                    type="number"
                                                    name="taxRate"
                                                    value={
                                                        formData.taxRate
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="0"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />

                                                <span>
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ================================
                                    STOCK SETTINGS
                                ================================= */}

                                <div className="products-form-section">
                                    <div className="products-section-title">
                                        <FiBox />

                                        <div>
                                            <h3>
                                                Stock
                                                Settings
                                            </h3>

                                            <p>
                                                Product-level
                                                stock
                                                thresholds
                                            </p>
                                        </div>
                                    </div>

                                    <div className="products-form-grid">
                                        <div className="products-field">
                                            <label>
                                                Opening
                                                Stock
                                            </label>

                                            <input
                                                type="number"
                                                name="openingStock"
                                                value={
                                                    formData.openingStock
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="0"
                                                min="0"
                                                step="0.01"
                                            />

                                            <small className="products-field-help">
                                                Reference/setup
                                                stock. Actual
                                                stock is
                                                maintained
                                                separately.
                                            </small>
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Minimum
                                                Stock
                                            </label>

                                            <input
                                                type="number"
                                                name="minimumStock"
                                                value={
                                                    formData.minimumStock
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="0"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="products-field">
                                            <label>
                                                Maximum
                                                Stock
                                            </label>

                                            <input
                                                type="number"
                                                name="maximumStock"
                                                value={
                                                    formData.maximumStock
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="0"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="products-field products-checkbox-field">
                                            <label className="products-checkbox-label">
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

                                                <span className="products-custom-checkbox"></span>

                                                <span>
                                                    Product
                                                    Active
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ================================
                                MODAL FOOTER
                            ================================= */}

                            <div className="products-modal-footer">
                                <button
                                    type="button"
                                    className="products-secondary-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        formLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="products-primary-btn"
                                    disabled={
                                        formLoading
                                    }
                                >
                                    {formLoading ? (
                                        <>
                                            <span className="products-btn-spinner"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle />
                                            {editingProduct
                                                ? "Update Product"
                                                : "Create Product"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================
                VIEW MODAL
            ========================================================= */}

            {showViewModal && (
                <div className="products-modal-overlay">
                    <div className="products-modal products-view-modal">
                        <div className="products-modal-header">
                            <div>
                                <h2>
                                    Product Details
                                </h2>

                                <p>
                                    Complete product
                                    information
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setShowViewModal(
                                        false
                                    )
                                }
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="products-modal-body">
                            {viewLoading ? (
                                <div className="products-loading">
                                    <div className="products-spinner"></div>
                                    <p>
                                        Loading
                                        product details...
                                    </p>
                                </div>
                            ) : selectedProduct ? (
                                <>
                                    <div className="products-view-hero">
                                        <div className="products-view-icon">
                                            <FiPackage />
                                        </div>

                                        <div>
                                            <h3>
                                                {
                                                    selectedProduct.name
                                                }
                                            </h3>

                                            <div className="products-view-meta">
                                                <span>
                                                    SKU:{" "}
                                                    <strong>
                                                        {
                                                            selectedProduct.sku
                                                        }
                                                    </strong>
                                                </span>

                                                {selectedProduct.barcode && (
                                                    <span>
                                                        Barcode:{" "}
                                                        <strong>
                                                            {
                                                                selectedProduct.barcode
                                                            }
                                                        </strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <span
                                            className={
                                                selectedProduct.isActive
                                                    ? "products-status active"
                                                    : "products-status inactive"
                                            }
                                        >
                                            <span></span>

                                            {selectedProduct.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="products-view-grid">
                                        <div className="products-detail-card">
                                            <span>
                                                Company
                                            </span>

                                            <strong>
                                                {getCompanyName(
                                                    selectedProduct.company
                                                )}
                                            </strong>
                                        </div>

                                        <div className="products-detail-card">
                                            <span>
                                                Branch
                                            </span>

                                            <strong>
                                                {getBranchName(
                                                    selectedProduct.branch
                                                )}
                                            </strong>
                                        </div>

                                        <div className="products-detail-card">
                                            <span>
                                                Category
                                            </span>

                                            <strong>
                                                {getCategoryName(
                                                    selectedProduct.category
                                                )}
                                            </strong>
                                        </div>

                                        <div className="products-detail-card">
                                            <span>
                                                Brand
                                            </span>

                                            <strong>
                                                {getBrandName(
                                                    selectedProduct.brand
                                                )}
                                            </strong>
                                        </div>

                                        <div className="products-detail-card">
                                            <span>
                                                Unit
                                            </span>

                                            <strong>
                                                {getUnitName(
                                                    selectedProduct.unit
                                                )}
                                            </strong>
                                        </div>

                                        <div className="products-detail-card">
                                            <span>
                                                Tax Rate
                                            </span>

                                            <strong>
                                                {Number(
                                                    selectedProduct.taxRate ||
                                                        0
                                                )}
                                                %
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="products-view-section">
                                        <h3>
                                            Pricing
                                        </h3>

                                        <div className="products-view-pricing-grid">
                                            <div>
                                                <span>
                                                    Purchase
                                                    Price
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        selectedProduct.purchasePrice
                                                    )}
                                                </strong>
                                            </div>
                                         
                                            <div>
                                                <span>
                                                    Selling
                                                    Price
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        selectedProduct.sellingPrice
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                   <div className="products-view-section">
    <h3>
        Product Codes
    </h3>

    {barcodeLoading ? (
        <div className="products-code-loading">
            <div className="products-spinner"></div>

            <p>
                Generating barcode & QR code...
            </p>
        </div>
    ) : (
        <div className="products-code-grid">

            {selectedProduct.barcode &&
                barcodeImageUrl && (
                    <div className="products-code-card">
                        <div className="products-code-header">
                            <div>
                                <span>
                                    Barcode
                                </span>

                                <strong>
                                    {
                                        selectedProduct.barcode
                                    }
                                </strong>
                            </div>
                        </div>

                        <div className="products-barcode-preview">
                            <img
                                src={
                                    barcodeImageUrl
                                }
                                alt={`Barcode for ${selectedProduct.name}`}
                            />
                        </div>
                    </div>
                )}

            {qrImageUrl && (
                <div className="products-code-card">
                    <div className="products-code-header">
                        <div>
                            <span>
                                QR Code
                            </span>

                            <strong>
                                {
                                    selectedProduct.sku
                                }
                            </strong>
                        </div>
                    </div>

                    <div className="products-qr-preview">
                        <img
                            src={qrImageUrl}
                            alt={`QR code for ${selectedProduct.name}`}
                        />
                    </div>
                </div>
            )}

        </div>
    )}
</div>
                                    <div className="products-view-section">
                                        <h3>
                                            Stock
                                            Summary
                                        </h3>

                                        <div className="products-stock-summary-grid">
                                            <div>
                                                <span>
                                                    Total
                                                    Quantity
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct
                                                            .stockSummary
                                                            ?.totalQuantity ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Reserved
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct
                                                            .stockSummary
                                                            ?.totalReservedQuantity ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Available
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct
                                                            .stockSummary
                                                            ?.totalAvailableQuantity ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Warehouses
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct
                                                            .stockSummary
                                                            ?.warehouseCount ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="products-view-section">
                                        <h3>
                                            Stock
                                            Thresholds
                                        </h3>

                                        <div className="products-view-threshold-grid">
                                            <div>
                                                <span>
                                                    Opening
                                                    Stock
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct.openingStock ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Minimum
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct.minimumStock ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Maximum
                                                </span>

                                                <strong>
                                                    {Number(
                                                        selectedProduct.maximumStock ||
                                                            0
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedProduct.description && (
                                        <div className="products-view-section">
                                            <h3>
                                                Description
                                            </h3>

                                            <p className="products-description">
                                                {
                                                    selectedProduct.description
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {selectedProduct.stocks?.length >
                                        0 && (
                                        <div className="products-view-section">
                                            <h3>
                                                Warehouse
                                                Stock
                                            </h3>

                                            <div className="products-stock-list">
                                                {selectedProduct.stocks.map(
                                                    (
                                                        stock
                                                    ) => (
                                                        <div
                                                            className="products-stock-item"
                                                            key={
                                                                stock._id
                                                            }
                                                        >
                                                            <div>
                                                                <strong>
                                                                    {stock
                                                                        .warehouse
                                                                        ?.name ||
                                                                        "-"}
                                                                </strong>

                                                                <span>
                                                                    {stock
                                                                        .branch
                                                                        ?.name ||
                                                                        "-"}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Quantity
                                                                </span>

                                                                <strong>
                                                                    {Number(
                                                                        stock.quantity ||
                                                                            0
                                                                    )}
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Reserved
                                                                </span>

                                                                <strong>
                                                                    {Number(
                                                                        stock.reservedQuantity ||
                                                                            0
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="products-empty">
                                    <FiPackage />
                                    <p>
                                        Product
                                        information
                                        unavailable.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="products-modal-footer">
                            <button
                                className="products-secondary-btn"
                                onClick={() =>
                                    setShowViewModal(
                                        false
                                    )
                                }
                            >
                                Close
                            </button>

                            {selectedProduct && (
                                <button
                                    className="products-primary-btn"
                                    onClick={() => {
                                        setShowViewModal(
                                            false
                                        );
                                        openEditModal(
                                            selectedProduct
                                        );
                                    }}
                                >
                                    <FiEdit2 />
                                    Edit Product
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                DELETE MODAL
            ========================================================= */}

            {showDeleteModal &&
                deleteProduct && (
                    <div className="products-modal-overlay">
                        <div className="products-modal products-delete-modal">
                            <div className="products-delete-icon">
                                <FiTrash2 />
                            </div>

                            <h2>
                                Delete Product?
                            </h2>

                            <p>
                                Are you sure you want
                                to delete{" "}
                                <strong>
                                    {
                                        deleteProduct.name
                                    }
                                </strong>
                                ?
                            </p>

                            <span className="products-delete-warning">
                                If active stock records
                                exist, the backend will
                                prevent deletion. You
                                can deactivate the
                                product instead.
                            </span>

                            <div className="products-modal-footer">
                                <button
                                    className="products-secondary-btn"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        formLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="products-danger-btn"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        formLoading
                                    }
                                >
                                    {formLoading ? (
                                        <>
                                            <span className="products-btn-spinner"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <FiTrash2 />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default Products;