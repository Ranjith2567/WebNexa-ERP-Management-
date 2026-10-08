import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiRefreshCw,
  FiFileText,
  FiChevronDown,
  FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-order-view.css";

function SalesOrderView() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancellationReason, setCancellationReason] =
    useState("");
  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  // =========================
  // Fetch Sales Order
  // =========================
  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/sales-orders/${id}`
      );

      setOrder(
        response.data?.salesOrder || null
      );
    } catch (err) {
      console.error(
        "Failed to fetch sales order:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load sales order."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  // =========================
  // Available Statuses
  // =========================
  const getAvailableStatuses = (status) => {
    switch (status) {
      case "DRAFT":
        return [
          {
            value: "CONFIRMED",
            label: "Confirmed",
          },
          {
            value: "CANCELLED",
            label: "Cancelled",
          },
        ];

      case "CONFIRMED":
        return [
          {
            value: "PROCESSING",
            label: "Processing",
          },
          {
            value: "CANCELLED",
            label: "Cancelled",
          },
        ];

      case "PROCESSING":
        return [
          {
            value: "READY_TO_DELIVER",
            label: "Ready to Deliver",
          },
        ];

      case "READY_TO_DELIVER":
        return [
          {
            value: "COMPLETED",
            label: "Completed",
          },
        ];

      default:
        return [];
    }
  };

  // =========================
  // Status Class
  // =========================
  const getStatusClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "sales-order-view-status-draft";

      case "CONFIRMED":
        return "sales-order-view-status-confirmed";

      case "PROCESSING":
        return "sales-order-view-status-processing";

      case "READY_TO_DELIVER":
        return "sales-order-view-status-ready";

      case "COMPLETED":
        return "sales-order-view-status-completed";

      case "CANCELLED":
        return "sales-order-view-status-cancelled";

      default:
        return "";
    }
  };

  // =========================
  // Open Status Change
  // =========================
  const handleStatusSelect = (status) => {
    setShowStatusMenu(false);

    if (status === "CANCELLED") {
      setSelectedStatus("CANCELLED");
      setCancellationReason("");
      setShowCancelModal(true);
      return;
    }

    updateStatus(status);
  };

  // =========================
  // Update Status
  // =========================
  const updateStatus = async (
    status,
    reason = ""
  ) => {
    try {
      setUpdatingStatus(true);
      setError("");

      const payload = {
        status,
      };

      if (status === "CANCELLED") {
        payload.cancellationReason =
          reason.trim();
      }

      const response = await api.patch(
        `/sales-orders/${id}/status`,
        payload
      );

      if (response.data?.success) {
        setShowCancelModal(false);
        setCancellationReason("");
        setSelectedStatus("");

        await fetchOrder();
      } else {
        setError(
          response.data?.message ||
            "Failed to update order status."
        );
      }
    } catch (err) {
      console.error(
        "Sales order status update error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // =========================
  // Confirm Cancellation
  // =========================
  const handleCancelOrder = () => {
    const reason =
      cancellationReason.trim();

    if (!reason) {
      setError(
        "Cancellation reason is required."
      );
      return;
    }

    updateStatus(
      "CANCELLED",
      reason
    );
  };

  // =========================
  // Format Date
  // =========================
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================
  // Currency
  // =========================
  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <div className="sales-order-view-page">
        <div className="sales-order-view-loading">
          <FiRefreshCw className="loading-icon" />
          <span>
            Loading sales order...
          </span>
        </div>
      </div>
    );
  }

  // =========================
  // Error
  // =========================
  if (error && !order) {
    return (
      <div className="sales-order-view-page">
        <div className="sales-order-view-error">
          {error}
        </div>

        <Link
          to="/sales/orders"
          className="sales-order-view-back-btn"
        >
          <FiArrowLeft />
          Back to Sales Orders
        </Link>
      </div>
    );
  }

  // =========================
  // No Order
  // =========================
  if (!order) {
    return (
      <div className="sales-order-view-page">
        <div className="sales-order-view-error">
          Sales order not found.
        </div>

        <Link
          to="/sales/orders"
          className="sales-order-view-back-btn"
        >
          <FiArrowLeft />
          Back to Sales Orders
        </Link>
      </div>
    );
  }

  const availableStatuses =
    getAvailableStatuses(
      order.status
    );

  return (
    <div className="sales-order-view-page">

      {/* =========================
          Header
      ========================= */}
      <div className="sales-order-view-header">

        <div className="sales-order-view-header-left">

          <Link
            to="/sales/orders"
            className="sales-order-view-back-btn"
          >
            <FiArrowLeft />
          </Link>

          <div>
            <h1>
              {order.salesOrderNumber ||
                "Sales Order"}
            </h1>

            <p>
              View sales order details
            </p>
          </div>

        </div>

        <div className="sales-order-view-header-actions">

          {order.status === "DRAFT" && (
            <Link
              to={`/sales/orders/${order._id}/edit`}
              className="sales-order-view-edit-btn"
            >
              <FiEdit />
              Edit
            </Link>
          )}

          {availableStatuses.length > 0 && (
            <div
              className="sales-order-view-status-wrapper"
            >
              <button
                type="button"
                className="sales-order-view-status-change-btn"
                onClick={() =>
                  setShowStatusMenu(
                    (prev) => !prev
                  )
                }
                disabled={updatingStatus}
              >
                <span>
                  {updatingStatus
                    ? "Updating..."
                    : "Change Status"}
                </span>

                <FiChevronDown />
              </button>

              {showStatusMenu && (
                <div className="sales-order-view-status-menu">

                  {availableStatuses.map(
                    (status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() =>
                          handleStatusSelect(
                            status.value
                          )
                        }
                      >
                        {status.label}
                      </button>
                    )
                  )}

                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* =========================
          Error
      ========================= */}
      {error && (
        <div className="sales-order-view-error">
          {error}
        </div>
      )}

      {/* =========================
          Order Summary
      ========================= */}
      <div className="sales-order-view-card">

        <div className="sales-order-view-card-header">

          <div className="sales-order-view-card-title">
            <FiFileText />
            <h2>
              Order Information
            </h2>
          </div>

          <span
            className={`sales-order-view-status ${getStatusClass(
              order.status
            )}`}
          >
            {order.status || "-"}
          </span>

        </div>

        <div className="sales-order-view-grid">

          <div className="sales-order-view-field">
            <span>
              Sales Order Number
            </span>

            <strong>
              {order.salesOrderNumber ||
                "-"}
            </strong>
          </div>

          <div className="sales-order-view-field">
            <span>
              Order Date
            </span>

            <strong>
              {formatDate(
                order.orderDate
              )}
            </strong>
          </div>

          <div className="sales-order-view-field">
            <span>
              Expected Delivery
            </span>

            <strong>
              {formatDate(
                order.expectedDeliveryDate
              )}
            </strong>
          </div>

          <div className="sales-order-view-field">
            <span>
              Payment Status
            </span>

            <strong>
              {order.paymentStatus ||
                "UNPAID"}
            </strong>
          </div>

        </div>

      </div>

      {/* =========================
          Company / Branch / Customer
      ========================= */}
      <div className="sales-order-view-card">

        <div className="sales-order-view-card-header">

          <div className="sales-order-view-card-title">
            <h2>
              Business Information
            </h2>
          </div>

        </div>

        <div className="sales-order-view-grid">

          <div className="sales-order-view-field">
            <span>
              Company
            </span>

            <strong>
              {order.company?.name ||
                "-"}
            </strong>
          </div>

          <div className="sales-order-view-field">
            <span>
              Branch
            </span>

            <strong>
              {order.branch?.name ||
                "-"}
            </strong>
          </div>

          <div className="sales-order-view-field">
            <span>
              Customer
            </span>

            <strong>
              {order.customer?.name ||
                "-"}
            </strong>
          </div>

          <div className="sales-order-view-field">
            <span>
              Warehouse
            </span>

            <strong>
              {order.warehouse?.name ||
                "-"}
            </strong>
          </div>

        </div>

      </div>

      {/* =========================
          Order Items
      ========================= */}
      <div className="sales-order-view-card">

        <div className="sales-order-view-card-header">

          <div className="sales-order-view-card-title">
            <h2>
              Order Items
            </h2>
          </div>

        </div>

        <div className="sales-order-view-items-wrapper">

          <table className="sales-order-view-items">

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

              {order.items?.length > 0 ? (
                order.items.map(
                  (item, index) => (
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
                        <strong>
                          {item.product?.name ||
                            item.productName ||
                            "-"}
                        </strong>
                      </td>

                      <td>
                        {item.description ||
                          "-"}
                      </td>

                      <td>
                        {Number(
                          item.quantity ||
                            0
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.unitPrice
                        )}
                      </td>

                      <td>
                        {Number(
                          item.discountPercent ||
                            0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        {Number(
                          item.taxPercent ||
                            0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            item.lineTotal
                          )}
                        </strong>
                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="sales-order-view-empty"
                  >
                    No items found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =========================
          Totals
      ========================= */}
      <div className="sales-order-view-card">

        <div className="sales-order-view-totals">

          <div className="sales-order-view-total-row">
            <span>
              Subtotal
            </span>

            <strong>
              {formatCurrency(
                order.subtotal
              )}
            </strong>
          </div>

          <div className="sales-order-view-total-row">
            <span>
              Discount
            </span>

            <strong>
              -{" "}
              {formatCurrency(
                order.discountAmount
              )}
            </strong>
          </div>

          <div className="sales-order-view-total-row">
            <span>
              Tax
            </span>

            <strong>
              {formatCurrency(
                order.taxAmount
              )}
            </strong>
          </div>

          <div className="sales-order-view-total-row grand-total">
            <span>
              Total Amount
            </span>

            <strong>
              {formatCurrency(
                order.totalAmount
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* =========================
          Additional Information
      ========================= */}
      {(order.notes ||
        order.termsAndConditions) && (
        <div className="sales-order-view-card">

          <div className="sales-order-view-card-header">

            <div className="sales-order-view-card-title">
              <h2>
                Additional Information
              </h2>
            </div>

          </div>

          {order.notes && (
            <div className="sales-order-view-text-block">

              <span>
                Notes
              </span>

              <p>
                {order.notes}
              </p>

            </div>
          )}

          {order.termsAndConditions && (
            <div className="sales-order-view-text-block">

              <span>
                Terms & Conditions
              </span>

              <p>
                {order.termsAndConditions}
              </p>

            </div>
          )}

        </div>
      )}

      {/* =========================
          Cancellation Modal
      ========================= */}
      {showCancelModal && (
        <div className="sales-order-view-modal-overlay">

          <div className="sales-order-view-modal">

            <div className="sales-order-view-modal-header">

              <div>
                <h2>
                  Cancel Sales Order
                </h2>

                <p>
                  Please provide a reason
                  for cancellation.
                </p>
              </div>

              <button
                type="button"
                className="sales-order-view-modal-close"
                onClick={() => {
                  if (!updatingStatus) {
                    setShowCancelModal(
                      false
                    );
                    setCancellationReason(
                      ""
                    );
                    setError("");
                  }
                }}
                disabled={updatingStatus}
              >
                <FiX />
              </button>

            </div>

            <div className="sales-order-view-modal-body">

              <label>
                Cancellation Reason *
              </label>

              <textarea
                value={
                  cancellationReason
                }
                onChange={(e) => {
                  setCancellationReason(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="Enter cancellation reason..."
                rows="4"
                disabled={
                  updatingStatus
                }
              />

            </div>

            <div className="sales-order-view-modal-actions">

              <button
                type="button"
                className="sales-order-view-modal-cancel"
                onClick={() => {
                  if (!updatingStatus) {
                    setShowCancelModal(
                      false
                    );
                    setCancellationReason(
                      ""
                    );
                    setError("");
                  }
                }}
                disabled={updatingStatus}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sales-order-view-modal-confirm"
                onClick={
                  handleCancelOrder
                }
                disabled={
                  updatingStatus
                }
              >
                {updatingStatus
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default SalesOrderView;