/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiFileText,
  FiUser,
  FiPackage,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiCreditCard,
  FiInfo,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-return-view.css";

function SalesReturnView() {
  const { id } = useParams();

  const [salesReturn, setSalesReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSalesReturn = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/sales-returns/${id}`);

      setSalesReturn(response.data?.data || null);
    } catch (err) {
      console.error("Fetch Sales Return Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load sales return."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturn();
  }, [id]);

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date, includeTime = false) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(includeTime && {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

  const getStatusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  const getSettlementLabel = (type) => {
    const labels = {
      REFUND: "Refund",
      CREDIT_NOTE: "Credit Note",
      ADJUST_INVOICE: "Adjust Invoice",
      NONE: "None",
    };

    return labels[type] || type || "None";
  };

  const calculateLineTotal = (item) => {
    if (item?.lineTotal !== undefined) {
      return Number(item.lineTotal || 0);
    }

    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice || 0);
    const discountPercent = Number(
      item?.discountPercent || 0
    );
    const taxPercent = Number(item?.taxPercent || 0);

    const gross = quantity * unitPrice;
    const discount =
      gross * (discountPercent / 100);

    const taxable = gross - discount;
    const tax = taxable * (taxPercent / 100);

    return taxable + tax;
  };

  if (loading) {
    return (
      <div className="sales-return-view-page">
        <div className="sales-return-view-loading">
          <FiRefreshCw className="sales-return-view-spin" />
          <span>Loading sales return...</span>
        </div>
      </div>
    );
  }

  if (error || !salesReturn) {
    return (
      <div className="sales-return-view-page">
        <div className="sales-return-view-error-page">
          <div className="sales-return-view-error-icon">
            <FiInfo />
          </div>

          <h2>Sales Return Not Found</h2>

          <p>{error || "The requested sales return could not be found."}</p>

          <div className="sales-return-view-error-actions">
            <button
              type="button"
              onClick={fetchSalesReturn}
              className="sales-return-view-retry-btn"
            >
              <FiRefreshCw />
              Retry
            </button>

            <Link
              to="/sales/returns"
              className="sales-return-view-back-btn"
            >
              <FiArrowLeft />
              Back to Returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invoice = salesReturn.salesInvoice;
  const customer = salesReturn.customer;
  const warehouse = salesReturn.warehouse;
  const company = salesReturn.company;
  const branch = salesReturn.branch;

  const items = salesReturn.items || [];

  const statusClass = getStatusClass(
    salesReturn.status
  );

  return (
    <div className="sales-return-view-page">
      {/* Header */}
      <div className="sales-return-view-header">
        <div className="sales-return-view-header-left">
          <Link
            to="/sales/returns"
            className="sales-return-view-back"
          >
            <FiArrowLeft />
          </Link>

          <div className="sales-return-view-title-icon">
            <FiRefreshCw />
          </div>

          <div>
            <div className="sales-return-view-title-line">
              <h1>
                {salesReturn.returnNumber || "Sales Return"}
              </h1>

              <span
                className={`sales-return-view-status status-${statusClass}`}
              >
                <span />
                {salesReturn.status || "UNKNOWN"}
              </span>
            </div>

            <p>
              Sales return transaction details and accounting
              information.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="sales-return-view-refresh-btn"
          onClick={fetchSalesReturn}
          disabled={loading}
          title="Refresh"
        >
          <FiRefreshCw
            className={
              loading ? "sales-return-view-spin" : ""
            }
          />
        </button>
      </div>

      {/* Summary */}
      <div className="sales-return-view-summary">
        <div className="sales-return-view-summary-card">
          <div className="sales-return-view-summary-icon">
            <FiHash />
          </div>

          <div>
            <span>Return Number</span>
            <strong>
              {salesReturn.returnNumber || "-"}
            </strong>
          </div>
        </div>

        <div className="sales-return-view-summary-card">
          <div className="sales-return-view-summary-icon">
            <FiFileText />
          </div>

          <div>
            <span>Invoice</span>
            <strong>
              {invoice?.invoiceNumber || "-"}
            </strong>
          </div>
        </div>

        <div className="sales-return-view-summary-card">
          <div className="sales-return-view-summary-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Return Total</span>
            <strong>
              {formatAmount(salesReturn.grandTotal)}
            </strong>
          </div>
        </div>

        <div className="sales-return-view-summary-card">
          <div className="sales-return-view-summary-icon">
            <FiPackage />
          </div>

          <div>
            <span>Returned Items</span>
            <strong>{items.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Information */}
      <div className="sales-return-view-main-grid">
        {/* Return Information */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Return Information</h2>
              <p>Basic return transaction details.</p>
            </div>

            <FiRefreshCw />
          </div>

          <div className="sales-return-view-detail-grid">
            <div className="sales-return-view-detail-item">
              <span>Return Number</span>
              <strong>
                {salesReturn.returnNumber || "-"}
              </strong>
            </div>

            <div className="sales-return-view-detail-item">
              <span>Return Date</span>
              <strong>
                {formatDate(salesReturn.returnDate)}
              </strong>
            </div>

            <div className="sales-return-view-detail-item">
              <span>Status</span>
              <strong
                className={`sales-return-view-inline-status status-${statusClass}`}
              >
                {salesReturn.status || "-"}
              </strong>
            </div>

            <div className="sales-return-view-detail-item">
              <span>Settlement</span>
              <strong>
                {getSettlementLabel(
                  salesReturn.settlementType
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Invoice Information</h2>
              <p>Original sales invoice.</p>
            </div>

            <FiFileText />
          </div>

          <div className="sales-return-view-detail-grid">
            <div className="sales-return-view-detail-item">
              <span>Invoice Number</span>
              <strong>
                {invoice?.invoiceNumber || "-"}
              </strong>
            </div>

            <div className="sales-return-view-detail-item">
              <span>Invoice Date</span>
              <strong>
                {formatDate(invoice?.invoiceDate)}
              </strong>
            </div>

            <div className="sales-return-view-detail-item">
              <span>Invoice Total</span>
              <strong>
                {formatAmount(invoice?.grandTotal)}
              </strong>
            </div>

            <div className="sales-return-view-detail-item">
              <span>Payment Status</span>
              <strong>
                {invoice?.paymentStatus || "-"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Customer + Warehouse + Company */}
      <div className="sales-return-view-three-grid">
        {/* Customer */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Customer</h2>
              <p>Customer information.</p>
            </div>

            <FiUser />
          </div>

          <div className="sales-return-view-profile">
            <div className="sales-return-view-profile-icon">
              <FiUser />
            </div>

            <div>
              <strong>
                {customer?.name || "Unknown Customer"}
              </strong>

              <span>
                {customer?.customerCode || "-"}
              </span>
            </div>
          </div>

          <div className="sales-return-view-contact-list">
            <div>
              <FiUser />
              <span>
                {customer?.email || "No email"}
              </span>
            </div>

            <div>
              <FiCreditCard />
              <span>
                {customer?.phone || "No phone"}
              </span>
            </div>
          </div>
        </div>

        {/* Warehouse */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Warehouse</h2>
              <p>Stock return destination.</p>
            </div>

            <FiPackage />
          </div>

          <div className="sales-return-view-profile">
            <div className="sales-return-view-profile-icon">
              <FiPackage />
            </div>

            <div>
              <strong>
                {warehouse?.name || "-"}
              </strong>

              <span>
                {warehouse?.code || "Warehouse"}
              </span>
            </div>
          </div>

          <div className="sales-return-view-contact-list">
            <div>
              <FiMapPin />
              <span>
                {branch?.name || "Branch not available"}
              </span>
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Company</h2>
              <p>Business information.</p>
            </div>

            <FiBriefcase />
          </div>

          <div className="sales-return-view-profile">
            <div className="sales-return-view-profile-icon">
              <FiBriefcase />
            </div>

            <div>
              <strong>
                {company?.name || "-"}
              </strong>

              <span>
                {company?.legalName || "-"}
              </span>
            </div>
          </div>

          <div className="sales-return-view-contact-list">
            <div>
              <FiMapPin />
              <span>
                {branch?.name || "Branch not available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Returned Items */}
      <div className="sales-return-view-card sales-return-view-items-card">
        <div className="sales-return-view-card-header">
          <div>
            <h2>Returned Items</h2>
            <p>
              Products included in this sales return.
            </p>
          </div>

          <FiPackage />
        </div>

        <div className="sales-return-view-items-wrapper">
          <table className="sales-return-view-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Line Total</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="sales-return-view-no-items"
                  >
                    No return items found.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const product = item.product;

                  return (
                    <tr key={item._id || index}>
                      <td>
                        <div className="sales-return-view-product">
                          <div className="sales-return-view-product-icon">
                            <FiPackage />
                          </div>

                          <div>
                            <strong>
                              {product?.name ||
                                item.description ||
                                "Product"}
                            </strong>

                            <span>
                              {item.description || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {product?.sku || "-"}
                      </td>

                      <td>
                        <strong>
                          {Number(
                            item.quantity || 0
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatAmount(item.unitPrice)}
                      </td>

                      <td>
                        {Number(
                          item.discountPercent || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        {Number(
                          item.taxPercent || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        <strong className="sales-return-view-line-total">
                          {formatAmount(
                            calculateLineTotal(item)
                          )}
                        </strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + Settlement */}
      <div className="sales-return-view-bottom-grid">
        {/* Reason */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Return Reason & Notes</h2>
              <p>Additional transaction information.</p>
            </div>

            <FiInfo />
          </div>

          <div className="sales-return-view-notes">
            <div className="sales-return-view-note-block">
              <span>Reason</span>
              <p>
                {salesReturn.reason ||
                  "No reason provided."}
              </p>
            </div>

            <div className="sales-return-view-note-block">
              <span>Notes</span>
              <p>
                {salesReturn.notes ||
                  "No additional notes."}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="sales-return-view-card">
          <div className="sales-return-view-card-header">
            <div>
              <h2>Amount Summary</h2>
              <p>Return financial breakdown.</p>
            </div>

            <FiDollarSign />
          </div>

          <div className="sales-return-view-amounts">
            <div>
              <span>Subtotal</span>
              <strong>
                {formatAmount(
                  salesReturn.subtotal
                )}
              </strong>
            </div>

            <div>
              <span>Discount</span>
              <strong>
                {formatAmount(
                  salesReturn.discountAmount
                )}
              </strong>
            </div>

            <div>
              <span>Taxable Amount</span>
              <strong>
                {formatAmount(
                  salesReturn.taxableAmount
                )}
              </strong>
            </div>

            <div>
              <span>Tax</span>
              <strong>
                {formatAmount(
                  salesReturn.taxAmount
                )}
              </strong>
            </div>

            <div className="sales-return-view-grand-total">
              <span>Grand Total</span>
              <strong>
                {formatAmount(
                  salesReturn.grandTotal
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Details */}
      <div className="sales-return-view-card sales-return-view-settlement-card">
        <div className="sales-return-view-card-header">
          <div>
            <h2>Settlement Details</h2>
            <p>
              How the return amount was settled.
            </p>
          </div>

          <FiDollarSign />
        </div>

        <div className="sales-return-view-settlement-grid">
          <div>
            <span>Settlement Type</span>
            <strong>
              {getSettlementLabel(
                salesReturn.settlementType
              )}
            </strong>
          </div>

          <div>
            <span>Refund Amount</span>
            <strong>
              {formatAmount(
                salesReturn.refundAmount
              )}
            </strong>
          </div>

          <div>
            <span>Credit Amount</span>
            <strong>
              {formatAmount(
                salesReturn.creditAmount
              )}
            </strong>
          </div>

          <div>
            <span>Return Total</span>
            <strong>
              {formatAmount(
                salesReturn.grandTotal
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="sales-return-view-card sales-return-view-audit-card">
        <div className="sales-return-view-card-header">
          <div>
            <h2>Transaction Timeline</h2>
            <p>
              Return creation and processing information.
            </p>
          </div>

          <FiClock />
        </div>

        <div className="sales-return-view-timeline">
          <div className="sales-return-view-timeline-item">
            <div className="sales-return-view-timeline-icon">
              <FiCheckCircle />
            </div>

            <div>
              <strong>Return Created</strong>

              <span>
                {formatDate(
                  salesReturn.createdAt,
                  true
                )}
              </span>
            </div>
          </div>

          {salesReturn.approvedAt && (
            <div className="sales-return-view-timeline-item">
              <div className="sales-return-view-timeline-icon">
                <FiCheckCircle />
              </div>

              <div>
                <strong>Return Approved</strong>

                <span>
                  {formatDate(
                    salesReturn.approvedAt,
                    true
                  )}
                </span>

                {salesReturn.approvedBy?.name && (
                  <small>
                    By {salesReturn.approvedBy.name}
                  </small>
                )}
              </div>
            </div>
          )}

          {salesReturn.processedAt && (
            <div className="sales-return-view-timeline-item">
              <div className="sales-return-view-timeline-icon">
                <FiPackage />
              </div>

              <div>
                <strong>Return Processed</strong>

                <span>
                  {formatDate(
                    salesReturn.processedAt,
                    true
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sales-return-view-footer">
        <Link
          to="/sales/returns"
          className="sales-return-view-footer-back"
        >
          <FiArrowLeft />
          Back to Sales Returns
        </Link>
      </div>
    </div>
  );
}

export default SalesReturnView;