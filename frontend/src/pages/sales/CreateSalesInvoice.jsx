import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiFileText,
  FiLoader,
  FiCalendar,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/create-sales-invoice.css";

function CreateSalesInvoice() {
  const navigate = useNavigate();

  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dueDate, setDueDate] = useState("");

  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] =
    useState("");

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSalesOrders = async () => {
    try {
      setLoadingOrders(true);
      setError("");

      // ----------------------------------------
      // PROCESSING SALES ORDERS
      // ----------------------------------------

      const response = await api.get("/sales-orders", {
        params: {
          status: "PROCESSING",
          limit: 100,
        },
      });

      const orders = response.data?.salesOrders || [];

      console.log(
        "PROCESSING ORDERS RESPONSE:",
        response.data
      );

      console.log(
        "PROCESSING SALES ORDERS:",
        orders
      );

      // ----------------------------------------
      // READY TO DELIVER SALES ORDERS
      // ----------------------------------------

      const readyResponse = await api.get(
        "/sales-orders",
        {
          params: {
            status: "READY_TO_DELIVER",
            limit: 100,
          },
        }
      );

      const readyOrders =
        readyResponse.data?.salesOrders || [];

      console.log(
        "READY TO DELIVER RESPONSE:",
        readyResponse.data
      );

      console.log(
        "READY TO DELIVER ORDERS:",
        readyOrders
      );

      // ----------------------------------------
      // COMBINE BOTH STATUS ORDERS
      // ----------------------------------------

      const combined = [
        ...orders,
        ...readyOrders,
      ];

      console.log(
        "COMBINED SALES ORDERS:",
        combined
      );

      // ----------------------------------------
      // REMOVE DUPLICATES
      // ----------------------------------------

      const uniqueOrders = Array.from(
        new Map(
          combined.map((order) => [
            order._id,
            order,
          ])
        ).values()
      );

      console.log(
        "UNIQUE SALES ORDERS:",
        uniqueOrders
      );

      // ----------------------------------------
      // CHECK INVOICE LINKS
      // ----------------------------------------
    console.log(
  "ORDER INVOICE LINKS:",
  JSON.stringify(
    uniqueOrders.map((order) => ({
      salesOrderNumber: order.salesOrderNumber,
      status: order.status,
      salesInvoice: order.salesInvoice,
      salesInvoiceId:
        typeof order.salesInvoice === "object"
          ? order.salesInvoice?._id
          : order.salesInvoice,
    })),
    null,
    2
  )
);

      // ----------------------------------------
      // REMOVE ALREADY INVOICED ORDERS
      // ----------------------------------------

      const availableOrders =
        uniqueOrders.filter(
          (order) => !order.salesInvoice
        );

      console.log(
        "AVAILABLE SALES ORDERS:",
        availableOrders
      );

      setSalesOrders(availableOrders);
    } catch (err) {
      console.error(
        "Sales Order Fetch Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load available sales orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const selectedOrder = useMemo(() => {
    return salesOrders.find(
      (order) => order._id === selectedOrderId
    );
  }, [salesOrders, selectedOrderId]);

  const formatCurrency = (amount = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
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

  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedOrderId) {
      setError("Please select a sales order.");
      return;
    }

    try {
      setCreating(true);

      const response = await api.post(
        "/sales-invoices",
        {
          salesOrder: selectedOrderId,
          invoiceDate,
          dueDate: dueDate || null,
          notes,
          termsAndConditions,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to create sales invoice."
        );
      }

      setSuccess(
        response.data?.message ||
          "Sales Invoice created successfully."
      );

      setTimeout(() => {
        navigate("/sales/invoices");
      }, 1200);
    } catch (err) {
      console.error(
        "Create Sales Invoice Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create sales invoice."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="create-sales-invoice-page">
      {/* Header */}
      <div className="create-invoice-header">
        <div>
          <Link
            to="/sales/invoices"
            className="back-to-invoices"
          >
            <FiArrowLeft />
            Back to Invoices
          </Link>

          <div className="create-invoice-title">
            <div className="create-invoice-title-icon">
              <FiFileText />
            </div>

            <div>
              <h1>Create Sales Invoice</h1>

              <p>
                Generate an invoice from a ready sales order.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        className="create-invoice-form"
        onSubmit={handleCreateInvoice}
      >
        {/* Order Selection */}
        <section className="invoice-form-card">
          <div className="invoice-card-heading">
            <div>
              <h2>Sales Order</h2>

              <p>
                Select a PROCESSING or READY TO DELIVER order.
              </p>
            </div>
          </div>

          <div className="invoice-field">
            <label>
              Sales Order
              <span>*</span>
            </label>

            {loadingOrders ? (
              <div className="invoice-loading-select">
                <FiLoader />
                Loading available sales orders...
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) =>
                  setSelectedOrderId(e.target.value)
                }
                required
              >
                <option value="">
                  Select Sales Order
                </option>

                {salesOrders.map((order) => (
                  <option
                    key={order._id}
                    value={order._id}
                  >
                    {order.salesOrderNumber} —{" "}
                    {order.customer?.name ||
                      "Customer"}{" "}
                    —{" "}
                    {formatCurrency(
                      order.totalAmount
                    )}
                  </option>
                ))}
              </select>
            )}

            {!loadingOrders &&
              salesOrders.length === 0 && (
                <small className="field-help">
                  No eligible sales orders available for
                  invoicing.
                </small>
              )}
          </div>
        </section>

        {/* Selected Order Details */}
        {selectedOrder && (
          <>
            <section className="invoice-form-card">
              <div className="invoice-card-heading">
                <div>
                  <h2>Order Details</h2>

                  <p>
                    Details are loaded automatically from
                    the selected sales order.
                  </p>
                </div>

                <span className="order-status-badge">
                  {selectedOrder.status}
                </span>
              </div>

              <div className="order-details-grid">
                <div className="detail-box">
                  <span>Sales Order</span>

                  <strong>
                    {selectedOrder.salesOrderNumber}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Customer</span>

                  <strong>
                    {selectedOrder.customer?.name ||
                      "—"}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Order Date</span>

                  <strong>
                    {formatDate(
                      selectedOrder.orderDate
                    )}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Warehouse</span>

                  <strong>
                    {selectedOrder.warehouse?.name ||
                      "—"}
                  </strong>
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="invoice-form-card">
              <div className="invoice-card-heading">
                <div>
                  <h2>Invoice Items</h2>

                  <p>
                    Items are automatically taken from the
                    sales order.
                  </p>
                </div>
              </div>

              <div className="invoice-items-wrapper">
                <table className="create-invoice-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedOrder.items || []).map(
                      (item, index) => (
                        <tr key={item._id || index}>
                          <td>
                            <div className="product-cell">
                              <div className="product-mini-icon">
                                <FiFileText />
                              </div>

                              <div>
                                <strong>
                                  {item.product?.name ||
                                    item.description ||
                                    "Product"}
                                </strong>

                                {item.product?.sku && (
                                  <span>
                                    SKU:{" "}
                                    {item.product.sku}
                                  </span>
                                )}
                              </div>
                            </div>
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
                            {item.discountPercent || 0}%
                          </td>

                          <td>
                            {item.taxPercent || 0}%
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
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="invoice-totals">
                <div>
                  <span>Subtotal</span>

                  <strong>
                    {formatCurrency(
                      selectedOrder.subtotal
                    )}
                  </strong>
                </div>

                <div>
                  <span>Discount</span>

                  <strong>
                    {formatCurrency(
                      selectedOrder.discountAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Taxable Amount</span>

                  <strong>
                    {formatCurrency(
                      selectedOrder.taxableAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Tax</span>

                  <strong>
                    {formatCurrency(
                      selectedOrder.taxAmount
                    )}
                  </strong>
                </div>

                <div className="grand-total-row">
                  <span>Grand Total</span>

                  <strong>
                    {formatCurrency(
                      selectedOrder.totalAmount
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Invoice Information */}
        <section className="invoice-form-card">
          <div className="invoice-card-heading">
            <div>
              <h2>Invoice Information</h2>

              <p>
                Enter the invoice dates and optional notes.
              </p>
            </div>
          </div>

          <div className="invoice-date-grid">
            <div className="invoice-field">
              <label>
                Invoice Date
                <span>*</span>
              </label>

              <div className="date-input-wrapper">
                <FiCalendar />

                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) =>
                    setInvoiceDate(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="invoice-field">
              <label>Due Date</label>

              <div className="date-input-wrapper">
                <FiCalendar />

                <input
                  type="date"
                  value={dueDate}
                  min={invoiceDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="invoice-field">
            <label>Notes</label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Enter invoice notes..."
              rows={4}
            />
          </div>

          <div className="invoice-field">
            <label>Terms & Conditions</label>

            <textarea
              value={termsAndConditions}
              onChange={(e) =>
                setTermsAndConditions(
                  e.target.value
                )
              }
              placeholder="Enter terms and conditions..."
              rows={4}
            />
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="create-invoice-error">
            {error}
          </div>
        )}

        {success && (
          <div className="create-invoice-success">
            <FiCheckCircle />
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="create-invoice-actions">
          <Link
            to="/sales/invoices"
            className="cancel-invoice-btn"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="submit-invoice-btn"
            disabled={
              creating ||
              loadingOrders ||
              !selectedOrder
            }
          >
            {creating ? (
              <>
                <FiLoader className="button-spinner" />
                Creating Invoice...
              </>
            ) : (
              <>
                <FiCheckCircle />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSalesInvoice;