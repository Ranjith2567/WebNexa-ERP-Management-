import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-invoices.css";

function SalesInvoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sales-invoices");

      setInvoices(response.data?.data || []);
    } catch (err) {
      console.error("Sales invoices error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load sales invoices."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceNumber =
      invoice.invoiceNumber ||
      invoice.invoiceNo ||
      "";

    const customerName =
      invoice.customer?.name ||
      invoice.customerName ||
      "";

    const searchText = search.toLowerCase();

    return (
      invoiceNumber.toLowerCase().includes(searchText) ||
      customerName.toLowerCase().includes(searchText)
    );
  });

  const formatCurrency = (amount = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ISSUED":
        return "issued";

      case "DRAFT":
        return "draft";

      case "CANCELLED":
        return "cancelled";

      case "PAID":
        return "paid";

      case "PARTIALLY_PAID":
        return "partial";

      default:
        return "default";
    }
  };

  return (
    <div className="sales-invoices-page">

      {/* Header */}
      <div className="sales-invoices-header">

        <div>
          <div className="sales-breadcrumb">
            Sales / Invoices
          </div>

          <h1>Sales Invoices</h1>

          <p>
            Create, manage and track customer sales invoices.
          </p>
        </div>

        <Link
          to="/sales/invoices/create"
          className="create-invoice-btn"
        >
          <FiPlus />
          Create Invoice
        </Link>

      </div>


      {/* Toolbar */}
      <div className="invoice-toolbar">

        <div className="invoice-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <button
          className="refresh-invoices-btn"
          onClick={fetchInvoices}
          title="Refresh"
        >
          <FiRefreshCw />
          Refresh
        </button>

      </div>


      {/* Error */}
      {error && (
        <div className="invoice-error">
          {error}
        </div>
      )}


      {/* Table */}
      <div className="invoice-table-card">

        <div className="invoice-table-header">

          <div>

            <h2>
              Invoice List
            </h2>

            <span>
              {filteredInvoices.length} invoice
              {filteredInvoices.length !== 1
                ? "s"
                : ""}
            </span>

          </div>

        </div>


        {loading ? (

          <div className="invoice-loading">

            <div className="invoice-spinner" />

            <p>
              Loading invoices...
            </p>

          </div>

        ) : filteredInvoices.length === 0 ? (

          <div className="invoice-empty">

            <div className="invoice-empty-icon">
              <FiFileText />
            </div>

            <h3>
              No sales invoices found
            </h3>

            <p>
              Create your first sales invoice to see it here.
            </p>

            <Link
              to="/sales/invoices/create"
              className="empty-create-btn"
            >
              <FiPlus />
              Create Invoice
            </Link>

          </div>

        ) : (

          <div className="invoice-table-wrapper">

            <table className="invoice-table">

              <thead>

                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {filteredInvoices.map((invoice) => {

                  const invoiceId =
                    invoice._id ||
                    invoice.id;

                  const invoiceNumber =
                    invoice.invoiceNumber ||
                    invoice.invoiceNo ||
                    `INV-${invoiceId?.slice(-6)}`;

                  const customerName =
                    invoice.customer?.name ||
                    invoice.customerName ||
                    "Walk-in Customer";

                  const total =
                    invoice.grandTotal ??
                    invoice.totalAmount ??
                    invoice.total ??
                    0;

                  const isDraft =
                    String(invoice.status || "").trim().toUpperCase() === "DRAFT";

                  return (

                    <tr key={invoiceId}>

                      {/* Invoice */}
                      <td>

                        <div className="invoice-number">

                          <div className="invoice-icon">
                            <FiFileText />
                          </div>

                          <strong>
                            {invoiceNumber}
                          </strong>

                        </div>

                      </td>


                      {/* Customer */}
                      <td>

                        <span className="customer-name">
                          {customerName}
                        </span>

                      </td>


                      {/* Date */}
                      <td>

                        {formatDate(
                          invoice.invoiceDate ||
                          invoice.createdAt
                        )}

                      </td>


                      {/* Status */}
                      <td>

                        <span
                          className={`invoice-status ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {invoice.status ||
                            "UNKNOWN"}
                        </span>

                      </td>


                      {/* Total */}
                      <td>

                        <strong className="invoice-total">
                          {formatCurrency(total)}
                        </strong>

                      </td>


                      {/* Actions */}
                      <td>

                        <div className="invoice-actions">

                          {/* VIEW */}
                          <button
                            type="button"
                            title="View Invoice"
                            className="invoice-action view"
                            onClick={() =>
                              navigate(
                                `/sales/invoices/${invoiceId}`
                              )
                            }
                          >
                            <FiEye />
                          </button>


                          {/* EDIT */}
                          <button
                            type="button"
                            title={
                              isDraft
                                ? "Edit Invoice"
                                : "Only draft invoices can be edited"
                            }
                            className={`invoice-action edit ${!isDraft
                                ? "disabled"
                                : ""
                              }`}
                            disabled={!isDraft}
                            onClick={() => {
                              if (isDraft) {
                                navigate(
                                  `/sales/invoices/${invoiceId}/edit`
                                );
                              }
                            }}
                          >
                            <FiEdit2 />
                          </button>


                          {/* DELETE */}
                          <button
                            type="button"
                            title="Invoices cannot be permanently deleted"
                            className="invoice-action delete disabled"
                            disabled
                          >
                            <FiTrash2 />
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default SalesInvoices;