import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCreditCard,
  FiFileText,
  FiUser,
  FiCalendar,
  FiBriefcase,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiDollarSign,
  FiHash,
  FiEdit3,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-payment-view.css";

function SalesPaymentView() {
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // FETCH PAYMENT
  // ==================================================

  const fetchPayment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/sales-payments/${id}`);

      const data = response.data?.data;

      if (!data) {
        setError("Payment details not found.");
        return;
      }

      setPayment(data);
    } catch (err) {
      console.error("Fetch sales payment error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load sales payment."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPayment();
    }
  }, [id]);

  // ==================================================
  // HELPERS
  // ==================================================

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

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerName = () => {
    if (!payment?.customer) return "-";

    return (
      payment.customer.name ||
      payment.customer.companyName ||
      payment.customer.customerCode ||
      "-"
    );
  };

  const getCompanyName = () => {
    if (!payment?.company) return "-";

    return (
      payment.company.name ||
      payment.company.legalName ||
      "-"
    );
  };

  const getBranchName = () => {
    if (!payment?.branch) return "-";

    return payment.branch.name || "-";
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      CASH: "Cash",
      UPI: "UPI",
      BANK_TRANSFER: "Bank Transfer",
      CARD: "Card",
      CHEQUE: "Cheque",
      OTHER: "Other",
    };

    return methods[method] || method || "-";
  };

  // ==================================================
  // STATUS
  // ==================================================

  const paymentStatus = String(
    payment?.status || ""
  ).toUpperCase();

  const isCancelled = paymentStatus === "CANCELLED";
  const isSuccess = paymentStatus === "SUCCESS";

  // ==================================================
  // CANCEL PAYMENT
  // ==================================================

  const openCancelModal = () => {
    setCancellationReason("");
    setCancelError("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    if (cancelling) return;

    setShowCancelModal(false);
    setCancellationReason("");
    setCancelError("");
  };

  const handleCancelPayment = async () => {
    const reason = cancellationReason.trim();

    if (!reason) {
      setCancelError("Cancellation reason is required.");
      return;
    }

    if (reason.length < 3) {
      setCancelError(
        "Please enter a valid cancellation reason."
      );
      return;
    }

    try {
      setCancelling(true);
      setCancelError("");
      setSuccess("");

      const response = await api.patch(
        `/sales-payments/${id}/cancel`,
        {
          cancellationReason: reason,
        }
      );

      if (response.data?.success) {
        /*
         * After cancellation, fetch the payment again.
         * This guarantees that salesInvoice, customer,
         * company, branch and other populated data remain
         * available in the UI.
         */
        await fetchPayment();

        setShowCancelModal(false);
        setCancellationReason("");

        setSuccess(
          response.data?.message ||
            "Sales Payment cancelled successfully."
        );
      } else {
        setCancelError(
          response.data?.message ||
            "Failed to cancel payment."
        );
      }
    } catch (err) {
      console.error(
        "Cancel sales payment error:",
        err
      );

      setCancelError(
        err.response?.data?.message ||
          "Failed to cancel sales payment."
      );
    } finally {
      setCancelling(false);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="sales-payment-view-page">
        <div className="sales-payment-view-loading">
          <div className="sales-payment-spinner" />

          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error || !payment) {
    return (
      <div className="sales-payment-view-page">
        <div className="sales-payment-view-error-state">
          <div className="sales-payment-error-icon">
            <FiAlertCircle />
          </div>

          <h2>Payment Not Found</h2>

          <p>
            {error ||
              "The requested sales payment could not be found."}
          </p>

          <div className="sales-payment-error-actions">
            <button
              type="button"
              className="sales-payment-retry-btn"
              onClick={fetchPayment}
            >
              <FiRefreshCw />
              Retry
            </button>

            <Link
              to="/sales/payments"
              className="sales-payment-back-btn"
            >
              <FiArrowLeft />
              Back to Payments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="sales-payment-view-page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="sales-payment-view-header">

        <div className="sales-payment-view-header-left">

          <Link
            to="/sales/payments"
            className="sales-payment-view-back"
          >
            <FiArrowLeft />
          </Link>

          <div>
            <div className="sales-payment-view-title-row">

              <h1>Sales Payment</h1>

              <span
                className={`sales-payment-status-badge ${
                  isCancelled
                    ? "cancelled"
                    : isSuccess
                    ? "success"
                    : "pending"
                }`}
              >
                {isCancelled ? (
                  <FiXCircle />
                ) : (
                  <FiCheckCircle />
                )}

                {payment.status || "-"}
              </span>

            </div>

            <p>
              View payment transaction and invoice
              settlement details.
            </p>
          </div>
        </div>

        <div className="sales-payment-view-header-actions">

          <button
            type="button"
            className="sales-payment-refresh-btn"
            onClick={fetchPayment}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>

          {isSuccess && (
            <button
              type="button"
              className="sales-payment-cancel-btn"
              onClick={openCancelModal}
            >
              <FiXCircle />
              Cancel Payment
            </button>
          )}

        </div>
      </div>

      {/* ==================================================
          SUCCESS MESSAGE
          ================================================== */}

      {success && (
        <div className="sales-payment-view-message success">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* ==================================================
          CANCELLED MESSAGE
          ================================================== */}

      {isCancelled && (
        <div className="sales-payment-view-message cancelled">
          <FiXCircle />

          <div>
            <strong>Payment Cancelled</strong>

            <span>
              This payment has been cancelled and the
              amount has been restored to the invoice
              balance.
            </span>
          </div>
        </div>
      )}

      {/* ==================================================
          PAYMENT HERO
          ================================================== */}

      <section className="sales-payment-hero">

        <div className="sales-payment-hero-left">

          <div className="sales-payment-hero-icon">
            <FiCreditCard />
          </div>

          <div>
            <span className="sales-payment-hero-label">
              PAYMENT NUMBER
            </span>

            <h2>
              {payment.paymentNumber || "-"}
            </h2>

            <span className="sales-payment-hero-date">
              <FiCalendar />
              {formatDate(payment.paymentDate)}
            </span>
          </div>

        </div>

        <div className="sales-payment-hero-amount">

          <span>Total Payment</span>

          <strong>
            ₹{formatCurrency(payment.amount)}
          </strong>

          <small>
            {getPaymentMethodLabel(
              payment.paymentMethod
            )}
          </small>

        </div>

      </section>

      {/* ==================================================
          PAYMENT INFORMATION
          ================================================== */}

      <section className="sales-payment-view-card">

        <div className="sales-payment-view-card-header">

          <div className="sales-payment-view-section-icon">
            <FiCreditCard />
          </div>

          <div>
            <h2>Payment Information</h2>

            <p>
              Details of the recorded payment.
            </p>
          </div>

        </div>

        <div className="sales-payment-info-grid">

          <div className="sales-payment-info-item">
            <span>Payment Number</span>

            <strong>
              <FiHash />
              {payment.paymentNumber || "-"}
            </strong>
          </div>

          <div className="sales-payment-info-item">
            <span>Payment Method</span>

            <strong>
              <FiCreditCard />
              {getPaymentMethodLabel(
                payment.paymentMethod
              )}
            </strong>
          </div>

          <div className="sales-payment-info-item">
            <span>Payment Date</span>

            <strong>
              <FiCalendar />
              {formatDate(payment.paymentDate)}
            </strong>
          </div>

          <div className="sales-payment-info-item">
            <span>Amount</span>

            <strong className="amount">
              <FiDollarSign />
              ₹{formatCurrency(payment.amount)}
            </strong>
          </div>

          <div className="sales-payment-info-item">
            <span>Transaction Reference</span>

            <strong>
              <FiFileText />
              {payment.transactionReference ||
                "Not provided"}
            </strong>
          </div>

          <div className="sales-payment-info-item">
            <span>Status</span>

            <strong
              className={
                isCancelled
                  ? "status-cancelled"
                  : "status-success"
              }
            >
              {isCancelled ? (
                <FiXCircle />
              ) : (
                <FiCheckCircle />
              )}

              {payment.status || "-"}
            </strong>
          </div>

        </div>
      </section>

      {/* ==================================================
          INVOICE DETAILS
          ================================================== */}

      <section className="sales-payment-view-card">

        <div className="sales-payment-view-card-header">

          <div className="sales-payment-view-section-icon">
            <FiFileText />
          </div>

          <div>
            <h2>Sales Invoice</h2>

            <p>
              Invoice against which this payment was
              recorded.
            </p>
          </div>

        </div>

        <div className="sales-payment-invoice-content">

          <div className="sales-payment-invoice-main">

            <div className="sales-payment-invoice-number">
              <span>Invoice Number</span>

              <strong>
                {payment.salesInvoice?.invoiceNumber ||
                  "-"}
              </strong>
            </div>

            <div className="sales-payment-invoice-grid">

              <div>
                <span>Invoice Date</span>

                <strong>
                  {formatDate(
                    payment.salesInvoice?.invoiceDate
                  )}
                </strong>
              </div>

              <div>
                <span>Due Date</span>

                <strong>
                  {formatDate(
                    payment.salesInvoice?.dueDate
                  )}
                </strong>
              </div>

              <div>
                <span>Invoice Total</span>

                <strong>
                  ₹
                  {formatCurrency(
                    payment.salesInvoice?.grandTotal
                  )}
                </strong>
              </div>

              <div>
                <span>Paid Amount</span>

                <strong className="paid-value">
                  ₹
                  {formatCurrency(
                    payment.salesInvoice?.paidAmount
                  )}
                </strong>
              </div>

              <div>
                <span>Balance Due</span>

                <strong className="balance-value">
                  ₹
                  {formatCurrency(
                    payment.salesInvoice?.balanceDue
                  )}
                </strong>
              </div>

              <div>
                <span>Payment Status</span>

                <strong>
                  {payment.salesInvoice?.paymentStatus ||
                    "-"}
                </strong>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==================================================
          CUSTOMER + COMPANY
          ================================================== */}

      <div className="sales-payment-two-column">

        {/* CUSTOMER */}

        <section className="sales-payment-view-card">

          <div className="sales-payment-view-card-header">

            <div className="sales-payment-view-section-icon">
              <FiUser />
            </div>

            <div>
              <h2>Customer</h2>

              <p>
                Customer associated with this payment.
              </p>
            </div>

          </div>

          <div className="sales-payment-detail-list">

            <div className="sales-payment-detail-row">
              <span>Customer Code</span>

              <strong>
                {payment.customer?.customerCode ||
                  "-"}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Name</span>

              <strong>
                {getCustomerName()}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Email</span>

              <strong>
                {payment.customer?.email || "-"}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Phone</span>

              <strong>
                {payment.customer?.phone || "-"}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Alternate Phone</span>

              <strong>
                {payment.customer?.alternatePhone ||
                  "-"}
              </strong>
            </div>

          </div>
        </section>

        {/* COMPANY / BRANCH */}

        <section className="sales-payment-view-card">

          <div className="sales-payment-view-card-header">

            <div className="sales-payment-view-section-icon">
              <FiBriefcase />
            </div>

            <div>
              <h2>Company & Branch</h2>

              <p>
                Business information for this payment.
              </p>
            </div>

          </div>

          <div className="sales-payment-detail-list">

            <div className="sales-payment-detail-row">
              <span>Company</span>

              <strong>
                <FiBriefcase />
                {getCompanyName()}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Branch</span>

              <strong>
                <FiMapPin />
                {getBranchName()}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Branch Code</span>

              <strong>
                {payment.branch?.branchCode || "-"}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Sales Order</span>

              <strong>
                {payment.salesOrder?.salesOrderNumber ||
                  "Not linked"}
              </strong>
            </div>

            <div className="sales-payment-detail-row">
              <span>Created By</span>

              <strong>
                {payment.createdBy?.name ||
                  payment.createdBy?.email ||
                  "-"}
              </strong>
            </div>

          </div>
        </section>

      </div>

      {/* ==================================================
          NOTES
          ================================================== */}

      {payment.notes && (
        <section className="sales-payment-view-card">

          <div className="sales-payment-view-card-header">

            <div className="sales-payment-view-section-icon">
              <FiEdit3 />
            </div>

            <div>
              <h2>Notes</h2>

              <p>
                Additional information recorded with
                this payment.
              </p>
            </div>

          </div>

          <div className="sales-payment-notes">
            {payment.notes}
          </div>

        </section>
      )}

      {/* ==================================================
          CANCELLATION DETAILS
          ================================================== */}

      {isCancelled && (
        <section className="sales-payment-view-card cancellation-card">

          <div className="sales-payment-view-card-header">

            <div className="sales-payment-view-section-icon cancellation-icon">
              <FiXCircle />
            </div>

            <div>
              <h2>Cancellation Details</h2>

              <p>
                Information about why this payment was
                cancelled.
              </p>
            </div>

          </div>

          <div className="cancellation-details">

            <div className="cancellation-detail-item">
              <span>Cancellation Reason</span>

              <strong>
                {payment.cancellationReason ||
                  "No reason provided"}
              </strong>
            </div>

            <div className="cancellation-detail-item">
              <span>Cancelled At</span>

              <strong>
                {formatDateTime(
                  payment.cancelledAt
                )}
              </strong>
            </div>

          </div>
        </section>
      )}

      {/* ==================================================
          FOOTER
          ================================================== */}

      <div className="sales-payment-view-footer">

        <Link
          to="/sales/payments"
          className="sales-payment-footer-back"
        >
          <FiArrowLeft />
          Back to Sales Payments
        </Link>

        {isSuccess && (
          <button
            type="button"
            className="sales-payment-footer-cancel"
            onClick={openCancelModal}
          >
            <FiXCircle />
            Cancel Payment
          </button>
        )}

      </div>

      {/* ==================================================
          CANCEL MODAL
          ================================================== */}

      {showCancelModal && (
        <div
          className="sales-payment-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !cancelling
            ) {
              closeCancelModal();
            }
          }}
        >
          <div className="sales-payment-modal">

            <div className="sales-payment-modal-header">

              <div className="sales-payment-modal-icon">
                <FiXCircle />
              </div>

              <div>
                <h3>Cancel Payment</h3>

                <p>
                  This action will reverse the payment
                  amount from the invoice.
                </p>
              </div>

              <button
                type="button"
                className="sales-payment-modal-close"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                ×
              </button>

            </div>

            <div className="sales-payment-modal-warning">

              <FiAlertCircle />

              <div>
                <strong>
                  Payment cancellation cannot be
                  undone.
                </strong>

                <span>
                  The payment amount of ₹
                  {formatCurrency(payment.amount)} will be
                  removed from the invoice's paid amount
                  and restored to its balance due.
                </span>
              </div>

            </div>

            {cancelError && (
              <div className="sales-payment-modal-error">
                <FiAlertCircle />
                {cancelError}
              </div>
            )}

            <div className="sales-payment-modal-field">

              <label>
                Cancellation Reason
                <span>*</span>
              </label>

              <textarea
                value={cancellationReason}
                onChange={(e) => {
                  setCancellationReason(
                    e.target.value
                  );
                  setCancelError("");
                }}
                placeholder="Enter the reason for cancelling this payment..."
                rows="4"
                maxLength={500}
                disabled={cancelling}
                autoFocus
              />

              <small>
                {cancellationReason.length}/500
              </small>

            </div>

            <div className="sales-payment-modal-actions">

              <button
                type="button"
                className="sales-payment-modal-secondary"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Keep Payment
              </button>

              <button
                type="button"
                className="sales-payment-modal-danger"
                onClick={handleCancelPayment}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <span className="sales-payment-button-spinner" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <FiXCircle />
                    Confirm Cancellation
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

export default SalesPaymentView;