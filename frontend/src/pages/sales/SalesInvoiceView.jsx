import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiEdit2,
  FiFileText,
  FiUser,
  FiPackage,
  FiCalendar,
  FiMapPin,
  FiRefreshCw,
  FiCreditCard,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-invoice-view.css";

function SalesInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/sales-invoices/${id}`
      );

      setInvoice(response.data?.data || null);
    } catch (err) {
      console.error(
        "Sales invoice view error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load sales invoice."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleIssueInvoice = async () => {
    if (!invoice) return;

    const confirmed = window.confirm(
      `Are you sure you want to issue invoice ${invoice.invoiceNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIssuing(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/sales-invoices/${id}/status`,
        {
          status: "ISSUED",
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to issue invoice."
        );
      }

      setInvoice(
        response.data?.data || {
          ...invoice,
          status: "ISSUED",
        }
      );

      setSuccess(
        response.data?.message ||
          "Sales Invoice issued successfully."
      );
    } catch (err) {
      console.error(
        "Issue Sales Invoice Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to issue sales invoice."
      );
    } finally {
      setIssuing(false);
    }
  };

  const formatCurrency = (amount = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
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

  const getStatusClass = (status) => {
    switch (status) {
      case "ISSUED":
        return "issued";

      case "DRAFT":
        return "draft";

      case "CANCELLED":
        return "cancelled";

      default:
        return "default";
    }
  };

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return "paid";

      case "PARTIALLY_PAID":
        return "partial";

      case "UNPAID":
        return "unpaid";

      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="sales-invoice-view-page">
        <div className="invoice-view-loading">
          <div className="invoice-view-spinner" />

          <p>
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="sales-invoice-view-page">
        <div className="invoice-view-error">
          <FiFileText />

          <h2>
            Unable to load invoice
          </h2>

          <p>
            {error ||
              "Sales invoice not found."}
          </p>

          <Link
            to="/sales/invoices"
            className="invoice-back-btn"
          >
            <FiArrowLeft />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const customer =
    invoice.customer || {};

  const company =
    invoice.company || {};

  const branch =
    invoice.branch || {};

  const salesOrder =
    invoice.salesOrder || {};

  const items =
    Array.isArray(invoice.items)
      ? invoice.items
      : [];

  return (
    <div className="sales-invoice-view-page">

      {/* =========================
          HEADER
      ========================== */}

      <div className="sales-invoice-view-header">

        <div className="invoice-view-header-left">

          <Link
            to="/sales/invoices"
            className="invoice-back-link"
          >
            <FiArrowLeft />
          </Link>

          <div>

            <div className="invoice-view-breadcrumb">
              Sales / Invoices / View
            </div>

            <div className="invoice-title-row">

              <h1>
                {invoice.invoiceNumber ||
                  "Sales Invoice"}
              </h1>

              <span
                className={`invoice-view-status ${getStatusClass(
                  invoice.status
                )}`}
              >
                {invoice.status ||
                  "UNKNOWN"}
              </span>

            </div>

            <p>
              Sales invoice details and
              transaction information.
            </p>

          </div>

        </div>

        <div className="invoice-view-header-actions">

          {/* EDIT */}
          {invoice.status === "DRAFT" && (
            <Link
              to={`/sales/invoices/${invoice._id}/edit`}
              className="invoice-edit-btn"
            >
              <FiEdit2 />
              Edit Invoice
            </Link>
          )}

          {/* ISSUE */}
          {invoice.status === "DRAFT" && (
            <button
              type="button"
              className="invoice-issue-btn"
              onClick={handleIssueInvoice}
              disabled={issuing}
            >
              {issuing ? (
                <>
                  <FiLoader className="button-spinner" />
                  Issuing...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Issue Invoice
                </>
              )}
            </button>
          )}

          {/* REFRESH */}
          <button
            type="button"
            className="invoice-refresh-btn"
            onClick={fetchInvoice}
            title="Refresh"
            disabled={issuing}
          >
            <FiRefreshCw />
          </button>

        </div>

      </div>


      {/* =========================
          SUCCESS / ERROR
      ========================== */}

      {error && (
        <div className="invoice-view-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="invoice-view-message success">
          <FiCheckCircle />
          {success}
        </div>
      )}


      {/* =========================
          TOP SUMMARY
      ========================== */}

      <div className="invoice-summary-grid">

        <div className="invoice-summary-card">

          <div className="invoice-summary-icon">
            <FiFileText />
          </div>

          <div>
            <span>
              Invoice Number
            </span>

            <strong>
              {invoice.invoiceNumber || "-"}
            </strong>
          </div>

        </div>


        <div className="invoice-summary-card">

          <div className="invoice-summary-icon">
            <FiCalendar />
          </div>

          <div>
            <span>
              Invoice Date
            </span>

            <strong>
              {formatDate(
                invoice.invoiceDate
              )}
            </strong>
          </div>

        </div>


        <div className="invoice-summary-card">

          <div className="invoice-summary-icon">
            <FiCreditCard />
          </div>

          <div>
            <span>
              Payment Status
            </span>

            <strong
              className={`payment-status-text ${getPaymentStatusClass(
                invoice.paymentStatus
              )}`}
            >
              {invoice.paymentStatus ||
                "UNPAID"}
            </strong>
          </div>

        </div>


        <div className="invoice-summary-card">

          <div className="invoice-summary-icon">
            <FiCreditCard />
          </div>

          <div>
            <span>
              Balance Due
            </span>

            <strong>
              {formatCurrency(
                invoice.balanceDue
              )}
            </strong>
          </div>

        </div>

      </div>


      {/* =========================
          COMPANY + BRANCH + CUSTOMER
      ========================== */}

      <div className="invoice-info-grid">

        <div className="invoice-info-card">

          <div className="invoice-info-card-header">

            <div className="invoice-info-icon">
              <FiFileText />
            </div>

            <h2>
              Company
            </h2>

          </div>

          <div className="invoice-info-content">

            <strong>
              {company.name ||
                company.legalName ||
                "-"}
            </strong>

            {company.legalName &&
              company.legalName !==
                company.name && (
                <span>
                  {company.legalName}
                </span>
              )}

            {company.email && (
              <span>
                {company.email}
              </span>
            )}

            {company.phone && (
              <span>
                {company.phone}
              </span>
            )}

            {company.gstNumber && (
              <span>
                GST: {company.gstNumber}
              </span>
            )}

          </div>

        </div>


        <div className="invoice-info-card">

          <div className="invoice-info-card-header">

            <div className="invoice-info-icon">
              <FiMapPin />
            </div>

            <h2>
              Branch
            </h2>

          </div>

          <div className="invoice-info-content">

            <strong>
              {branch.name || "-"}
            </strong>

            {branch.code && (
              <span>
                Code: {branch.code}
              </span>
            )}

            {branch.email && (
              <span>
                {branch.email}
              </span>
            )}

            {branch.phone && (
              <span>
                {branch.phone}
              </span>
            )}

          </div>

        </div>


        <div className="invoice-info-card">

          <div className="invoice-info-card-header">

            <div className="invoice-info-icon">
              <FiUser />
            </div>

            <h2>
              Customer
            </h2>

          </div>

          <div className="invoice-info-content">

            <strong>
              {customer.name || "-"}
            </strong>

            {customer.customerCode && (
              <span>
                {customer.customerCode}
              </span>
            )}

            {customer.email && (
              <span>
                {customer.email}
              </span>
            )}

            {customer.phone && (
              <span>
                {customer.phone}
              </span>
            )}

          </div>

        </div>

      </div>


      {/* =========================
          SALES ORDER + DATES
      ========================== */}

      <div className="invoice-detail-grid">

        <div className="invoice-detail-card">

          <span className="invoice-detail-label">
            Sales Order
          </span>

          <strong>
            {salesOrder.salesOrderNumber ||
              "-"}
          </strong>

          {salesOrder.status && (
            <small>
              Status: {salesOrder.status}
            </small>
          )}

        </div>


        <div className="invoice-detail-card">

          <span className="invoice-detail-label">
            Invoice Date
          </span>

          <strong>
            {formatDate(
              invoice.invoiceDate
            )}
          </strong>

        </div>


        <div className="invoice-detail-card">

          <span className="invoice-detail-label">
            Due Date
          </span>

          <strong>
            {formatDate(invoice.dueDate)}
          </strong>

        </div>


        <div className="invoice-detail-card">

          <span className="invoice-detail-label">
            Sales Person
          </span>

          <strong>
            {invoice.salesPerson?.name ||
              "-"}
          </strong>

        </div>

      </div>


      {/* =========================
          ITEMS
      ========================== */}

      <div className="invoice-items-card">

        <div className="invoice-section-header">

          <div>

            <h2>
              Invoice Items
            </h2>

            <span>
              {items.length} item
              {items.length !== 1
                ? "s"
                : ""}
            </span>

          </div>

          <FiPackage />

        </div>


        <div className="invoice-items-wrapper">

          <table className="invoice-items-table">

            <thead>

              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>

            </thead>

            <tbody>

              {items.map(
                (item, index) => {

                  const product =
                    item.product || {};

                  return (
                    <tr
                      key={
                        item._id ||
                        index
                      }
                    >

                      <td>
                        {index + 1}
                      </td>

                      <td>

                        <div className="invoice-product">

                          <strong>
                            {product.name ||
                              item.description ||
                              "Product"}
                          </strong>

                          {product.sku && (
                            <span>
                              SKU:{" "}
                              {product.sku}
                            </span>
                          )}

                        </div>

                      </td>

                      <td>
                        {item.description ||
                          "-"}
                      </td>

                      <td>
                        {item.quantity}
                      </td>

                      <td>
                        {formatCurrency(
                          item.unitPrice
                        )}
                      </td>

                      <td>

                        <div className="invoice-cell-stack">

                          <span>
                            {item.discountPercent ||
                              0}
                            %
                          </span>

                          <small>
                            -
                            {formatCurrency(
                              item.discountAmount
                            )}
                          </small>

                        </div>

                      </td>

                      <td>

                        <div className="invoice-cell-stack">

                          <span>
                            {item.taxPercent ||
                              0}
                            %
                          </span>

                          <small>
                            {formatCurrency(
                              item.taxAmount
                            )}
                          </small>

                        </div>

                      </td>

                      <td>

                        <strong>
                          {formatCurrency(
                            item.lineTotal
                          )}
                        </strong>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =========================
          NOTES + TOTALS
      ========================== */}

      <div className="invoice-bottom-grid">

        <div className="invoice-notes-card">

          <h2>
            Notes
          </h2>

          <p>
            {invoice.notes ||
              "No notes added for this invoice."}
          </p>

          <h2>
            Terms & Conditions
          </h2>

          <p className="invoice-terms">
            {invoice.termsAndConditions ||
              "No terms and conditions added."}
          </p>

        </div>


        <div className="invoice-totals-card">

          <div className="invoice-total-row">

            <span>
              Subtotal
            </span>

            <strong>
              {formatCurrency(
                invoice.subtotal
              )}
            </strong>

          </div>


          <div className="invoice-total-row">

            <span>
              Discount
            </span>

            <strong className="discount">
              -
              {formatCurrency(
                invoice.discountAmount
              )}
            </strong>

          </div>


          <div className="invoice-total-row">

            <span>
              Taxable Amount
            </span>

            <strong>
              {formatCurrency(
                invoice.taxableAmount
              )}
            </strong>

          </div>


          <div className="invoice-total-row">

            <span>
              Tax
            </span>

            <strong>
              {formatCurrency(
                invoice.taxAmount
              )}
            </strong>

          </div>


          <div className="invoice-total-divider" />


          <div className="invoice-total-row grand-total">

            <span>
              Grand Total
            </span>

            <strong>
              {formatCurrency(
                invoice.grandTotal
              )}
            </strong>

          </div>


          <div className="invoice-total-row">

            <span>
              Paid Amount
            </span>

            <strong className="paid">
              {formatCurrency(
                invoice.paidAmount
              )}
            </strong>

          </div>


          <div className="invoice-total-row balance">

            <span>
              Balance Due
            </span>

            <strong>
              {formatCurrency(
                invoice.balanceDue
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* =========================
          FOOTER ACTIONS
      ========================== */}

      <div className="invoice-view-footer">

        <button
          type="button"
          className="invoice-footer-back"
          onClick={() =>
            navigate("/sales/invoices")
          }
        >
          <FiArrowLeft />
          Back to Invoices
        </button>

        <div className="invoice-footer-actions">

          {invoice.status === "DRAFT" && (
            <Link
              to={`/sales/invoices/${invoice._id}/edit`}
              className="invoice-footer-edit"
            >
              <FiEdit2 />
              Edit Invoice
            </Link>
          )}

          {invoice.status === "DRAFT" && (
            <button
              type="button"
              className="invoice-footer-issue"
              onClick={handleIssueInvoice}
              disabled={issuing}
            >
              {issuing ? (
                <>
                  <FiLoader className="button-spinner" />
                  Issuing...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Issue Invoice
                </>
              )}
            </button>
          )}

        </div>

      </div>

    </div>
  );
}

export default SalesInvoiceView;