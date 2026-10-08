import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-orders.css";

function SalesOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // =========================
  // Fetch Sales Orders
  // =========================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sales-orders");

      // Backend response:
      // {
      //   success: true,
      //   salesOrders: [...]
      // }
      setOrders(response.data?.salesOrders || []);
    } catch (err) {
      console.error("Failed to fetch sales orders:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load sales orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =========================
  // Search
  // =========================
  const filteredOrders = orders.filter((order) => {
    const searchText = search.toLowerCase().trim();

    return (
      order.salesOrderNumber
        ?.toLowerCase()
        .includes(searchText) ||
      order.customer?.name
        ?.toLowerCase()
        .includes(searchText) ||
      order.status
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  // =========================
  // Status Class
  // =========================
  const getStatusClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "status-draft";

      case "CONFIRMED":
        return "status-confirmed";

      case "PROCESSING":
        return "status-processing";

      case "READY_TO_DELIVER":
        return "status-ready";

      case "COMPLETED":
        return "status-completed";

      case "CANCELLED":
        return "status-cancelled";

      default:
        return "";
    }
  };

  // =========================
  // View Sales Order
  // =========================
  const handleView = (orderId) => {
    navigate(`/sales/orders/${orderId}`);
  };

  // =========================
  // Edit Sales Order
  // =========================
  const handleEdit = (order) => {
    // Backend allows editing only for DRAFT orders.
    if (order.status !== "DRAFT") {
      setError(
        "Only DRAFT sales orders can be edited."
      );
      return;
    }

    navigate(`/sales/orders/${order._id}/edit`);
  };

  // =========================
  // Delete Sales Order
  // =========================
  const handleDelete = async (order) => {
    // Backend allows delete only for DRAFT or CANCELLED.
    if (
      order.status !== "DRAFT" &&
      order.status !== "CANCELLED"
    ) {
      setError(
        "Only DRAFT or CANCELLED sales orders can be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${order.salesOrderNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(order._id);
      setError("");

      await api.delete(`/sales-orders/${order._id}`);

      // Remove deleted order immediately from UI
      setOrders((prevOrders) =>
        prevOrders.filter(
          (item) => item._id !== order._id
        )
      );
    } catch (err) {
      console.error(
        "Failed to delete sales order:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete sales order."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="sales-orders-page">

      {/* Header */}
      <div className="sales-orders-header">
        <div>
          <h1>Sales Orders</h1>
          <p>Manage customer sales orders</p>
        </div>

        <div className="sales-orders-header-actions">

          <button
            className="sales-orders-refresh-btn"
            onClick={fetchOrders}
            disabled={loading}
            title="Refresh"
          >
            <FiRefreshCw />
          </button>

          <Link
            to="/sales/orders/create"
            className="sales-orders-create-btn"
          >
            <FiPlus />
            Create Sales Order
          </Link>

        </div>
      </div>

      {/* Search */}
      <div className="sales-orders-toolbar">

        <div className="sales-orders-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search sales orders..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="sales-orders-error">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="sales-orders-table-wrapper">

        <table className="sales-orders-table">

          <thead>
            <tr>
              <th>Order No.</th>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="sales-orders-empty"
                >
                  Loading sales orders...
                </td>
              </tr>

            ) : filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="sales-orders-empty"
                >
                  {search
                    ? "No sales orders found."
                    : "No sales orders available."}
                </td>
              </tr>

            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id}>

                  {/* Order Number */}
                  <td>
                    <strong>
                      {order.salesOrderNumber || "-"}
                    </strong>
                  </td>

                  {/* Customer */}
                  <td>
                    {order.customer?.name || "-"}
                  </td>

                  {/* Order Date */}
                  <td>
                    {order.orderDate
                      ? new Date(
                          order.orderDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* Expected Delivery */}
                  <td>
                    {order.expectedDeliveryDate
                      ? new Date(
                          order.expectedDeliveryDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* Total */}
                  <td>
                    ₹
                    {Number(
                      order.totalAmount || 0
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  {/* Payment */}
                  <td>
                    {order.paymentStatus || "UNPAID"}
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`sales-orders-status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status || "-"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>

                    <div className="sales-orders-actions">

                      {/* View */}
                      <button
                        type="button"
                        className="sales-orders-action-btn view"
                        title="View"
                        onClick={() =>
                          handleView(order._id)
                        }
                      >
                        <FiEye />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="sales-orders-action-btn edit"
                        title={
                          order.status === "DRAFT"
                            ? "Edit"
                            : "Only DRAFT orders can be edited"
                        }
                        onClick={() =>
                          handleEdit(order)
                        }
                        disabled={
                          order.status !== "DRAFT"
                        }
                      >
                        <FiEdit />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="sales-orders-action-btn delete"
                        title={
                          order.status === "DRAFT" ||
                          order.status === "CANCELLED"
                            ? "Delete"
                            : "Only DRAFT or CANCELLED orders can be deleted"
                        }
                        onClick={() =>
                          handleDelete(order)
                        }
                        disabled={
                          deletingId === order._id ||
                          (order.status !== "DRAFT" &&
                            order.status !==
                              "CANCELLED")
                        }
                      >
                        <FiTrash2 />
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default SalesOrders;