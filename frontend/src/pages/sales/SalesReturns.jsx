import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiRefreshCw,
  FiFileText,
  FiUser,
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/sales-returns.css";

function SalesReturns() {
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sales-returns", {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
          status: status || undefined,
        },
      });

      const data = response.data;

      setReturns(data?.data || []);

      setPagination(
        data?.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error("Fetch Sales Returns Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to fetch sales returns. Please try again."
      );

      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchReturns();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusClass = (value) => {
    return String(value || "").toLowerCase().replace(/\s+/g, "-");
  };

  const totalAmount = returns.reduce(
    (total, item) => total + Number(item.grandTotal || 0),
    0
  );

  const startRecord =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const endRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="sales-returns-page">
      {/* Header */}
      <div className="sales-returns-header">
        <div>
          <div className="sales-returns-title-row">
            <div className="sales-returns-title-icon">
              <FiRefreshCw />
            </div>

            <div>
              <h1>Sales Returns</h1>
              <p>
                Manage customer returns and returned stock transactions.
              </p>
            </div>
          </div>
        </div>

        <Link to="/sales/returns/create" className="sales-returns-create-btn">
          <FiPlus />
          <span>Create Return</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="sales-returns-summary">
        <div className="sales-returns-summary-card">
          <div className="sales-returns-summary-icon">
            <FiRefreshCw />
          </div>

          <div>
            <span>Total Returns</span>
            <strong>{pagination.total}</strong>
          </div>
        </div>

        <div className="sales-returns-summary-card">
          <div className="sales-returns-summary-icon">
            <FiFileText />
          </div>

          <div>
            <span>Current Page</span>
            <strong>{returns.length}</strong>
          </div>
        </div>

        <div className="sales-returns-summary-card">
          <div className="sales-returns-summary-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Page Return Value</span>
            <strong>{formatAmount(totalAmount)}</strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sales-returns-filter-card">
        <div className="sales-returns-search-box">
          <FiSearch />

          <input
            type="text"
            placeholder="Search return number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              className="sales-returns-search-clear"
              onClick={() => setSearch("")}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="sales-returns-filter-group">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="PROCESSED">Processed</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {(search || status) && (
          <button
            type="button"
            className="sales-returns-clear-btn"
            onClick={handleClearFilters}
          >
            <FiX />
            Clear
          </button>
        )}

        <button
          type="button"
          className="sales-returns-refresh-btn"
          onClick={fetchReturns}
          disabled={loading}
          title="Refresh"
        >
          <FiRefreshCw className={loading ? "sales-returns-spin" : ""} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="sales-returns-message error">
          <span>{error}</span>

          <button type="button" onClick={fetchReturns}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="sales-returns-table-card">
        <div className="sales-returns-table-header">
          <div>
            <h2>Return Transactions</h2>
            <p>View and manage processed sales returns.</p>
          </div>
        </div>

        {loading ? (
          <div className="sales-returns-loading">
            <FiRefreshCw className="sales-returns-spin" />
            <span>Loading sales returns...</span>
          </div>
        ) : returns.length === 0 ? (
          <div className="sales-returns-empty">
            <div className="sales-returns-empty-icon">
              <FiRefreshCw />
            </div>

            <h3>No Sales Returns Found</h3>

            <p>
              {search || status
                ? "No returns match your current filters."
                : "No sales returns have been created yet."}
            </p>

            {search || status ? (
              <button
                type="button"
                className="sales-returns-empty-btn"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/sales/returns/create"
                className="sales-returns-empty-btn"
              >
                <FiPlus />
                Create Return
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="sales-returns-table-wrapper">
              <table className="sales-returns-table">
                <thead>
                  <tr>
                    <th>Return</th>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Warehouse</th>
                    <th>Date</th>
                    <th>Settlement</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {returns.map((item) => (
                    <tr key={item._id}>
                      {/* Return */}
                      <td>
                        <div className="sales-returns-primary-cell">
                          <div className="sales-returns-row-icon">
                            <FiRefreshCw />
                          </div>

                          <div>
                            <strong>
                              {item.returnNumber || "N/A"}
                            </strong>

                            <span>
                              {item.items?.length || 0} item
                              {item.items?.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Invoice */}
                      <td>
                        <div className="sales-returns-info-cell">
                          <FiFileText />

                          <span>
                            {item.salesInvoice?.invoiceNumber || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="sales-returns-customer-cell">
                          <div className="sales-returns-customer-avatar">
                            <FiUser />
                          </div>

                          <div>
                            <strong>
                              {item.customer?.name || "Unknown Customer"}
                            </strong>

                            <span>
                              {item.customer?.customerCode || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Warehouse */}
                      <td>
                        <div className="sales-returns-info-cell">
                          <FiPackage />

                          <span>
                            {item.warehouse?.name || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <div className="sales-returns-info-cell">
                          <FiCalendar />

                          <span>{formatDate(item.returnDate)}</span>
                        </div>
                      </td>

                      {/* Settlement */}
                      <td>
                        <span
                          className={`sales-returns-settlement settlement-${String(
                            item.settlementType || "NONE"
                          ).toLowerCase()}`}
                        >
                          {String(item.settlementType || "NONE").replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <div className="sales-returns-amount-cell">
                          {formatAmount(item.grandTotal)}
                        </div>

                        {Number(item.refundAmount || 0) > 0 && (
                          <span className="sales-returns-sub-amount">
                            Refund: {formatAmount(item.refundAmount)}
                          </span>
                        )}

                        {Number(item.creditAmount || 0) > 0 && (
                          <span className="sales-returns-sub-amount">
                            Credit: {formatAmount(item.creditAmount)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`sales-returns-status status-${getStatusClass(
                            item.status
                          )}`}
                        >
                          <span className="sales-returns-status-dot" />
                          {item.status || "UNKNOWN"}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <div className="sales-returns-actions">
                          <button
                            type="button"
                            className="sales-returns-action-btn view"
                            title="View Return"
                            onClick={() =>
                              navigate(`/sales/returns/${item._id}`)
                            }
                          >
                            <FiEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="sales-returns-pagination">
              <div className="sales-returns-pagination-info">
                Showing <strong>{startRecord}</strong> to{" "}
                <strong>{endRecord}</strong> of{" "}
                <strong>{pagination.total}</strong> returns
              </div>

              <div className="sales-returns-pagination-controls">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  <FiChevronLeft />
                  Previous
                </button>

                <div className="sales-returns-page-number">
                  Page <strong>{pagination.page}</strong> of{" "}
                  <strong>{pagination.totalPages || 1}</strong>
                </div>

                <button
                  type="button"
                  disabled={
                    pagination.page >= (pagination.totalPages || 1)
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(
                        prev + 1,
                        pagination.totalPages || 1
                      )
                    )
                  }
                >
                  Next
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SalesReturns;