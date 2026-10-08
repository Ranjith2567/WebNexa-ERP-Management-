import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiCreditCard,
  FiFileText,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/create-sales-payment.css";

function CreateSalesPayment() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    salesInvoice: "",
    amount: "",
    paymentMethod: "CASH",
    transactionReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // --------------------------------------------------
  // FETCH ISSUED INVOICES
  // --------------------------------------------------

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

      // Only invoices having balance due
      const availableInvoices = data.filter((invoice) => {
        const balance = Number(invoice.balanceDue ?? 0);
        return (
          String(invoice.status || "").toUpperCase() === "ISSUED" &&
          balance > 0
        );
      });

      setInvoices(availableInvoices);
    } catch (err) {
      console.error("Fetch invoices error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load issued invoices."
      );
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // --------------------------------------------------
  // SELECTED INVOICE
  // --------------------------------------------------

  const selectedInvoice = useMemo(() => {
    if (!formData.salesInvoice) return null;

    return (
      invoices.find(
        (invoice) =>
          String(invoice._id) === String(formData.salesInvoice)
      ) || null
    );
  }, [formData.salesInvoice, invoices]);

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleInvoiceChange = (e) => {
    const invoiceId = e.target.value;

    const invoice = invoices.find(
      (item) => String(item._id) === String(invoiceId)
    );

    setFormData((prev) => ({
      ...prev,
      salesInvoice: invoiceId,
      amount:
        invoice && Number(invoice.balanceDue) > 0
          ? Number(invoice.balanceDue).toFixed(2)
          : "",
    }));

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // FORMAT HELPERS
  // --------------------------------------------------

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCustomerName = (invoice) => {
    if (!invoice?.customer) return "-";

    if (typeof invoice.customer === "string") {
      return invoice.customer;
    }

    return (
      invoice.customer.name ||
      invoice.customer.companyName ||
      invoice.customer.customerCode ||
      "-"
    );
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateForm = () => {
    if (!formData.salesInvoice) {
      return "Please select an invoice.";
    }

    const amount = Number(formData.amount);

    if (!formData.amount || Number.isNaN(amount)) {
      return "Please enter a valid payment amount.";
    }

    if (amount <= 0) {
      return "Payment amount must be greater than 0.";
    }

    if (selectedInvoice) {
      const balanceDue = Number(selectedInvoice.balanceDue || 0);

      if (amount > balanceDue) {
        return `Payment amount cannot exceed the balance due of ₹${formatCurrency(
          balanceDue
        )}.`;
      }
    }

    if (!formData.paymentMethod) {
      return "Please select a payment method.";
    }

    if (!formData.paymentDate) {
      return "Please select a payment date.";
    }

    return "";
  };

  // --------------------------------------------------
  // SUBMIT PAYMENT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        salesInvoice: formData.salesInvoice,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionReference:
          formData.transactionReference.trim(),
        paymentDate: formData.paymentDate,
        notes: formData.notes.trim(),
      };

      const response = await api.post(
        "/sales-payments",
        payload
      );

      if (response.data?.success) {
        setSuccess(
          response.data?.message ||
            "Sales Payment created successfully."
        );

        const paymentId =
          response.data?.data?.payment?._id;

        setTimeout(() => {
          if (paymentId) {
            navigate(`/sales/payments/${paymentId}`);
          } else {
            navigate("/sales/payments");
          }
        }, 800);
      } else {
        setError(
          response.data?.message ||
            "Failed to create sales payment."
        );
      }
    } catch (err) {
      console.error("Create sales payment error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to create sales payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  const handleReset = () => {
    setFormData({
      salesInvoice: "",
      amount: "",
      paymentMethod: "CASH",
      transactionReference: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="create-sales-payment-page">

      {/* HEADER */}
      <div className="create-sales-payment-header">

        <div className="create-sales-payment-header-left">
          <Link
            to="/sales/payments"
            className="create-sales-payment-back"
          >
            <FiArrowLeft />
          </Link>

          <div>
            <div className="create-sales-payment-title-row">
              <h1>Record Sales Payment</h1>

              <span className="create-sales-payment-header-badge">
                <FiCreditCard />
                PAYMENT
              </span>
            </div>

            <p>
              Record a payment received against an issued sales
              invoice.
            </p>
          </div>
        </div>

        <div className="create-sales-payment-header-actions">
          <button
            type="button"
            className="create-sales-payment-reset-btn"
            onClick={handleReset}
            disabled={saving}
          >
            <FiRefreshCw />
            Reset
          </button>

          <button
            type="submit"
            form="create-sales-payment-form"
            className="create-sales-payment-save-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="payment-button-spinner" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Record Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="create-sales-payment-message error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="create-sales-payment-message success">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* FORM */}
      <form
        id="create-sales-payment-form"
        onSubmit={handleSubmit}
        className="create-sales-payment-form"
      >

        {/* INVOICE SECTION */}
        <section className="create-sales-payment-card">

          <div className="create-sales-payment-card-header">
            <div className="create-sales-payment-section-icon">
              <FiFileText />
            </div>

            <div>
              <h2>Invoice Details</h2>
              <p>Select the issued invoice for this payment.</p>
            </div>
          </div>

          <div className="create-sales-payment-card-body">

            <div className="payment-form-group full-width">
              <label>
                Sales Invoice
                <span className="required">*</span>
              </label>

              <div className="payment-select-wrapper">
                <FiFileText className="payment-input-icon" />

                <select
                  name="salesInvoice"
                  value={formData.salesInvoice}
                  onChange={handleInvoiceChange}
                  disabled={
                    loadingInvoices || saving
                  }
                  className="payment-select with-icon"
                >
                  <option value="">
                    {loadingInvoices
                      ? "Loading invoices..."
                      : invoices.length === 0
                      ? "No unpaid issued invoices available"
                      : "Select Sales Invoice"}
                  </option>

                  {invoices.map((invoice) => (
                    <option
                      key={invoice._id}
                      value={invoice._id}
                    >
                      {invoice.invoiceNumber} — Balance ₹
                      {formatCurrency(invoice.balanceDue)}
                    </option>
                  ))}
                </select>
              </div>

              {loadingInvoices && (
                <small className="payment-field-hint">
                  Loading issued invoices...
                </small>
              )}

              {!loadingInvoices &&
                invoices.length === 0 && (
                  <small className="payment-field-hint warning">
                    No issued invoices with outstanding
                    balance were found.
                  </small>
                )}
            </div>

          </div>
        </section>

        {/* SELECTED INVOICE SUMMARY */}
        {selectedInvoice && (
          <section className="create-sales-payment-card invoice-summary-card">

            <div className="create-sales-payment-card-header">
              <div className="create-sales-payment-section-icon">
                <FiFileText />
              </div>

              <div>
                <h2>Selected Invoice</h2>
                <p>Payment information from the invoice.</p>
              </div>
            </div>

            <div className="invoice-payment-summary-grid">

              <div className="invoice-payment-summary-item">
                <span className="summary-label">
                  Invoice Number
                </span>

                <strong>
                  {selectedInvoice.invoiceNumber || "-"}
                </strong>
              </div>

              <div className="invoice-payment-summary-item">
                <span className="summary-label">
                  Customer
                </span>

                <strong>
                  <FiUser />
                  {getCustomerName(selectedInvoice)}
                </strong>
              </div>

              <div className="invoice-payment-summary-item">
                <span className="summary-label">
                  Invoice Date
                </span>

                <strong>
                  <FiCalendar />
                  {formatDate(selectedInvoice.invoiceDate)}
                </strong>
              </div>

              <div className="invoice-payment-summary-item">
                <span className="summary-label">
                  Due Date
                </span>

                <strong>
                  <FiCalendar />
                  {formatDate(selectedInvoice.dueDate)}
                </strong>
              </div>

              <div className="invoice-payment-summary-item">
                <span className="summary-label">
                  Grand Total
                </span>

                <strong>
                  ₹{formatCurrency(selectedInvoice.grandTotal)}
                </strong>
              </div>

              <div className="invoice-payment-summary-item paid">
                <span className="summary-label">
                  Already Paid
                </span>

                <strong>
                  ₹{formatCurrency(selectedInvoice.paidAmount)}
                </strong>
              </div>

              <div className="invoice-payment-summary-item balance">
                <span className="summary-label">
                  Balance Due
                </span>

                <strong>
                  ₹{formatCurrency(selectedInvoice.balanceDue)}
                </strong>
              </div>

              <div className="invoice-payment-summary-item">
                <span className="summary-label">
                  Payment Status
                </span>

                <span className="invoice-payment-status">
                  {selectedInvoice.paymentStatus ||
                    "UNPAID"}
                </span>
              </div>

            </div>
          </section>
        )}

        {/* PAYMENT DETAILS */}
        <section className="create-sales-payment-card">

          <div className="create-sales-payment-card-header">
            <div className="create-sales-payment-section-icon">
              <FiCreditCard />
            </div>

            <div>
              <h2>Payment Details</h2>
              <p>Enter the payment received from the customer.</p>
            </div>
          </div>

          <div className="create-sales-payment-card-body">

            {/* AMOUNT */}
            <div className="payment-form-group">
              <label>
                Payment Amount
                <span className="required">*</span>
              </label>

              <div className="payment-input-wrapper">
                <span className="payment-currency-symbol">
                  ₹
                </span>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  disabled={saving}
                  className="payment-input amount-input"
                />
              </div>

              {selectedInvoice && (
                <small className="payment-field-hint">
                  Maximum payment: ₹
                  {formatCurrency(
                    selectedInvoice.balanceDue
                  )}
                </small>
              )}
            </div>

            {/* PAYMENT METHOD */}
            <div className="payment-form-group">
              <label>
                Payment Method
                <span className="required">*</span>
              </label>

              <div className="payment-select-wrapper">
                <FiCreditCard className="payment-input-icon" />

                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  disabled={saving}
                  className="payment-select with-icon"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* PAYMENT DATE */}
            <div className="payment-form-group">
              <label>
                Payment Date
                <span className="required">*</span>
              </label>

              <div className="payment-input-wrapper">
                <FiCalendar className="payment-input-icon" />

                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  disabled={saving}
                  className="payment-input with-left-icon"
                />
              </div>
            </div>

            {/* TRANSACTION REFERENCE */}
            <div className="payment-form-group">
              <label>
                Transaction Reference
              </label>

              <div className="payment-input-wrapper">
                <FiFileText className="payment-input-icon" />

                <input
                  type="text"
                  name="transactionReference"
                  value={formData.transactionReference}
                  onChange={handleChange}
                  placeholder="e.g. UPI transaction ID / cheque number"
                  maxLength={150}
                  disabled={saving}
                  className="payment-input with-left-icon"
                />
              </div>

              <small className="payment-field-hint">
                Optional. Useful for UPI, bank transfer,
                cheque or card payments.
              </small>
            </div>

            {/* NOTES */}
            <div className="payment-form-group full-width">
              <label>Notes</label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional payment notes..."
                rows="4"
                maxLength={1000}
                disabled={saving}
                className="payment-textarea"
              />
            </div>

          </div>
        </section>

        {/* PAYMENT PREVIEW */}
        {selectedInvoice && formData.amount && (
          <section className="create-sales-payment-card payment-preview-card">

            <div className="payment-preview-header">
              <div>
                <span className="preview-label">
                  Payment Preview
                </span>

                <h3>
                  ₹{formatCurrency(formData.amount)}
                </h3>
              </div>

              <div className="payment-preview-icon">
                <FiDollarSign />
              </div>
            </div>

            <div className="payment-preview-details">

              <div>
                <span>Invoice</span>
                <strong>
                  {selectedInvoice.invoiceNumber}
                </strong>
              </div>

              <div>
                <span>Current Balance</span>
                <strong>
                  ₹
                  {formatCurrency(
                    selectedInvoice.balanceDue
                  )}
                </strong>
              </div>

              <div>
                <span>Remaining After Payment</span>
                <strong>
                  ₹
                  {formatCurrency(
                    Math.max(
                      0,
                      Number(selectedInvoice.balanceDue || 0) -
                        Number(formData.amount || 0)
                    )
                  )}
                </strong>
              </div>

            </div>
          </section>
        )}

        {/* FOOTER ACTIONS */}
        <div className="create-sales-payment-footer">

          <Link
            to="/sales/payments"
            className="create-sales-payment-cancel-btn"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="create-sales-payment-submit-btn"
            disabled={saving || loadingInvoices}
          >
            {saving ? (
              <>
                <span className="payment-button-spinner" />
                Recording Payment...
              </>
            ) : (
              <>
                <FiSave />
                Record Payment
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}

export default CreateSalesPayment;