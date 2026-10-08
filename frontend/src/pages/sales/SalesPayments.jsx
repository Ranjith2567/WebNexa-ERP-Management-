import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiPlus,
  FiSearch,
  FiEye,
  FiXCircle,
  FiRefreshCw,
  FiCreditCard,
  FiFileText,
  FiUser,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-payments.css";

function SalesPayments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
  });

  const fetchPayments = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/sales-payments",
        {
          params: {
            page,
            limit: 10,
            search: search.trim(),
            paymentMethod: paymentMethod || undefined,
            status: status || undefined,
          },
        }
      );

      const data = response.data;

      setPayments(data?.data || []);

      setPagination({
        total: Number(data?.total || 0),
        pages: Math.max(
          Number(data?.pages || 1),
          1
        ),
      });
    } catch (error) {
      console.error(
        "Fetch Sales Payments Error:",
        error
      );

      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, paymentMethod, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchPayments();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const handleClearFilters = () => {
    setSearch("");
    setPaymentMethod("");
    setStatus("");
    setPage(1);
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

  const getStatusClass = (paymentStatus) => {
    switch (paymentStatus) {
      case "SUCCESS":
        return "success";

      case "CANCELLED":
        return "cancelled";

      case "PENDING":
        return "pending";

      case "FAILED":
        return "failed";

      default:
        return "default";
    }
  };

  const getCustomerName = (payment) => {
    return (
      payment.customer?.name ||
      "Unknown Customer"
    );
  };

  const getInvoiceNumber = (payment) => {
    return (
      payment.salesInvoice
        ?.invoiceNumber || "-"
    );
  };

  const getOrderNumber = (payment) => {
    return (
      payment.salesOrder
        ?.salesOrderNumber || "-"
    );
  };

  const totalSuccessfulAmount = payments
    .filter(
      (payment) =>
        payment.status === "SUCCESS"
    )
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

  return (
    <div className="sales-payments-page">

      {/* =========================
          HEADER
      ========================== */}

      <div className="sales-payments-header">

        <div className="sales-payments-title">

          <div className="sales-payments-icon">
            <FiCreditCard />
          </div>

          <div>
            <h1>
              Sales Payments
            </h1>

            <p>
              Manage customer payments and
              payment transactions.
            </p>
          </div>

        </div>

        <div className="sales-payments-header-actions">

          <button
            type="button"
            className="sales-payments-refresh-btn"
            onClick={() =>
              fetchPayments(true)
            }
            disabled={refreshing}
            title="Refresh"
          >
            <FiRefreshCw
              className={
                refreshing
                  ? "refresh-spinning"
                  : ""
              }
            />
          </button>

          <Link
            to="/sales/payments/create"
            className="sales-payments-add-btn"
          >
            <FiPlus />
            Record Payment
          </Link>

        </div>

      </div>


      {/* =========================
          SUMMARY
      ========================== */}

      <div className="sales-payments-summary">

        <div className="sales-payment-summary-card">

          <div className="summary-card-icon">
            <FiCreditCard />
          </div>

          <div>
            <span>
              Total Payments
            </span>

            <strong>
              {pagination.total}
            </strong>
          </div>

        </div>


        <div className="sales-payment-summary-card">

          <div className="summary-card-icon">
            <FiFileText />
          </div>

          <div>
            <span>
              Current Page Amount
            </span>

            <strong>
              {formatCurrency(
                totalSuccessfulAmount
              )}
            </strong>
          </div>

        </div>

      </div>


      {/* =========================
          FILTERS
      ========================== */}

      <div className="sales-payments-filters">

        <div className="sales-payment-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search payment number or transaction reference..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(
              e.target.value
            );
            setPage(1);
          }}
          className="sales-payment-filter-select"
        >
          <option value="">
            All Payment Methods
          </option>

          <option value="CASH">
            Cash
          </option>

          <option value="UPI">
            UPI
          </option>

          <option value="BANK_TRANSFER">
            Bank Transfer
          </option>

          <option value="CARD">
            Card
          </option>

          <option value="CHEQUE">
            Cheque
          </option>

          <option value="OTHER">
            Other
          </option>
        </select>


        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="sales-payment-filter-select"
        >
          <option value="">
            All Status
          </option>

          <option value="SUCCESS">
            Success
          </option>

          <option value="CANCELLED">
            Cancelled
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="FAILED">
            Failed
          </option>
        </select>


        {(search ||
          paymentMethod ||
          status) && (
          <button
            type="button"
            className="sales-payment-clear-btn"
            onClick={
              handleClearFilters
            }
          >
            Clear
          </button>
        )}

      </div>


      {/* =========================
          TABLE
      ========================== */}

      <div className="sales-payments-card">

        {loading ? (
          <div className="sales-payments-loading">

            <div className="payment-loading-spinner" />

            <p>
              Loading payments...
            </p>

          </div>
        ) : payments.length === 0 ? (

          <div className="sales-payments-empty">

            <div className="payment-empty-icon">
              <FiCreditCard />
            </div>

            <h3>
              No payments found
            </h3>

            <p>
              There are no sales payment
              records matching your filters.
            </p>

            <Link
              to="/sales/payments/create"
              className="sales-payments-empty-btn"
            >
              <FiPlus />
              Record First Payment
            </Link>

          </div>

        ) : (

          <div className="sales-payments-table-wrapper">

            <table className="sales-payments-table">

              <thead>

                <tr>
                  <th>Payment</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {payments.map(
                  (payment) => (
                    <tr
                      key={payment._id}
                    >

                      {/* PAYMENT */}

                      <td>

                        <div className="payment-number-cell">

                          <div className="payment-row-icon">
                            <FiCreditCard />
                          </div>

                          <div>
                            <strong>
                              {payment.paymentNumber ||
                                "-"}
                            </strong>

                            {payment.transactionReference && (
                              <span>
                                Ref:{" "}
                                {
                                  payment.transactionReference
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* INVOICE */}

                      <td>

                        <div className="payment-invoice-cell">

                          <FiFileText />

                          <div>

                            <strong>
                              {
                                getInvoiceNumber(
                                  payment
                                )
                              }
                            </strong>

                            {payment.salesOrder && (
                              <span>
                                {
                                  getOrderNumber(
                                    payment
                                  )
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* CUSTOMER */}

                      <td>

                        <div className="payment-customer-cell">

                          <FiUser />

                          <span>
                            {getCustomerName(
                              payment
                            )}
                          </span>

                        </div>

                      </td>


                      {/* DATE */}

                      <td>

                        <div className="payment-date-cell">

                          <FiCalendar />

                          <span>
                            {formatDate(
                              payment.paymentDate
                            )}
                          </span>

                        </div>

                      </td>


                      {/* METHOD */}

                      <td>

                        <span className="payment-method-badge">

                          {getPaymentMethodLabel(
                            payment.paymentMethod
                          )}

                        </span>

                      </td>


                      {/* AMOUNT */}

                      <td>

                        <strong className="payment-amount">

                          {formatCurrency(
                            payment.amount
                          )}

                        </strong>

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`payment-status-badge ${getStatusClass(
                            payment.status
                          )}`}
                        >
                          {payment.status ||
                            "-"}
                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="payment-actions">

                          <button
                            type="button"
                            className="payment-action-btn view"
                            onClick={() =>
                              navigate(
                                `/sales/payments/${payment._id}`
                              )
                            }
                            title="View Payment"
                          >
                            <FiEye />
                          </button>

                          {payment.status ===
                            "SUCCESS" && (
                            <button
                              type="button"
                              className="payment-action-btn cancel"
                              onClick={() =>
                                navigate(
                                  `/sales/payments/${payment._id}`
                                )
                              }
                              title="View / Cancel Payment"
                            >
                              <FiXCircle />
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* =========================
          PAGINATION
      ========================== */}

      {!loading &&
        payments.length > 0 && (
          <div className="sales-payments-pagination">

            <span>
              Page {page} of{" "}
              {pagination.pages}
            </span>

            <div className="pagination-buttons">

              <button
                type="button"
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        current - 1,
                        1
                      )
                  )
                }
                disabled={page <= 1}
              >
                <FiChevronLeft />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        current + 1,
                        pagination.pages
                      )
                  )
                }
                disabled={
                  page >=
                  pagination.pages
                }
              >
                <FiChevronRight />
              </button>

            </div>

          </div>
        )}

    </div>
  );
}

export default SalesPayments;