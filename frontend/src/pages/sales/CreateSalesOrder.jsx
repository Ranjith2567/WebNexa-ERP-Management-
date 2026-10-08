import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiSearch,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/create-sales-order.css";

function CreateSalesOrder() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  // ==========================================
  // QUOTATION CONVERSION
  // ==========================================

 const quotationId =
  searchParams.get("quotationId");

  const [quotation, setQuotation] =
    useState(null);

  const [loadingQuotation, setLoadingQuotation] =
    useState(false);

  // ==========================================
  // MASTER DATA
  // ==========================================

  const [companies, setCompanies] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  // ==========================================
  // LOADING
  // ==========================================

  const [loading, setLoading] =
    useState(false);

  const [loadingData, setLoadingData] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] =
    useState({
      company: "",
      branch: "",
      customer: "",
      warehouse: "",

      orderDate:
        new Date()
          .toISOString()
          .split("T")[0],

      expectedDeliveryDate: "",

      notes: "",

      termsAndConditions: "",
    });

  // ==========================================
  // MANUAL TEXT VALUES
  // ==========================================

  const [companyText, setCompanyText] =
    useState("");

  const [branchText, setBranchText] =
    useState("");

  const [customerText, setCustomerText] =
    useState("");

  const [warehouseText, setWarehouseText] =
    useState("");

  // ==========================================
  // ORDER ITEMS
  // ==========================================

  const createEmptyItem = () => ({
    product: "",
    productText: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    taxPercent: 0,
  });

  const [items, setItems] = useState([
    createEmptyItem(),
  ]);
  // ==========================================
// BARCODE SCANNER
// ==========================================

const [barcodeValue, setBarcodeValue] =
  useState("");

const [barcodeLoading, setBarcodeLoading] =
  useState(false);
// ==========================================
// LOOKUP PRODUCT BY BARCODE
// ==========================================

const handleBarcodeLookup = async () => {
  const barcode = barcodeValue.trim();

  if (!barcode) {
    setError("Please enter or scan a barcode.");
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

    const productName =
      product.name ||
      product.productName ||
      product.sku ||
      "";

    const productDescription =
      product.description || "";

    const productPrice =
      Number(
        product.sellingPrice ??
          product.salePrice ??
          product.price ??
          0
      );

    if (!productId) {
      setError(
        "Product ID is missing."
      );
      return;
    }

    // Check whether product is already added
    const existingIndex = items.findIndex(
      (item) =>
        item.product === productId
    );

    if (existingIndex !== -1) {
      // Product already exists → increase quantity
      setItems((currentItems) =>
        currentItems.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity:
                    Number(item.quantity || 0) + 1,
                }
              : item
        )
      );
    } else {
      // Find an empty item row first
      const emptyIndex = items.findIndex(
        (item) => !item.product
      );

      if (emptyIndex !== -1) {
        setItems((currentItems) =>
          currentItems.map(
            (item, index) =>
              index === emptyIndex
                ? {
                    ...item,
                    product: productId,
                    productText: productName,
                    description:
                      productDescription,
                    quantity: 1,
                    unitPrice:
                      productPrice,
                    discountPercent: 0,
                    taxPercent: 0,
                  }
                : item
          )
        );
      } else {
        // No empty row → add new item
        setItems((currentItems) => [
          ...currentItems,
          {
            product: productId,
            productText: productName,
            description:
              productDescription,
            quantity: 1,
            unitPrice: productPrice,
            discountPercent: 0,
            taxPercent: 0,
          },
        ]);
      }
    }

    // Clear barcode after successful scan
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
  // ==========================================
  // LOAD MASTER DATA
  // ==========================================

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoadingData(true);
      setError("");

      const [
        companiesResponse,
        branchesResponse,
        customersResponse,
        warehousesResponse,
        productsResponse,
      ] = await Promise.all([
        api.get("/companies"),
        api.get("/branches"),
        api.get("/customers"),
        api.get("/warehouses"),
        api.get("/products"),
      ]);

      setCompanies(
        companiesResponse.data?.companies ||
          companiesResponse.data?.data ||
          []
      );

      setBranches(
        branchesResponse.data?.branches ||
          branchesResponse.data?.data ||
          []
      );

      setCustomers(
        customersResponse.data?.customers ||
          customersResponse.data?.data ||
          []
      );

      setWarehouses(
        warehousesResponse.data?.warehouses ||
          warehousesResponse.data?.data ||
          []
      );

      setProducts(
        productsResponse.data?.products ||
          productsResponse.data?.data ||
          []
      );
    } catch (err) {
      console.error(
        "Master data loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load company, branch, customer, warehouse or product data."
      );
    } finally {
      setLoadingData(false);
    }
  };

  // ==========================================
  // GET ID
  // ==========================================

  const getId = (item) => {
    return (
      item?._id ||
      item?.id ||
      ""
    );
  };

  // ==========================================
  // GET DISPLAY NAME
  // ==========================================

  const getName = (item) => {
    return (
      item?.name ||
      item?.companyName ||
      item?.customerName ||
      item?.warehouseName ||
      item?.productName ||
      item?.branchName ||
      item?.sku ||
      ""
    );
  };

  // ==========================================
  // GET SEARCHABLE VALUES
  // ==========================================

  const getSearchValues = (item) => {
    return [
      item?.name,
      item?.companyName,
      item?.customerName,
      item?.warehouseName,
      item?.productName,
      item?.branchName,
      item?.sku,
      item?.productCode,
      item?.code,
    ]
      .filter(Boolean)
      .map((value) =>
        String(value)
          .trim()
          .toLowerCase()
      );
  };

  // ==========================================
  // FIND ITEM BY TEXT
  // ==========================================

  const findItemByText = (
    list,
    text
  ) => {
    const value =
      String(text || "")
        .trim()
        .toLowerCase();

    if (!value) {
      return null;
    }

    const exactMatch =
      list.find((item) =>
        getSearchValues(item).includes(
          value
        )
      );

    return exactMatch || null;
  };

  // ==========================================
  // FILTERED BRANCHES
  // ==========================================

  const filteredBranches =
    useMemo(() => {
      if (!formData.company) {
        return branches;
      }

      return branches.filter(
        (branch) => {
          const branchCompany =
            branch.company?._id ||
            branch.company?.id ||
            branch.company;

          return (
            String(branchCompany) ===
            String(formData.company)
          );
        }
      );
    }, [
      branches,
      formData.company,
    ]);

  // ==========================================
  // FILTERED CUSTOMERS
  // ==========================================

  const filteredCustomers =
    useMemo(() => {
      return customers.filter(
        (customer) => {
          const customerCompany =
            customer.company?._id ||
            customer.company?.id ||
            customer.company;

          const customerBranch =
            customer.branch?._id ||
            customer.branch?.id ||
            customer.branch;

          const companyMatch =
            !formData.company ||
            String(customerCompany) ===
              String(formData.company);

          const branchMatch =
            !formData.branch ||
            String(customerBranch) ===
              String(formData.branch);

          return (
            companyMatch &&
            branchMatch
          );
        }
      );
    }, [
      customers,
      formData.company,
      formData.branch,
    ]);

  // ==========================================
  // FILTERED WAREHOUSES
  // ==========================================

  const filteredWarehouses =
    useMemo(() => {
      return warehouses.filter(
        (warehouse) => {
          const warehouseCompany =
            warehouse.company?._id ||
            warehouse.company?.id ||
            warehouse.company;

          const warehouseBranch =
            warehouse.branch?._id ||
            warehouse.branch?.id ||
            warehouse.branch;

          const companyMatch =
            !formData.company ||
            String(
              warehouseCompany
            ) ===
              String(formData.company);

          const branchMatch =
            !formData.branch ||
            String(
              warehouseBranch
            ) ===
              String(formData.branch);

          return (
            companyMatch &&
            branchMatch
          );
        }
      );
    }, [
      warehouses,
      formData.company,
      formData.branch,
    ]);

  // ==========================================
  // LOAD QUOTATION
  // ==========================================

  useEffect(() => {
    if (quotationId) {
      loadQuotation();
    }
  }, [quotationId]);

  const loadQuotation = async () => {
    try {
      setLoadingQuotation(true);
      setError("");

      const response =
        await api.get(
          `/quotations/${quotationId}`
        );

      const quotationData =
        response.data?.quotation;

      if (!quotationData) {
        setError(
          "Quotation not found."
        );
        return;
      }

      // ======================================
      // ONLY ACCEPTED QUOTATION
      // ======================================

      if (
        quotationData.status !==
        "ACCEPTED"
      ) {
        setError(
          "Only ACCEPTED quotations can be converted to Sales Order."
        );
        return;
      }

      // ======================================
      // PREVENT DUPLICATE CONVERSION
      // ======================================

      if (
        quotationData.convertedToSalesOrder
      ) {
        setError(
          "This quotation has already been converted to a Sales Order."
        );
        return;
      }

      setQuotation(
        quotationData
      );

      // ======================================
      // COMPANY
      // ======================================

      const company =
        quotationData.company;

      const companyId =
        getId(company);

      // ======================================
      // BRANCH
      // ======================================

      const branch =
        quotationData.branch;

      const branchId =
        getId(branch);

      // ======================================
      // CUSTOMER
      // ======================================

      const customer =
        quotationData.customer;

      const customerId =
        getId(customer);

      // ======================================
      // AUTO FILL FORM
      // ======================================

      setFormData((prev) => ({
        ...prev,

        company:
          companyId,

        branch:
          branchId,

        customer:
          customerId,

        warehouse:
          "",

        orderDate:
          new Date()
            .toISOString()
            .split("T")[0],

        expectedDeliveryDate:
          "",

        notes:
          quotationData.notes ||
          "",

        termsAndConditions:
          quotationData
            .termsAndConditions ||
          "",
      }));

      // ======================================
      // DISPLAY TEXT
      // ======================================

      setCompanyText(
        getName(company)
      );

      setBranchText(
        getName(branch)
      );

      setCustomerText(
        getName(customer)
      );

      // ======================================
      // CONVERT QUOTATION ITEMS
      // ======================================

      const quotationItems =
        quotationData.items || [];

      const convertedItems =
        quotationItems.map(
          (item) => {
            const product =
              item.product;

            return {
              product:
                getId(product),

              productText:
                getName(product),

              description:
                item.description ||
                getName(product),

              quantity:
                Number(
                  item.quantity
                ) || 1,

              unitPrice:
                Number(
                  item.unitPrice
                ) || 0,

              discountPercent:
                Number(
                  item.discountPercent
                ) || 0,

              taxPercent:
                Number(
                  item.taxPercent
                ) || 0,
            };
          }
        );

      setItems(
        convertedItems.length
          ? convertedItems
          : [createEmptyItem()]
      );
    } catch (err) {
      console.error(
        "Quotation loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load quotation."
      );
    } finally {
      setLoadingQuotation(false);
    }
  };

  // ==========================================
  // COMPANY
  // ==========================================

  const handleCompanyChange = (
    value
  ) => {
    setCompanyText(value);

    const selected =
      findItemByText(
        companies,
        value
      );

    const companyId =
      selected
        ? getId(selected)
        : "";

    setFormData((prev) => ({
      ...prev,

      company:
        companyId,

      branch: "",

      customer: "",

      warehouse: "",
    }));

    setBranchText("");
    setCustomerText("");
    setWarehouseText("");
  };

  // ==========================================
  // BRANCH
  // ==========================================

  const handleBranchChange = (
    value
  ) => {
    setBranchText(value);

    const selected =
      findItemByText(
        filteredBranches,
        value
      );

    const branchId =
      selected
        ? getId(selected)
        : "";

    setFormData((prev) => ({
      ...prev,

      branch:
        branchId,

      customer: "",

      warehouse: "",
    }));

    setCustomerText("");
    setWarehouseText("");
  };

  // ==========================================
  // CUSTOMER
  // ==========================================

  const handleCustomerChange = (
    value
  ) => {
    setCustomerText(value);

    const selected =
      findItemByText(
        filteredCustomers,
        value
      );

    setFormData((prev) => ({
      ...prev,

      customer:
        selected
          ? getId(selected)
          : "",
    }));
  };

  // ==========================================
  // WAREHOUSE
  // ==========================================

  const handleWarehouseChange = (
    value
  ) => {
    setWarehouseText(value);

    const selected =
      findItemByText(
        filteredWarehouses,
        value
      );

    setFormData((prev) => ({
      ...prev,

      warehouse:
        selected
          ? getId(selected)
          : "",
    }));
  };

  // ==========================================
  // NORMAL FORM CHANGE
  // ==========================================

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

  // ==========================================
  // PRODUCT CHANGE
  // ==========================================

  const handleProductChange = (
    index,
    value
  ) => {
    setItems((prev) => {
      const updatedItems = [
        ...prev,
      ];

      updatedItems[index] = {
        ...updatedItems[index],

        productText:
          value,
      };

      const selectedProduct =
        findItemByText(
          products,
          value
        );

      if (selectedProduct) {
        updatedItems[index].product =
          getId(
            selectedProduct
          );

        updatedItems[index]
          .description =
          selectedProduct.description ||
          selectedProduct.name ||
          selectedProduct.productName ||
          "";

        updatedItems[index]
          .unitPrice =
          selectedProduct.sellingPrice ??
          selectedProduct.salePrice ??
          selectedProduct.price ??
          selectedProduct.selling_price ??
          0;
      } else {
        updatedItems[index]
          .product = "";
      }

      return updatedItems;
    });
  };

  // ==========================================
  // PRODUCT BLUR
  // ==========================================

  const handleProductBlur = (
    index
  ) => {
    setItems((prev) => {
      const updatedItems = [
        ...prev,
      ];

      const text =
        updatedItems[index]
          .productText;

      const selectedProduct =
        findItemByText(
          products,
          text
        );

      if (selectedProduct) {
        updatedItems[index].product =
          getId(
            selectedProduct
          );

        updatedItems[index]
          .description =
          selectedProduct.description ||
          selectedProduct.name ||
          selectedProduct.productName ||
          "";

        // Only change price when
        // product was manually selected.
        //
        // Quotation converted items already
        // contain quotation price.
        if (
          !quotationId
        ) {
          updatedItems[index]
            .unitPrice =
            selectedProduct.sellingPrice ??
            selectedProduct.salePrice ??
            selectedProduct.price ??
            selectedProduct.selling_price ??
            0;
        }
      }

      return updatedItems;
    });
  };

  // ==========================================
  // ITEM CHANGE
  // ==========================================

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setItems((prev) => {
      const updatedItems = [
        ...prev,
      ];

      updatedItems[index] = {
        ...updatedItems[index],

        [field]: value,
      };

      return updatedItems;
    });
  };

  // ==========================================
  // ADD ITEM
  // ==========================================

  const addItem = () => {
    setItems((prev) => [
      ...prev,

      createEmptyItem(),
    ]);
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================

  const removeItem = (
    index
  ) => {
    if (items.length === 1) {
      return;
    }

    setItems((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  // ==========================================
  // CALCULATE ITEM
  // ==========================================

  const calculateItem = (
    item
  ) => {
    const quantity =
      Number(
        item.quantity
      ) || 0;

    const unitPrice =
      Number(
        item.unitPrice
      ) || 0;

    const discountPercent =
      Number(
        item.discountPercent
      ) || 0;

    const taxPercent =
      Number(
        item.taxPercent
      ) || 0;

    const gross =
      quantity *
      unitPrice;

    const discountAmount =
      gross *
      (discountPercent / 100);

    const taxableAmount =
      gross -
      discountAmount;

    const taxAmount =
      taxableAmount *
      (taxPercent / 100);

    const lineTotal =
      taxableAmount +
      taxAmount;

    return {
      gross,

      discountAmount,

      taxableAmount,

      taxAmount,

      lineTotal,
    };
  };

  // ==========================================
  // TOTALS
  // ==========================================

  const totals =
    useMemo(() => {
      let subtotal = 0;

      let discountAmount = 0;

      let taxAmount = 0;

      let totalAmount = 0;

      items.forEach(
        (item) => {
          const calculated =
            calculateItem(
              item
            );

          subtotal +=
            calculated.gross;

          discountAmount +=
            calculated.discountAmount;

          taxAmount +=
            calculated.taxAmount;

          totalAmount +=
            calculated.lineTotal;
        }
      );

      return {
        subtotal,

        discountAmount,

        taxAmount,

        totalAmount,
      };
    }, [items]);

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setError("");

      // ======================================
      // RESOLVE FINAL MASTER DATA
      // ======================================

      const selectedCompany =
        findItemByText(
          companies,
          companyText
        );

      const selectedBranch =
        findItemByText(
          filteredBranches,
          branchText
        );

      const selectedCustomer =
        findItemByText(
          filteredCustomers,
          customerText
        );

      const selectedWarehouse =
        findItemByText(
          filteredWarehouses,
          warehouseText
        );

      const finalCompany =
        selectedCompany
          ? getId(
              selectedCompany
            )
          : formData.company;

      const finalBranch =
        selectedBranch
          ? getId(
              selectedBranch
            )
          : formData.branch;

      const finalCustomer =
        selectedCustomer
          ? getId(
              selectedCustomer
            )
          : formData.customer;

      const finalWarehouse =
        selectedWarehouse
          ? getId(
              selectedWarehouse
            )
          : formData.warehouse;

      // ======================================
      // VALIDATION
      // ======================================

      if (!finalCompany) {
        setError(
          "Please select or enter a valid company."
        );
        return;
      }

      if (!finalBranch) {
        setError(
          "Please select or enter a valid branch."
        );
        return;
      }

      if (!finalCustomer) {
        setError(
          "Please select or enter a valid customer."
        );
        return;
      }

      if (!finalWarehouse) {
        setError(
          "Please select or enter a valid warehouse."
        );
        return;
      }

      if (!items.length) {
        setError(
          "Please add at least one product."
        );
        return;
      }

      // ======================================
      // RESOLVE PRODUCTS
      // ======================================

      const finalItems =
        items.map((item) => {
          const selectedProduct =
            findItemByText(
              products,
              item.productText
            );

          return {
            ...item,

            product:
              selectedProduct
                ? getId(
                    selectedProduct
                  )
                : item.product,
          };
        });

      const invalidItem =
        finalItems.find(
          (item) =>
            !item.product ||
            Number(
              item.quantity
            ) <= 0 ||
            Number(
              item.unitPrice
            ) < 0
        );

      if (invalidItem) {
        setError(
          "Please type/select an existing product and enter valid quantity and price."
        );
        return;
      }

      // ======================================
      // QUOTATION SAFETY CHECK
      // ======================================

      if (quotationId) {
        if (!quotation) {
          setError(
            "Quotation data is not loaded."
          );
          return;
        }

        if (
          quotation.status !==
          "ACCEPTED"
        ) {
          setError(
            "Only ACCEPTED quotations can be converted to Sales Order."
          );
          return;
        }

        if (
          quotation.convertedToSalesOrder
        ) {
          setError(
            "This quotation has already been converted to a Sales Order."
          );
          return;
        }
      }

      // ======================================
      // CREATE SALES ORDER
      // ======================================

      try {
        setLoading(true);

        const payload = {
          company:
            finalCompany,

          branch:
            finalBranch,

          customer:
            finalCustomer,

          warehouse:
            finalWarehouse,

          orderDate:
            formData.orderDate,

          expectedDeliveryDate:
            formData
              .expectedDeliveryDate ||
            null,

          // ==================================
          // ALWAYS DRAFT
          // ==================================

          status:
            "DRAFT",

          // ==================================
          // QUOTATION REFERENCE
          // ==================================

          ...(quotationId
            ? {
                quotation:
                  quotationId,
              }
            : {}),

          // ==================================
          // ITEMS
          // ==================================

          items:
            finalItems.map(
              (item) => ({
                product:
                  item.product,

                description:
                  item.description,

                quantity:
                  Number(
                    item.quantity
                  ),

                unitPrice:
                  Number(
                    item.unitPrice
                  ),

                discountPercent:
                  Number(
                    item.discountPercent
                  ) || 0,

                taxPercent:
                  Number(
                    item.taxPercent
                  ) || 0,
              })
            ),

          // ==================================
          // ADDITIONAL
          // ==================================

          notes:
            formData.notes,

          termsAndConditions:
            formData
              .termsAndConditions,
        };

        console.log(
          quotationId
            ? "Quotation Conversion Sales Order Payload:"
            : "New Sales Order Payload:",
          payload
        );

        const response =
          await api.post(
            "/sales-orders",
            payload
          );

        if (
          response.data?.success
        ) {
          // =================================
          // SUCCESS
          // =================================

          navigate(
            "/sales/orders"
          );
        } else {
          setError(
            response.data
              ?.message ||
              "Sales order creation failed."
          );
        }
      } catch (err) {
        console.error(
          "Create sales order error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Failed to create sales order."
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="create-sales-order-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="create-sales-order-header">

        <div>

          <Link
            to="/sales/orders"
            className="back-to-orders"
          >
            <FiArrowLeft />

            <span>
              Back to Sales Orders
            </span>
          </Link>

          <h1>
            {quotationId
              ? "Convert Quotation to Sales Order"
              : "Create Sales Order"}
          </h1>

          <p>
            {quotationId
              ? `Create a sales order from ${
                  quotation?.quotationNumber ||
                  "quotation"
                }`
              : "Create a new customer sales order"}
          </p>

        </div>

      </div>

      {/* =====================================
          QUOTATION INFO
      ===================================== */}

      {quotationId &&
        quotation && (
          <div
            className="sales-order-card"
            style={{
              marginBottom:
                "20px",
            }}
          >
            <div
              className="sales-order-card-header"
            >
              <div>
                <h2
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "8px",
                  }}
                >
                  <FiFileText />

                  Quotation Conversion
                </h2>

                <p>
                  Converting quotation{" "}
                  <strong>
                    {
                      quotation.quotationNumber
                    }
                  </strong>{" "}
                  into a new Sales Order.
                </p>
              </div>

              <span
                style={{
                  display: "inline-flex",
                  alignItems:
                    "center",
                  padding:
                    "6px 12px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(34,197,94,0.12)",
                  color:
                    "#4ade80",
                  fontSize:
                    "12px",
                  fontWeight:
                    "600",
                }}
              >
                ACCEPTED
              </span>
            </div>
          </div>
        )}

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="sales-order-error">
          {error}
        </div>
      )}

      {/* =====================================
          LOADING QUOTATION
      ===================================== */}

      {loadingQuotation && (
        <div className="sales-order-card">
          <div
            style={{
              padding: "25px",
              textAlign:
                "center",
              color:
                "#94a3b8",
            }}
          >
            Loading quotation...
          </div>
        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
      >

        {/* =================================
            ORDER INFORMATION
        ================================= */}

        <section className="sales-order-card">

          <div className="sales-order-card-header">

            <div>

              <h2>
                Order Information
              </h2>

              <p>
                {quotationId
                  ? "Quotation details have been loaded automatically"
                  : "Select or type the company, branch and customer"}
              </p>

            </div>

          </div>

          <div className="sales-order-form-grid">

            {/* COMPANY */}

            <div className="form-group">

              <label>
                Company{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                list="companies-list"
                value={
                  companyText
                }
                onChange={(e) =>
                  handleCompanyChange(
                    e.target.value
                  )
                }
                placeholder="Select or type company"
                autoComplete="off"
                readOnly={
                  !!quotationId
                }
              />

              <datalist
                id="companies-list"
              >
                {companies.map(
                  (company) => (
                    <option
                      key={getId(
                        company
                      )}
                      value={getName(
                        company
                      )}
                    />
                  )
                )}
              </datalist>

            </div>

            {/* BRANCH */}

            <div className="form-group">

              <label>
                Branch{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                list="branches-list"
                value={
                  branchText
                }
                onChange={(e) =>
                  handleBranchChange(
                    e.target.value
                  )
                }
                placeholder="Select or type branch"
                autoComplete="off"
                readOnly={
                  !!quotationId
                }
              />

              <datalist
                id="branches-list"
              >
                {filteredBranches.map(
                  (branch) => (
                    <option
                      key={getId(
                        branch
                      )}
                      value={getName(
                        branch
                      )}
                    />
                  )
                )}
              </datalist>

            </div>

            {/* CUSTOMER */}

            <div className="form-group">

              <label>
                Customer{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                list="customers-list"
                value={
                  customerText
                }
                onChange={(e) =>
                  handleCustomerChange(
                    e.target.value
                  )
                }
                placeholder="Select or type customer"
                autoComplete="off"
                readOnly={
                  !!quotationId
                }
              />

              <datalist
                id="customers-list"
              >
                {filteredCustomers.map(
                  (customer) => (
                    <option
                      key={getId(
                        customer
                      )}
                      value={getName(
                        customer
                      )}
                    />
                  )
                )}
              </datalist>

            </div>

            {/* WAREHOUSE */}

            <div className="form-group">

              <label>
                Warehouse{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                list="warehouses-list"
                value={
                  warehouseText
                }
                onChange={(e) =>
                  handleWarehouseChange(
                    e.target.value
                  )
                }
                placeholder="Select or type warehouse"
                autoComplete="off"
              />

              <datalist
                id="warehouses-list"
              >
                {filteredWarehouses.map(
                  (warehouse) => (
                    <option
                      key={getId(
                        warehouse
                      )}
                      value={getName(
                        warehouse
                      )}
                    />
                  )
                )}
              </datalist>

            </div>

            {/* ORDER DATE */}

            <div className="form-group">

              <label>
                Order Date{" "}
                <span>*</span>
              </label>

              <input
                type="date"
                name="orderDate"
                value={
                  formData.orderDate
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* EXPECTED DELIVERY */}

            <div className="form-group">

              <label>
                Expected Delivery Date
              </label>

              <input
                type="date"
                name="expectedDeliveryDate"
                value={
                  formData
                    .expectedDeliveryDate
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>

        </section>

        {/* =================================
            ORDER ITEMS
        ================================= */}

        <section className="sales-order-card">

          <div className="sales-order-card-header order-items-header">

            <div>

              <h2>
                Order Items
              </h2>

              <p>
                {quotationId
                  ? "Items copied from the accepted quotation"
                  : "Add products to this sales order"}
              </p>

            </div>
                {/* ==========================================
      BARCODE SCANNER
  ========================================== */}

  <div className="sales-order-barcode">
    <div className="sales-order-barcode-header">
      <label htmlFor="sales-order-barcode-input">
        Scan Barcode
      </label>

      <span>
        Scan or enter product barcode
      </span>
    </div>

    <div className="sales-order-barcode-input">
      <input
        id="sales-order-barcode-input"
        type="text"
        value={barcodeValue}
        onChange={(e) =>
          setBarcodeValue(e.target.value)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleBarcodeLookup();
          }
        }}
        placeholder="Scan or enter barcode"
        disabled={barcodeLoading}
      />

      <button
        type="button"
        onClick={handleBarcodeLookup}
        disabled={
          barcodeLoading ||
          !barcodeValue.trim()
        }
        title="Lookup barcode"
      >
        <FiSearch />

        {barcodeLoading
          ? "Searching..."
          : "Search"}
      </button>
    </div>
  </div>
            <button
              type="button"
              className="add-item-button"
              onClick={
                addItem
              }
            >
              <FiPlus />

              Add Item
            </button>

          </div>

          <div className="order-items-container">

            {items.map(
              (
                item,
                index
              ) => {

                const calculated =
                  calculateItem(
                    item
                  );

                return (
                  <div
                    className="order-item-row"
                    key={index}
                  >

                    {/* PRODUCT */}

                    <div className="form-group product-field">

                      <label>
                        Product{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="text"
                        list={`products-list-${index}`}
                        value={
                          item.productText
                        }
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            e.target.value
                          )
                        }
                        onBlur={() =>
                          handleProductBlur(
                            index
                          )
                        }
                        placeholder="Select or type product"
                        autoComplete="off"
                      />

                      <datalist
                        id={`products-list-${index}`}
                      >
                        {products.map(
                          (
                            product
                          ) => (
                            <option
                              key={getId(
                                product
                              )}
                              value={getName(
                                product
                              )}
                            />
                          )
                        )}
                      </datalist>

                    </div>

                    {/* DESCRIPTION */}

                    <div className="form-group">

                      <label>
                        Description
                      </label>

                      <input
                        type="text"
                        value={
                          item.description
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Product description"
                      />

                    </div>

                    {/* QUANTITY */}

                    <div className="form-group">

                      <label>
                        Qty
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    {/* UNIT PRICE */}

                    <div className="form-group">

                      <label>
                        Unit Price
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.unitPrice
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    {/* DISCOUNT */}

                    <div className="form-group">

                      <label>
                        Discount %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          item.discountPercent
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "discountPercent",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    {/* TAX */}

                    <div className="form-group">

                      <label>
                        Tax %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          item.taxPercent
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "taxPercent",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    {/* TOTAL */}

                    <div className="form-group line-total-field">

                      <label>
                        Total
                      </label>

                      <div className="line-total">
                        ₹
                        {calculated.lineTotal.toFixed(
                          2
                        )}
                      </div>

                    </div>

                    {/* DELETE */}

                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() =>
                        removeItem(
                          index
                        )
                      }
                      disabled={
                        items.length ===
                        1
                      }
                      title="Remove item"
                    >
                      <FiTrash2 />
                    </button>

                  </div>
                );
              }
            )}

          </div>

          {/* =================================
              TOTALS
          ================================= */}

          <div className="sales-order-totals">

            <div className="total-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {totals.subtotal.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="total-row">

              <span>
                Discount
              </span>

              <strong>
                ₹
                {totals.discountAmount.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="total-row">

              <span>
                Tax
              </span>

              <strong>
                ₹
                {totals.taxAmount.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="total-row grand-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {totals.totalAmount.toFixed(
                  2
                )}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================
            ADDITIONAL INFORMATION
        ================================= */}

        <section className="sales-order-card">

          <div className="sales-order-card-header">

            <div>

              <h2>
                Additional Information
              </h2>

              <p>
                Add notes and terms if required
              </p>

            </div>

          </div>

          <div className="sales-order-form-grid">

            {/* NOTES */}

            <div className="form-group full-width">

              <label>
                Notes
              </label>

              <textarea
                name="notes"
                value={
                  formData.notes
                }
                onChange={
                  handleChange
                }
                placeholder="Enter notes..."
                rows="4"
              />

            </div>

            {/* TERMS */}

            <div className="form-group full-width">

              <label>
                Terms & Conditions
              </label>

              <textarea
                name="termsAndConditions"
                value={
                  formData
                    .termsAndConditions
                }
                onChange={
                  handleChange
                }
                placeholder="Enter terms and conditions..."
                rows="4"
              />

            </div>

          </div>

        </section>

        {/* =================================
            ACTIONS
        ================================= */}

        <div className="sales-order-actions">

          <Link
            to="/sales/orders"
            className="cancel-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="save-order-button"
            disabled={
              loading ||
              loadingData ||
              loadingQuotation
            }
          >
            {loading
              ? "Creating..."
              : quotationId
              ? "Convert to Sales Order"
              : "Create Sales Order"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default CreateSalesOrder;