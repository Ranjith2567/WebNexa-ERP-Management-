import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/create-quotation.css";

function CreateQuotation() {
  const navigate = useNavigate();

  // =========================
  // MASTER DATA
  // =========================

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // =========================
  // FORM DATA
  // =========================

  const [formData, setFormData] = useState({
    company: "",
    branch: "",
    quotationDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    customer: "",
    salesPerson: "",
    notes: "",
    termsAndConditions: "",
  });

  // =========================
  // ITEMS
  // =========================

  const [items, setItems] = useState([
    {
      product: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 0,
    },
  ]);

  // =========================
  // LOAD INITIAL DATA
  // =========================

  useEffect(() => {
    loadMasterData();
  }, []);

  // =========================
  // LOAD MASTER DATA
  // =========================

  const loadMasterData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        companiesResponse,
        branchesResponse,
        customersResponse,
        usersResponse,
      ] = await Promise.all([
        api.get("/companies"),
        api.get("/branches"),
        api.get("/customers"),
        api.get("/users"),
      ]);

      const companiesData =
        companiesResponse.data?.companies ||
        companiesResponse.data?.data ||
        [];

      const branchesData =
        branchesResponse.data?.branches ||
        branchesResponse.data?.data ||
        [];

      const customersData =
        customersResponse.data?.customers ||
        customersResponse.data?.data ||
        [];

      const usersData =
        usersResponse.data?.users ||
        usersResponse.data?.data ||
        [];

      setCompanies(companiesData);
      setBranches(branchesData);
      setCustomers(customersData);
      setUsers(usersData);

      // Select first active company
      if (companiesData.length > 0) {
        const activeCompany =
          companiesData.find(
            (company) => company.isActive !== false
          ) || companiesData[0];

        setFormData((prev) => ({
          ...prev,
          company: activeCompany._id,
        }));

        // Load products for selected company
        await loadProductsByCompany(activeCompany._id);
      }
    } catch (err) {
      console.error(
        "Failed to load quotation master data:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load quotation data."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD PRODUCTS BY COMPANY
  // =========================

  const loadProductsByCompany = async (companyId) => {
    try {
      if (!companyId) {
        setProducts([]);
        return;
      }

      setLoadingProducts(true);
      setError("");

      const response = await api.get("/products", {
        params: {
          company: companyId,
          isActive: true,
          page: 1,
          limit: 100,
        },
      });

      const productsData =
        response.data?.products ||
        response.data?.data ||
        [];

      setProducts(productsData);
    } catch (err) {
      console.error(
        "Failed to load products:",
        err
      );

      setProducts([]);

      setError(
        err.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================
  // COMPANY CHANGE
  // =========================

  useEffect(() => {
    if (!formData.company) {
      setProducts([]);
      return;
    }

    loadProductsByCompany(formData.company);

    // Reset dependent fields
    setFormData((prev) => ({
      ...prev,
      branch: "",
      customer: "",
      salesPerson: "",
    }));

    setItems([
      {
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
      },
    ]);
  }, [formData.company]);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // PRODUCT CHANGE
  // =========================

  const handleProductChange = (
    index,
    productId
  ) => {
    const selectedProduct = products.find(
      (product) => product._id === productId
    );

    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const price =
          selectedProduct?.sellingPrice ??
          selectedProduct?.salePrice ??
          selectedProduct?.selling_price ??
          selectedProduct?.price ??
          0;

        const description =
          selectedProduct?.description ||
          selectedProduct?.name ||
          selectedProduct?.productName ||
          "";

        return {
          ...item,
          product: productId,
          description,
          unitPrice: Number(price) || 0,
        };
      })
    );
  };

  // =========================
  // ITEM CHANGE
  // =========================

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // =========================
  // ADD ITEM
  // =========================

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
      },
    ]);
  };

  // =========================
  // REMOVE ITEM
  // =========================

  const removeItem = (index) => {
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

  // =========================
  // CALCULATE ITEM
  // =========================

  const calculateItem = (item) => {
    const quantity =
      Number(item.quantity) || 0;

    const unitPrice =
      Number(item.unitPrice) || 0;

    const discountPercent =
      Number(item.discountPercent) || 0;

    const taxPercent =
      Number(item.taxPercent) || 0;

    const gross =
      quantity * unitPrice;

    const discountAmount =
      gross * (discountPercent / 100);

    const taxableAmount =
      gross - discountAmount;

    const taxAmount =
      taxableAmount * (taxPercent / 100);

    const lineTotal =
      taxableAmount + taxAmount;

    return {
      gross,
      discountAmount,
      taxableAmount,
      taxAmount,
      lineTotal,
    };
  };

  // =========================
  // TOTALS
  // =========================

  const quotationTotals = items.reduce(
    (total, item) => {
      const calculated =
        calculateItem(item);

      total.subtotal +=
        calculated.gross;

      total.discount +=
        calculated.discountAmount;

      total.taxable +=
        calculated.taxableAmount;

      total.tax +=
        calculated.taxAmount;

      total.total +=
        calculated.lineTotal;

      return total;
    },
    {
      subtotal: 0,
      discount: 0,
      taxable: 0,
      tax: 0,
      total: 0,
    }
  );

  // =========================
  // VALIDATION
  // =========================

  const validateForm = () => {
    if (!formData.company) {
      return "Please select a company.";
    }

    if (!formData.branch) {
      return "Please select a branch.";
    }

    if (!formData.quotationDate) {
      return "Quotation date is required.";
    }

    if (!formData.validUntil) {
      return "Valid until date is required.";
    }

    if (
      new Date(formData.validUntil) <
      new Date(formData.quotationDate)
    ) {
      return "Valid until date cannot be before quotation date.";
    }

    if (!formData.customer) {
      return "Please select a customer.";
    }

    if (!items.length) {
      return "Please add at least one item.";
    }

    const selectedProducts = new Set();

    for (
      let i = 0;
      i < items.length;
      i++
    ) {
      const item = items[i];

      if (!item.product) {
        return `Please select a product for item ${
          i + 1
        }.`;
      }

      if (
        selectedProducts.has(item.product)
      ) {
        return "Same product cannot be added more than once.";
      }

      selectedProducts.add(item.product);

      if (
        Number(item.quantity) <= 0
      ) {
        return `Quantity must be greater than 0 for item ${
          i + 1
        }.`;
      }

      if (
        Number(item.unitPrice) < 0
      ) {
        return `Unit price cannot be negative for item ${
          i + 1
        }.`;
      }

      if (
        Number(item.discountPercent) < 0 ||
        Number(item.discountPercent) > 100
      ) {
        return `Discount must be between 0 and 100 for item ${
          i + 1
        }.`;
      }

      if (
        Number(item.taxPercent) < 0 ||
        Number(item.taxPercent) > 100
      ) {
        return `Tax must be between 0 and 100 for item ${
          i + 1
        }.`;
      }
    }

    return "";
  };

  // =========================
  // CREATE QUOTATION
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        company: formData.company,
        branch: formData.branch,
        quotationDate:
          formData.quotationDate,
        validUntil:
          formData.validUntil,
        customer: formData.customer,

        // Backend expects User ObjectId or null
        salesPerson:
          formData.salesPerson || null,

        items: items.map((item) => ({
          product: item.product,
          description:
            item.description,
          quantity:
            Number(item.quantity),
          unitPrice:
            Number(item.unitPrice),
          discountPercent:
            Number(
              item.discountPercent
            ),
          taxPercent:
            Number(item.taxPercent),
        })),

        notes: formData.notes,

        termsAndConditions:
          formData.termsAndConditions,

        status: "DRAFT",
      };

      const response =
        await api.post(
          "/quotations",
          payload
        );

      const createdQuotation =
        response.data?.quotation;

      if (createdQuotation?._id) {
        navigate(
          `/sales/quotations/${createdQuotation._id}`
        );
      } else {
        navigate(
          "/sales/quotations"
        );
      }
    } catch (err) {
      console.error(
        "Create quotation error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create quotation."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // FILTER BRANCHES
  // =========================

  const filteredBranches =
    branches.filter((branch) => {
      const branchCompany =
        branch.company?._id ||
        branch.company;

      return (
        branchCompany ===
        formData.company
      );
    });

  // =========================
  // FILTER CUSTOMERS
  // =========================

  const filteredCustomers =
    customers.filter((customer) => {
      const customerCompany =
        customer.company?._id ||
        customer.company;

      return (
        customerCompany ===
        formData.company
      );
    });

  // =========================
  // FILTER USERS
  // =========================

  const activeUsers =
    users.filter(
      (user) =>
        user.isActive !== false
    );

  // =========================
  // PRODUCTS
  // =========================

  const filteredProducts = products;

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="create-quotation-page">
        <div className="create-quotation-loader">
          <div className="quotation-spinner"></div>

          <p>
            Loading quotation data...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="create-quotation-page">

      {/* =========================
          HEADER
      ========================== */}

      <div className="quotation-page-header">

        <div className="quotation-title-row">

          <FiFileText />

          <div>
            <h1>
              Create Quotation
            </h1>

            <p>
              Create a new sales quotation
            </p>
          </div>

        </div>

        <Link
          to="/sales/quotations"
          className="quotation-back-btn"
        >
          <FiArrowLeft />

          Back to Quotations
        </Link>

      </div>

      {/* =========================
          ERROR
      ========================== */}

      {error && (
        <div className="quotation-error">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
      >

        {/* =========================
            QUOTATION INFORMATION
        ========================== */}

        <div className="quotation-card">

          <div className="quotation-card-header">

            <div>
              <h2>
                Quotation Information
              </h2>

              <p>
                Enter the basic quotation details
              </p>
            </div>

          </div>

          <div className="quotation-form-grid">

            {/* COMPANY */}

            <div className="quotation-field">

              <label>
                Company <span>*</span>
              </label>

              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Company
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company._id}
                      value={company._id}
                    >
                      {company.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* BRANCH */}

            <div className="quotation-field">

              <label>
                Branch <span>*</span>
              </label>

              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                disabled={
                  !formData.company
                }
              >

                <option value="">
                  Select Branch
                </option>

                {filteredBranches.map(
                  (branch) => (
                    <option
                      key={branch._id}
                      value={branch._id}
                    >
                      {branch.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* QUOTATION DATE */}

            <div className="quotation-field">

              <label>
                Quotation Date{" "}
                <span>*</span>
              </label>

              <input
                type="date"
                name="quotationDate"
                value={
                  formData.quotationDate
                }
                onChange={handleChange}
                required
              />

            </div>

            {/* VALID UNTIL */}

            <div className="quotation-field">

              <label>
                Valid Until <span>*</span>
              </label>

              <input
                type="date"
                name="validUntil"
                value={
                  formData.validUntil
                }
                onChange={handleChange}
                min={
                  formData.quotationDate
                }
                required
              />

            </div>

            {/* CUSTOMER */}

            <div className="quotation-field">

              <label>
                Customer <span>*</span>
              </label>

              <select
                name="customer"
                value={
                  formData.customer
                }
                onChange={handleChange}
                required
                disabled={
                  !formData.company
                }
              >

                <option value="">
                  Select Customer
                </option>

                {filteredCustomers.map(
                  (customer) => (
                    <option
                      key={customer._id}
                      value={customer._id}
                    >
                      {customer.customerCode
                        ? `${customer.customerCode} - `
                        : ""}
                      {customer.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* SALES PERSON */}

            <div className="quotation-field">

              <label>
                Sales Person
              </label>

              <select
                name="salesPerson"
                value={
                  formData.salesPerson
                }
                onChange={handleChange}
              >

                <option value="">
                  Select Sales Person
                </option>

                {activeUsers.map(
                  (user) => (
                    <option
                      key={user._id}
                      value={user._id}
                    >
                      {user.name ||
                        user.fullName ||
                        user.username ||
                        user.email ||
                        "Unnamed User"}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </div>

        {/* =========================
            QUOTATION ITEMS
        ========================== */}

        <div className="quotation-card">

          <div className="quotation-card-header quotation-items-header">

            <div>

              <h2>
                Quotation Items
              </h2>

              <p>
                Add products and pricing details
              </p>

            </div>

            <button
              type="button"
              className="quotation-add-item-btn"
              onClick={addItem}
            >
              <FiPlus />

              Add Item
            </button>

          </div>

          {/* PRODUCT LOADING */}

          {loadingProducts && (
            <div
              style={{
                padding: "12px 0",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              Loading products...
            </div>
          )}

          {/* NO PRODUCTS */}

          {!loadingProducts &&
            filteredProducts.length === 0 && (
              <div
                style={{
                  padding: "18px",
                  marginBottom: "15px",
                  borderRadius: "10px",
                  background:
                    "rgba(245, 158, 11, 0.08)",
                  border:
                    "1px solid rgba(245, 158, 11, 0.2)",
                  color: "#fbbf24",
                  fontSize: "13px",
                }}
              >
                No active products found
                for the selected company.
              </div>
            )}

          <div className="quotation-items-wrapper">

            {items.map(
              (item, index) => {

                const calculated =
                  calculateItem(item);

                return (
                  <div
                    className="quotation-item"
                    key={index}
                  >

                    {/* ITEM NUMBER */}

                    <div className="quotation-item-number">
                      {index + 1}
                    </div>

                    <div className="quotation-item-content">

                      <div className="quotation-item-grid">

                        {/* PRODUCT */}

                        <div className="quotation-field quotation-product-field">

                          <label>
                            Product{" "}
                            <span>*</span>
                          </label>

                          <select
                            value={
                              item.product
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                e.target.value
                              )
                            }
                            required
                            disabled={
                              loadingProducts ||
                              !formData.company
                            }
                          >

                            <option value="">
                              {loadingProducts
                                ? "Loading Products..."
                                : "Select Product"}
                            </option>

                            {filteredProducts.map(
                              (product) => (
                                <option
                                  key={
                                    product._id
                                  }
                                  value={
                                    product._id
                                  }
                                >
                                  {product.name ||
                                    product.productName ||
                                    product.sku ||
                                    "Unnamed Product"}
                                </option>
                              )
                            )}

                          </select>

                        </div>

                        {/* DESCRIPTION */}

                        <div className="quotation-field">

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

                        <div className="quotation-field">

                          <label>
                            Quantity{" "}
                            <span>*</span>
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
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
                            required
                          />

                        </div>

                        {/* UNIT PRICE */}

                        <div className="quotation-field">

                          <label>
                            Unit Price{" "}
                            <span>*</span>
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
                            required
                          />

                        </div>

                        {/* DISCOUNT */}

                        <div className="quotation-field">

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

                        <div className="quotation-field">

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

                      </div>

                      {/* ITEM SUMMARY */}

                      <div className="quotation-item-summary">

                        <div>
                          <span>
                            Gross
                          </span>

                          <strong>
                            ₹
                            {calculated.gross.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Discount
                          </span>

                          <strong>
                            ₹
                            {calculated.discountAmount.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Tax
                          </span>

                          <strong>
                            ₹
                            {calculated.taxAmount.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div className="item-total">

                          <span>
                            Line Total
                          </span>

                          <strong>
                            ₹
                            {calculated.lineTotal.toFixed(
                              2
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* REMOVE */}

                    <button
                      type="button"
                      className="quotation-remove-item"
                      onClick={() =>
                        removeItem(index)
                      }
                      disabled={
                        items.length === 1
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

        </div>

        {/* =========================
            NOTES + TERMS
        ========================== */}

        <div className="quotation-bottom-grid">

          {/* NOTES */}

          <div className="quotation-card">

            <div className="quotation-card-header">

              <div>

                <h2>
                  Notes
                </h2>

                <p>
                  Additional notes for this quotation
                </p>

              </div>

            </div>

            <textarea
              name="notes"
              value={
                formData.notes
              }
              onChange={handleChange}
              placeholder="Enter notes..."
              rows="5"
            />

          </div>

          {/* TERMS */}

          <div className="quotation-card">

            <div className="quotation-card-header">

              <div>

                <h2>
                  Terms & Conditions
                </h2>

                <p>
                  Terms applicable to this quotation
                </p>

              </div>

            </div>

            <textarea
              name="termsAndConditions"
              value={
                formData.termsAndConditions
              }
              onChange={handleChange}
              placeholder="Enter terms and conditions..."
              rows="5"
            />

          </div>

        </div>

        {/* =========================
            TOTALS
        ========================== */}

        <div className="quotation-card quotation-totals-card">

          <div className="quotation-totals">

            <div className="quotation-total-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {quotationTotals.subtotal.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="quotation-total-row">

              <span>
                Discount
              </span>

              <strong className="discount-value">
                - ₹
                {quotationTotals.discount.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="quotation-total-row">

              <span>
                Taxable Amount
              </span>

              <strong>
                ₹
                {quotationTotals.taxable.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="quotation-total-row">

              <span>
                Tax
              </span>

              <strong>
                ₹
                {quotationTotals.tax.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="quotation-total-divider"></div>

            <div className="quotation-grand-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {quotationTotals.total.toFixed(
                  2
                )}
              </strong>

            </div>

          </div>

        </div>

        {/* =========================
            ACTIONS
        ========================== */}

        <div className="quotation-form-actions">

          <Link
            to="/sales/quotations"
            className="quotation-cancel-btn"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="quotation-save-btn"
            disabled={saving}
          >
            <FiSave />

            {saving
              ? "Creating..."
              : "Create Quotation"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default CreateQuotation;