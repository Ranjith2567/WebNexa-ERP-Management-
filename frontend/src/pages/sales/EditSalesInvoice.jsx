import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiCalendar,
  FiUser,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/edit-sales-invoice.css";

function EditSalesInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    invoiceDate: "",
    dueDate: "",
    notes: "",
    termsAndConditions: "",
    items: [],
  });

  // --------------------------------------------------
  // LOAD INVOICE
  // --------------------------------------------------

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/sales-invoices/${id}`);

      const data = response.data?.data;

      if (!data) {
        throw new Error("Sales invoice data not found.");
      }

      setInvoice(data);

      // Only DRAFT invoices can be edited
      if (data.status !== "DRAFT") {
        setError(
          `This invoice is ${data.status}. Only DRAFT invoices can be edited.`
        );
        return;
      }

      const formattedItems = (data.items || []).map((item) => ({
        product:
          typeof item.product === "object"
            ? item.product?._id
            : item.product || "",

        description:
          item.description ||
          (typeof item.product === "object"
            ? item.product?.name || item.product?.productName || ""
            : ""),

        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        discountPercent: item.discountPercent ?? 0,
        taxPercent: item.taxPercent ?? 0,
      }));

      setFormData({
        invoiceDate: formatDateForInput(data.invoiceDate),
        dueDate: formatDateForInput(data.dueDate),
        notes: data.notes || "",
        termsAndConditions: data.termsAndConditions || "",
        items: formattedItems,
      });

      fetchProducts(data.company?._id || data.company);
    } catch (err) {
      console.error("Fetch sales invoice error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load sales invoice."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOAD PRODUCTS
  // --------------------------------------------------

  const fetchProducts = async (companyId) => {
    try {
      setLoadingProducts(true);

      const response = await api.get("/products", {
        params: {
          company: companyId,
          isActive: true,
          page: 1,
          limit: 100,
        },
      });

      const productData =
        response.data?.products ||
        response.data?.data ||
        [];

      setProducts(productData);
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const formatDateForInput = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "";
    }

    return d.toISOString().split("T")[0];
  };

  const getProductName = (product) => {
    if (!product) return "";

    return (
      product.name ||
      product.productName ||
      product.title ||
      product.product_code ||
      product.code ||
      ""
    );
  };

  const getProductPrice = (product) => {
    if (!product) return 0;

    return Number(
      product.sellingPrice ??
        product.salePrice ??
        product.selling_price ??
        product.price ??
        0
    );
  };

  const roundMoney = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  };

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];

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

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find(
      (product) => product._id === productId
    );

    setFormData((prev) => {
      const updatedItems = [...prev.items];

      updatedItems[index] = {
        ...updatedItems[index],
        product: productId,
        description:
          getProductName(selectedProduct) ||
          updatedItems[index].description,
        unitPrice:
          selectedProduct
            ? getProductPrice(selectedProduct)
            : updatedItems[index].unitPrice,
      };

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          taxPercent: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  // --------------------------------------------------
  // ITEM CALCULATION
  // --------------------------------------------------

  const calculateItem = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const taxPercent = Number(item.taxPercent) || 0;

    const gross = quantity * unitPrice;

    const discountAmount =
      gross * (discountPercent / 100);

    const taxableAmount =
      gross - discountAmount;

    const taxAmount =
      taxableAmount * (taxPercent / 100);

    const lineTotal =
      taxableAmount + taxAmount;

    return {
      gross: roundMoney(gross),
      discountAmount: roundMoney(discountAmount),
      taxableAmount: roundMoney(taxableAmount),
      taxAmount: roundMoney(taxAmount),
      lineTotal: roundMoney(lineTotal),
    };
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    formData.items.forEach((item) => {
      const calculated = calculateItem(item);

      subtotal += calculated.gross;
      discountAmount += calculated.discountAmount;
      taxableAmount += calculated.taxableAmount;
      taxAmount += calculated.taxAmount;
      totalAmount += calculated.lineTotal;
    });

    return {
      subtotal: roundMoney(subtotal),
      discountAmount: roundMoney(discountAmount),
      taxableAmount: roundMoney(taxableAmount),
      taxAmount: roundMoney(taxAmount),
      totalAmount: roundMoney(totalAmount),
    };
  }, [formData.items]);

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateForm = () => {
    if (!formData.invoiceDate) {
      return "Invoice date is required.";
    }

    if (
      formData.dueDate &&
      new Date(formData.dueDate) <
        new Date(formData.invoiceDate)
    ) {
      return "Due date cannot be before invoice date.";
    }

    if (!formData.items.length) {
      return "At least one invoice item is required.";
    }

    const productIds = [];

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];

      if (!item.product) {
        return `Please select a product for item ${i + 1}.`;
      }

      if (productIds.includes(item.product)) {
        return `Duplicate product found in item ${i + 1}.`;
      }

      productIds.push(item.product);

      if (Number(item.quantity) <= 0) {
        return `Quantity must be greater than 0 for item ${i + 1}.`;
      }

      if (Number(item.unitPrice) < 0) {
        return `Unit price cannot be negative for item ${i + 1}.`;
      }

      if (
        Number(item.discountPercent) < 0 ||
        Number(item.discountPercent) > 100
      ) {
        return `Discount must be between 0 and 100 for item ${i + 1}.`;
      }

      if (
        Number(item.taxPercent) < 0 ||
        Number(item.taxPercent) > 100
      ) {
        return `Tax must be between 0 and 100 for item ${i + 1}.`;
      }
    }

    return "";
  };

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

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
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate || null,

        items: formData.items.map((item) => ({
          product: item.product,
          description: item.description?.trim() || "",
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountPercent: Number(item.discountPercent),
          taxPercent: Number(item.taxPercent),
        })),

        notes: formData.notes.trim(),
        termsAndConditions:
          formData.termsAndConditions.trim(),
      };

      const response = await api.patch(
        `/sales-invoices/${id}`,
        payload
      );

      const updatedInvoice =
        response.data?.data;

      setSuccess(
        response.data?.message ||
          "Sales Invoice updated successfully."
      );

      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }

      setTimeout(() => {
        navigate(`/sales/invoices/${id}`);
      }, 800);
    } catch (err) {
      console.error("Update sales invoice error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update sales invoice."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="edit-sales-invoice-page">
        <div className="edit-sales-invoice-loading">
          <FiRefreshCw className="spin" />
          <p>Loading sales invoice...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR / NON-DRAFT
  // --------------------------------------------------

  if (!invoice || invoice.status !== "DRAFT") {
    return (
      <div className="edit-sales-invoice-page">
        <div className="edit-sales-invoice-error-page">
          <FiFileText />

          <h2>Invoice Cannot Be Edited</h2>

          <p>
            {error ||
              "Only draft sales invoices can be edited."}
          </p>

          <Link
            to={`/sales/invoices/${id}`}
            className="invoice-back-button"
          >
            <FiArrowLeft />
            Back to Invoice
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div className="edit-sales-invoice-page">

      {/* HEADER */}

      <div className="edit-sales-invoice-header">
        <div className="edit-invoice-header-left">
          <Link
            to={`/sales/invoices/${id}`}
            className="invoice-back-link"
          >
            <FiArrowLeft />
          </Link>

          <div>
            <div className="edit-invoice-title-row">
              <h1>Edit Sales Invoice</h1>

              <span className="edit-invoice-draft-badge">
                DRAFT
              </span>
            </div>

            <p>
              {invoice.invoiceNumber ||
                "Sales Invoice"}
            </p>
          </div>
        </div>

        <div className="edit-invoice-header-actions">
          <Link
            to={`/sales/invoices/${id}`}
            className="invoice-cancel-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            form="edit-sales-invoice-form"
            className="invoice-save-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <FiRefreshCw className="spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="edit-invoice-alert error">
          <FiFileText />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="edit-invoice-alert success">
          <FiFileText />
          <span>{success}</span>
        </div>
      )}

      <form
        id="edit-sales-invoice-form"
        onSubmit={handleSubmit}
      >

        {/* INVOICE INFORMATION */}

        <div className="edit-invoice-card">

          <div className="edit-invoice-card-header">
            <div className="edit-invoice-section-icon">
              <FiFileText />
            </div>

            <div>
              <h2>Invoice Information</h2>
              <p>
                Update invoice dates and basic information.
              </p>
            </div>
          </div>

          <div className="edit-invoice-info-grid">

            <div className="edit-invoice-readonly-box">
              <span>Invoice Number</span>
              <strong>
                {invoice.invoiceNumber || "-"}
              </strong>
            </div>

            <div className="edit-invoice-readonly-box">
              <span>Customer</span>
              <strong>
                {invoice.customer?.name ||
                  invoice.customer?.companyName ||
                  "-"}
              </strong>
            </div>

            <div className="edit-invoice-readonly-box">
              <span>Sales Order</span>
              <strong>
                {invoice.salesOrder?.orderNumber ||
                  "-"}
              </strong>
            </div>

            <div className="edit-invoice-readonly-box">
              <span>Company</span>
              <strong>
                {invoice.company?.name ||
                  invoice.company?.companyName ||
                  "-"}
              </strong>
            </div>

          </div>

          <div className="edit-invoice-form-grid">

            <div className="edit-invoice-field">
              <label>
                <FiCalendar />
                Invoice Date
              </label>

              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="edit-invoice-field">
              <label>
                <FiCalendar />
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="edit-invoice-field">
              <label>
                <FiUser />
                Sales Person
              </label>

              <input
                type="text"
                value={
                  invoice.salesPerson?.name ||
                  invoice.salesPerson?.fullName ||
                  "-"
                }
                disabled
              />
            </div>

            <div className="edit-invoice-field">
              <label>
                <FiPackage />
                Payment Status
              </label>

              <input
                type="text"
                value={
                  invoice.paymentStatus || "UNPAID"
                }
                disabled
              />
            </div>

          </div>
        </div>

        {/* ITEMS */}

        <div className="edit-invoice-card">

          <div className="edit-invoice-card-header items-header">

            <div className="edit-invoice-card-header-content">
              <div className="edit-invoice-section-icon">
                <FiPackage />
              </div>

              <div>
                <h2>Invoice Items</h2>
                <p>
                  Update products, quantities, pricing and taxes.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="add-invoice-item-button"
              onClick={addItem}
            >
              <FiPlus />
              Add Item
            </button>

          </div>

          <div className="invoice-items-wrapper">

            {formData.items.length === 0 ? (
              <div className="invoice-no-items">
                <FiPackage />

                <h3>No invoice items</h3>

                <p>
                  Add at least one product to this invoice.
                </p>

                <button
                  type="button"
                  onClick={addItem}
                  className="add-invoice-item-button"
                >
                  <FiPlus />
                  Add Item
                </button>
              </div>
            ) : (
              formData.items.map((item, index) => {

                const calculated =
                  calculateItem(item);

                return (
                  <div
                    className="edit-invoice-item"
                    key={index}
                  >

                    <div className="invoice-item-top">

                      <div className="invoice-item-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="invoice-item-product-field">

                        <label>Product</label>

                        <select
                          value={item.product}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              e.target.value
                            )
                          }
                          disabled={loadingProducts}
                        >
                          <option value="">
                            {loadingProducts
                              ? "Loading products..."
                              : "Select Product"}
                          </option>

                          {products.map((product) => (
                            <option
                              key={product._id}
                              value={product._id}
                            >
                              {getProductName(product)}
                            </option>
                          ))}
                        </select>

                      </div>

                      <button
                        type="button"
                        className="remove-invoice-item"
                        onClick={() =>
                          removeItem(index)
                        }
                        title="Remove Item"
                      >
                        <FiTrash2 />
                      </button>

                    </div>

                    <div className="invoice-item-fields">

                      <div className="invoice-item-field description-field">
                        <label>Description</label>

                        <input
                          type="text"
                          value={item.description}
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

                      <div className="invoice-item-field">
                        <label>Quantity</label>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="invoice-item-field">
                        <label>Unit Price</label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="invoice-item-field">
                        <label>Discount %</label>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discountPercent}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "discountPercent",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="invoice-item-field">
                        <label>Tax %</label>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.taxPercent}
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

                    <div className="invoice-item-calculation">

                      <div>
                        <span>Gross</span>
                        <strong>
                          ₹{calculated.gross.toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span>Discount</span>
                        <strong>
                          ₹
                          {calculated.discountAmount.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Taxable</span>
                        <strong>
                          ₹
                          {calculated.taxableAmount.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Tax</span>
                        <strong>
                          ₹
                          {calculated.taxAmount.toFixed(2)}
                        </strong>
                      </div>

                      <div className="line-total">
                        <span>Line Total</span>
                        <strong>
                          ₹
                          {calculated.lineTotal.toFixed(2)}
                        </strong>
                      </div>

                    </div>

                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* NOTES + TERMS */}

        <div className="edit-invoice-bottom-grid">

          <div className="edit-invoice-card">

            <div className="edit-invoice-card-header">
              <div className="edit-invoice-section-icon">
                <FiFileText />
              </div>

              <div>
                <h2>Notes</h2>
                <p>
                  Add additional information for the customer.
                </p>
              </div>
            </div>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter invoice notes..."
              rows="7"
            />

          </div>

          <div className="edit-invoice-card">

            <div className="edit-invoice-card-header">
              <div className="edit-invoice-section-icon">
                <FiFileText />
              </div>

              <div>
                <h2>Terms & Conditions</h2>
                <p>
                  Specify invoice terms and conditions.
                </p>
              </div>
            </div>

            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              placeholder="Enter terms and conditions..."
              rows="7"
            />

          </div>

        </div>

        {/* TOTALS */}

        <div className="edit-invoice-total-card">

          <div className="edit-invoice-total-content">

            <div className="edit-invoice-total-row">
              <span>Subtotal</span>
              <strong>
                ₹{totals.subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="edit-invoice-total-row">
              <span>Discount</span>
              <strong className="discount-value">
                - ₹{totals.discountAmount.toFixed(2)}
              </strong>
            </div>

            <div className="edit-invoice-total-row">
              <span>Taxable Amount</span>
              <strong>
                ₹{totals.taxableAmount.toFixed(2)}
              </strong>
            </div>

            <div className="edit-invoice-total-row">
              <span>Tax</span>
              <strong>
                ₹{totals.taxAmount.toFixed(2)}
              </strong>
            </div>

            <div className="edit-invoice-grand-total">
              <span>Total Amount</span>

              <strong>
                ₹{totals.totalAmount.toFixed(2)}
              </strong>
            </div>

          </div>

        </div>

        {/* BOTTOM ACTIONS */}

        <div className="edit-invoice-footer-actions">

          <Link
            to={`/sales/invoices/${id}`}
            className="invoice-cancel-button large"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="invoice-save-button large"
            disabled={saving}
          >
            {saving ? (
              <>
                <FiRefreshCw className="spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <FiSave />
                Save Changes
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}

export default EditSalesInvoice;