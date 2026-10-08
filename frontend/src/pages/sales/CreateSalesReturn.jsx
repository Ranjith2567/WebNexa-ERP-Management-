import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiFileText,
  FiUser,
  FiPackage,
  FiCalendar,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiDollarSign,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/create-sales-return.css";

function CreateSalesReturn() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnableQuantities, setReturnableQuantities] = useState({});

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingReturnHistory, setLoadingReturnHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    salesInvoice: "",
    warehouse: "",
    returnDate: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
    settlementType: "NONE",
    refundAmount: "",
    creditAmount: "",
    items: [],
  });

  /* =========================
     FETCH ISSUED INVOICES
  ========================= */

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setError("");

      const response = await api.get("/sales-invoices", {
        params: {
          status: "ISSUED",
          page: 1,
          limit: 100,
        },
      });

      const data = response.data?.data || [];

      setInvoices(data);
    } catch (err) {
      console.error("Fetch Issued Invoices Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load issued invoices."
      );

      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  /* =========================
     FETCH WAREHOUSES
  ========================= */

  const fetchWarehouses = async (companyId, branchId) => {
    if (!companyId) {
      setWarehouses([]);
      return;
    }

    try {
      setLoadingWarehouses(true);

      const response = await api.get("/warehouses", {
        params: {
          company: companyId,
          branch: branchId || undefined,
          isActive: true,
          page: 1,
          limit: 100,
        },
      });

      const data =
        response.data?.warehouses ||
        response.data?.data ||
        [];

      setWarehouses(data);
    } catch (err) {
      console.error("Fetch Warehouses Error:", err);

      setWarehouses([]);

      setError(
        err.response?.data?.message ||
          "Failed to load warehouses."
      );
    } finally {
      setLoadingWarehouses(false);
    }
  };

  /* =========================
     FETCH RETURN HISTORY
  ========================= */

  const fetchReturnHistory = async (invoiceId, invoiceItems) => {
    if (!invoiceId) {
      setReturnableQuantities({});
      return;
    }

    try {
      setLoadingReturnHistory(true);

      const response = await api.get("/sales-returns", {
        params: {
          salesInvoice: invoiceId,
          page: 1,
          limit: 100,
        },
      });

      const existingReturns = response.data?.data || [];

      const returnedMap = {};

      existingReturns.forEach((salesReturn) => {
        const validStatus = ["APPROVED", "PROCESSED"].includes(
          String(salesReturn.status || "").toUpperCase()
        );

        if (!validStatus) return;

        (salesReturn.items || []).forEach((item) => {
          const productId =
            typeof item.product === "object"
              ? item.product?._id
              : item.product;

          if (!productId) return;

          returnedMap[productId] =
            Number(returnedMap[productId] || 0) +
            Number(item.quantity || 0);
        });
      });

      const remainingMap = {};

      invoiceItems.forEach((item) => {
        const productId =
          typeof item.product === "object"
            ? item.product?._id
            : item.product;

        if (!productId) return;

        const soldQuantity = Number(item.quantity || 0);
        const alreadyReturned = Number(
          returnedMap[productId] || 0
        );

        remainingMap[productId] = Math.max(
          soldQuantity - alreadyReturned,
          0
        );
      });

      setReturnableQuantities(remainingMap);
    } catch (err) {
      console.error("Fetch Return History Error:", err);

      /*
       * Backend will still perform the final validation.
       * We keep original quantities as a fallback.
       */
      const fallback = {};

      invoiceItems.forEach((item) => {
        const productId =
          typeof item.product === "object"
            ? item.product?._id
            : item.product;

        if (productId) {
          fallback[productId] = Number(item.quantity || 0);
        }
      });

      setReturnableQuantities(fallback);
    } finally {
      setLoadingReturnHistory(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  /* =========================
     SELECT INVOICE
  ========================= */

  const handleInvoiceChange = async (e) => {
    const invoiceId = e.target.value;

    setError("");
    setSuccess("");

    if (!invoiceId) {
      setSelectedInvoice(null);

      setFormData((prev) => ({
        ...prev,
        salesInvoice: "",
        warehouse: "",
        items: [],
      }));

      setWarehouses([]);
      setReturnableQuantities({});

      return;
    }

    try {
      setError("");

      const response = await api.get(
        `/sales-invoices/${invoiceId}`
      );

      const invoice = response.data?.data;

      if (!invoice) {
        throw new Error("Invoice details not found.");
      }

      if (invoice.status !== "ISSUED") {
        setError(
          "Only ISSUED invoices can be used for sales returns."
        );
        return;
      }

      setSelectedInvoice(invoice);

      const invoiceItems = invoice.items || [];

      const mappedItems = invoiceItems
        .map((item) => {
          const productId =
            typeof item.product === "object"
              ? item.product?._id
              : item.product;

          if (!productId) return null;

          return {
            product: productId,
            description:
              item.description ||
              item.product?.name ||
              "",
            soldQuantity: Number(item.quantity || 0),
            returnQuantity: 0,
            unitPrice: Number(item.unitPrice || 0),
            discountPercent: Number(
              item.discountPercent || 0
            ),
            taxPercent: Number(item.taxPercent || 0),
          };
        })
        .filter(Boolean);

      setFormData((prev) => ({
        ...prev,
        salesInvoice: invoice._id,
        warehouse: "",
        items: mappedItems,
      }));

      await fetchWarehouses(
        invoice.company?._id || invoice.company,
        invoice.branch?._id || invoice.branch
      );

      await fetchReturnHistory(
        invoice._id,
        invoiceItems
      );
    } catch (err) {
      console.error("Fetch Invoice Error:", err);

      setSelectedInvoice(null);
      setWarehouses([]);
      setReturnableQuantities({});

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load invoice details."
      );
    }
  };

  /* =========================
     FORM HANDLERS
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleItemQuantityChange = (index, value) => {
    const updatedItems = [...formData.items];

    const item = updatedItems[index];

    const productId = item.product;

    const maxQuantity =
      Number(returnableQuantities[productId] || 0);

    let quantity = Number(value);

    if (!Number.isFinite(quantity) || quantity < 0) {
      quantity = 0;
    }

    if (quantity > maxQuantity) {
      quantity = maxQuantity;
    }

    updatedItems[index] = {
      ...item,
      returnQuantity: quantity,
    };

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    setError("");
  };

  const removeItem = (index) => {
    const updatedItems = [...formData.items];

    updatedItems[index] = {
      ...updatedItems[index],
      returnQuantity: 0,
    };

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  /* =========================
     CALCULATIONS
  ========================= */

  const calculateItemTotal = (item) => {
    const quantity = Number(item.returnQuantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const discountPercent = Number(
      item.discountPercent || 0
    );
    const taxPercent = Number(item.taxPercent || 0);

    const gross = quantity * unitPrice;

    const discount =
      gross * (discountPercent / 100);

    const taxable = gross - discount;

    const tax =
      taxable * (taxPercent / 100);

    return Math.round(
      (taxable + tax + Number.EPSILON) * 100
    ) / 100;
  };

  const selectedItems = useMemo(() => {
    return formData.items.filter(
      (item) => Number(item.returnQuantity || 0) > 0
    );
  }, [formData.items]);

  const returnTotal = useMemo(() => {
    return selectedItems.reduce(
      (total, item) =>
        total + calculateItemTotal(item),
      0
    );
  }, [selectedItems]);

  const roundedReturnTotal =
    Math.round(
      (returnTotal + Number.EPSILON) * 100
    ) / 100;

  /* =========================
     SETTLEMENT
  ========================= */

  const handleSettlementChange = (e) => {
    const settlementType = e.target.value;

    setFormData((prev) => ({
      ...prev,
      settlementType,
      refundAmount:
        settlementType === "REFUND"
          ? roundedReturnTotal.toFixed(2)
          : "",
      creditAmount:
        settlementType === "CREDIT_NOTE"
          ? roundedReturnTotal.toFixed(2)
          : "",
    }));

    setError("");
  };

  useEffect(() => {
    if (formData.settlementType === "REFUND") {
      setFormData((prev) => ({
        ...prev,
        refundAmount: roundedReturnTotal.toFixed(2),
        creditAmount: "",
      }));
    }

    if (
      formData.settlementType === "CREDIT_NOTE"
    ) {
      setFormData((prev) => ({
        ...prev,
        refundAmount: "",
        creditAmount: roundedReturnTotal.toFixed(2),
      }));
    }

    if (
      formData.settlementType === "NONE" ||
      formData.settlementType === "ADJUST_INVOICE"
    ) {
      setFormData((prev) => ({
        ...prev,
        refundAmount: "",
        creditAmount: "",
      }));
    }
  }, [
    roundedReturnTotal,
    formData.settlementType,
  ]);

  /* =========================
     VALIDATION
  ========================= */

  const validateForm = () => {
    if (!formData.salesInvoice) {
      return "Please select a sales invoice.";
    }

    if (!selectedInvoice) {
      return "Invoice details are not available.";
    }

    if (!formData.warehouse) {
      return "Please select a warehouse.";
    }

    if (!formData.returnDate) {
      return "Return date is required.";
    }

    if (!formData.reason.trim()) {
      return "Return reason is required.";
    }

    if (selectedItems.length === 0) {
      return "Please enter return quantity for at least one item.";
    }

    for (const item of selectedItems) {
      const maxQuantity = Number(
        returnableQuantities[item.product] || 0
      );

      if (item.returnQuantity <= 0) {
        return "Return quantity must be greater than zero.";
      }

      if (item.returnQuantity > maxQuantity) {
        return `Return quantity cannot exceed ${maxQuantity}.`;
      }
    }

    if (roundedReturnTotal <= 0) {
      return "Return total must be greater than zero.";
    }

    if (
      formData.settlementType === "REFUND"
    ) {
      const refundAmount = Number(
        formData.refundAmount || 0
      );

      if (
        Math.abs(
          refundAmount - roundedReturnTotal
        ) > 0.01
      ) {
        return "Refund amount must equal the return total.";
      }
    }

    if (
      formData.settlementType === "CREDIT_NOTE"
    ) {
      const creditAmount = Number(
        formData.creditAmount || 0
      );

      if (
        Math.abs(
          creditAmount - roundedReturnTotal
        ) > 0.01
      ) {
        return "Credit amount must equal the return total.";
      }
    }

    return "";
  };

  /* =========================
     CREATE RETURN
  ========================= */

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
        salesInvoice: formData.salesInvoice,
        warehouse: formData.warehouse,
        returnDate: formData.returnDate,
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
        settlementType: formData.settlementType,
        refundAmount:
          Number(formData.refundAmount || 0),
        creditAmount:
          Number(formData.creditAmount || 0),
        items: selectedItems.map((item) => ({
          product: item.product,
          quantity: Number(item.returnQuantity),
        })),
      };

      const response = await api.post(
        "/sales-returns",
        payload
      );

      const createdReturn =
        response.data?.data?.salesReturn;

      setSuccess(
        response.data?.message ||
          "Sales Return created successfully."
      );

      if (createdReturn?._id) {
        setTimeout(() => {
          navigate(
            `/sales/returns/${createdReturn._id}`
          );
        }, 700);
      } else {
        setTimeout(() => {
          navigate("/sales/returns");
        }, 700);
      }
    } catch (err) {
      console.error(
        "Create Sales Return Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create sales return."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="create-sales-return-page">
      {/* Header */}
      <div className="create-sales-return-header">
        <div className="create-sales-return-header-left">
          <Link
            to="/sales/returns"
            className="create-sales-return-back"
          >
            <FiArrowLeft />
          </Link>

          <div>
            <div className="create-sales-return-title-row">
              <div className="create-sales-return-title-icon">
                <FiRefreshCw />
              </div>

              <div>
                <h1>Create Sales Return</h1>
                <p>
                  Create a return against an issued sales
                  invoice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="create-sales-return-message error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="create-sales-return-message success">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Invoice & Warehouse */}
        <div className="create-sales-return-grid">
          <div className="create-sales-return-card">
            <div className="create-sales-return-card-header">
              <div>
                <h2>Return Reference</h2>
                <p>Select the issued invoice for this return.</p>
              </div>

              <FiFileText />
            </div>

            <div className="create-sales-return-form-grid">
              <div className="create-sales-return-field full">
                <label>
                  Sales Invoice <span>*</span>
                </label>

                <select
                  value={formData.salesInvoice}
                  onChange={handleInvoiceChange}
                  disabled={
                    loadingInvoices || saving
                  }
                >
                  <option value="">
                    {loadingInvoices
                      ? "Loading issued invoices..."
                      : "Select issued invoice"}
                  </option>

                  {invoices.map((invoice) => (
                    <option
                      key={invoice._id}
                      value={invoice._id}
                    >
                      {invoice.invoiceNumber} —{" "}
                      {invoice.customer?.name ||
                        "Customer"}{" "}
                      —{" "}
                      {formatAmount(
                        invoice.grandTotal
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <div className="create-sales-return-field">
                <label>
                  Warehouse <span>*</span>
                </label>

                <select
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={handleChange}
                  disabled={
                    !selectedInvoice ||
                    loadingWarehouses ||
                    saving
                  }
                >
                  <option value="">
                    {loadingWarehouses
                      ? "Loading warehouses..."
                      : "Select warehouse"}
                  </option>

                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse._id}
                      value={warehouse._id}
                    >
                      {warehouse.name}
                      {warehouse.code
                        ? ` (${warehouse.code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="create-sales-return-field">
                <label>
                  Return Date <span>*</span>
                </label>

                <div className="create-sales-return-input-icon">
                  <FiCalendar />

                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          {selectedInvoice && (
            <div className="create-sales-return-card">
              <div className="create-sales-return-card-header">
                <div>
                  <h2>Invoice Information</h2>
                  <p>Selected invoice details.</p>
                </div>

                <FiFileText />
              </div>

              <div className="create-sales-return-info-grid">
                <div className="create-sales-return-info-item">
                  <span>Invoice</span>
                  <strong>
                    {selectedInvoice.invoiceNumber ||
                      "-"}
                  </strong>
                </div>

                <div className="create-sales-return-info-item">
                  <span>Invoice Date</span>
                  <strong>
                    {formatDate(
                      selectedInvoice.invoiceDate
                    )}
                  </strong>
                </div>

                <div className="create-sales-return-info-item">
                  <span>Customer</span>
                  <strong>
                    {selectedInvoice.customer?.name ||
                      "-"}
                  </strong>
                </div>

                <div className="create-sales-return-info-item">
                  <span>Invoice Total</span>
                  <strong>
                    {formatAmount(
                      selectedInvoice.grandTotal
                    )}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="create-sales-return-card">
          <div className="create-sales-return-card-header">
            <div>
              <h2>Return Items</h2>
              <p>
                Enter the quantity of each product being
                returned.
              </p>
            </div>

            <div className="create-sales-return-items-header-right">
              {loadingReturnHistory && (
                <span className="create-sales-return-loading-text">
                  <FiRefreshCw />
                  Checking previous returns...
                </span>
              )}

              <FiPackage />
            </div>
          </div>

          {!selectedInvoice ? (
            <div className="create-sales-return-items-empty">
              <FiFileText />
              <h3>Select an invoice first</h3>
              <p>
                Invoice products will appear here after
                selecting an issued invoice.
              </p>
            </div>
          ) : (
            <div className="create-sales-return-items-table-wrapper">
              <table className="create-sales-return-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sold Qty</th>
                    <th>Returnable</th>
                    <th>Return Qty</th>
                    <th>Unit Price</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {formData.items.map(
                    (item, index) => {
                      const returnable = Number(
                        returnableQuantities[
                          item.product
                        ] ?? item.soldQuantity
                      );

                      const lineTotal =
                        calculateItemTotal(item);

                      const productName =
                        typeof selectedInvoice.items?.[
                          index
                        ]?.product === "object"
                          ? selectedInvoice.items[
                              index
                            ]?.product?.name
                          : item.description ||
                            "Product";

                      return (
                        <tr key={item.product}>
                          <td>
                            <div className="create-sales-return-product-cell">
                              <div className="create-sales-return-product-icon">
                                <FiPackage />
                              </div>

                              <div>
                                <strong>
                                  {productName ||
                                    item.description ||
                                    "Product"}
                                </strong>

                                <span>
                                  {item.description ||
                                    "Invoice item"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="create-sales-return-qty-text">
                              {item.soldQuantity}
                            </span>
                          </td>

                          <td>
                            <span className="create-sales-return-returnable">
                              {returnable}
                            </span>
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              max={returnable}
                              step="0.01"
                              value={
                                item.returnQuantity
                              }
                              onChange={(e) =>
                                handleItemQuantityChange(
                                  index,
                                  e.target.value
                                )
                              }
                              disabled={
                                returnable <= 0 ||
                                saving
                              }
                              className="create-sales-return-qty-input"
                            />
                          </td>

                          <td>
                            {formatAmount(
                              item.unitPrice
                            )}
                          </td>

                          <td>
                            {Number(
                              item.taxPercent || 0
                            ).toFixed(2)}
                            %
                          </td>

                          <td>
                            <strong className="create-sales-return-line-total">
                              {formatAmount(
                                lineTotal
                              )}
                            </strong>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="create-sales-return-remove-btn"
                              onClick={() =>
                                removeItem(index)
                              }
                              disabled={
                                !item.returnQuantity ||
                                saving
                              }
                              title="Clear quantity"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reason + Settlement */}
        <div className="create-sales-return-bottom-grid">
          <div className="create-sales-return-card">
            <div className="create-sales-return-card-header">
              <div>
                <h2>Return Details</h2>
                <p>
                  Provide the reason and additional notes.
                </p>
              </div>

              <FiFileText />
            </div>

            <div className="create-sales-return-form-grid">
              <div className="create-sales-return-field full">
                <label>
                  Return Reason <span>*</span>
                </label>

                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Example: Product damaged during delivery"
                  rows="4"
                  disabled={saving}
                />
              </div>

              <div className="create-sales-return-field full">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes about this return..."
                  rows="4"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="create-sales-return-card">
            <div className="create-sales-return-card-header">
              <div>
                <h2>Settlement</h2>
                <p>
                  Select how the return amount should be
                  settled.
                </p>
              </div>

              <FiDollarSign />
            </div>

            <div className="create-sales-return-settlement">
              <div className="create-sales-return-field">
                <label>
                  Settlement Type <span>*</span>
                </label>

                <select
                  name="settlementType"
                  value={formData.settlementType}
                  onChange={handleSettlementChange}
                  disabled={saving}
                >
                  <option value="NONE">
                    None
                  </option>

                  <option value="REFUND">
                    Refund
                  </option>

                  <option value="CREDIT_NOTE">
                    Credit Note
                  </option>

                  <option value="ADJUST_INVOICE">
                    Adjust Invoice
                  </option>
                </select>
              </div>

              {formData.settlementType ===
                "REFUND" && (
                <div className="create-sales-return-field">
                  <label>Refund Amount</label>

                  <div className="create-sales-return-input-icon">
                    <FiDollarSign />

                    <input
                      type="number"
                      value={
                        formData.refundAmount
                      }
                      readOnly
                    />
                  </div>
                </div>
              )}

              {formData.settlementType ===
                "CREDIT_NOTE" && (
                <div className="create-sales-return-field">
                  <label>Credit Amount</label>

                  <div className="create-sales-return-input-icon">
                    <FiDollarSign />

                    <input
                      type="number"
                      value={
                        formData.creditAmount
                      }
                      readOnly
                    />
                  </div>
                </div>
              )}

              <div className="create-sales-return-total-box">
                <span>Return Total</span>

                <strong>
                  {formatAmount(
                    roundedReturnTotal
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="create-sales-return-footer">
          <Link
            to="/sales/returns"
            className="create-sales-return-cancel-btn"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="create-sales-return-submit-btn"
            disabled={
              saving ||
              !selectedInvoice ||
              selectedItems.length === 0
            }
          >
            {saving ? (
              <>
                <FiRefreshCw className="create-sales-return-spin" />
                Processing Return...
              </>
            ) : (
              <>
                <FiSave />
                Create Sales Return
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSalesReturn;