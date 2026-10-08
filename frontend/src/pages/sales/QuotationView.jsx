import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FiArrowLeft,
  FiEdit2,
  FiFileText,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiPackage,
  FiRefreshCw,
  FiShoppingCart,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/quotation-view.css";

function QuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // STATUS UPDATE
  // ==========================================

  const [selectedStatus, setSelectedStatus] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const statuses = [
    "DRAFT",
    "SENT",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED",
  ];

  // ==========================================
  // FETCH QUOTATION
  // ==========================================

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/quotations/${id}`
        );

      const quotationData =
        response.data?.quotation;

      setQuotation(
        quotationData
      );

      if (
        quotationData?.status
      ) {
        setSelectedStatus(
          quotationData.status
        );
      }
    } catch (err) {
      console.error(
        "Quotation fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load quotation."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusUpdate =
    async () => {
      if (!quotation) {
        return;
      }

      if (!selectedStatus) {
        return;
      }

      if (
        selectedStatus ===
        quotation.status
      ) {
        return;
      }

      try {
        setUpdatingStatus(true);
        setError("");

        const response =
          await api.patch(
            `/quotations/${quotation._id}/status`,
            {
              status:
                selectedStatus,
            }
          );

        const updatedQuotation =
          response.data?.quotation;

        if (
          updatedQuotation
        ) {
          setQuotation(
            updatedQuotation
          );

          setSelectedStatus(
            updatedQuotation.status
          );
        } else {
          await fetchQuotation();
        }
      } catch (err) {
        console.error(
          "Quotation status update error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Failed to update quotation status."
        );

        setSelectedStatus(
          quotation.status
        );
      } finally {
        setUpdatingStatus(
          false
        );
      }
    };

  // ==========================================
  // CONVERT TO SALES ORDER
  // ==========================================

  const handleConvertToSalesOrder =
    () => {
      if (!quotation) {
        return;
      }

      // Only ACCEPTED quotation
      if (
        quotation.status !==
        "ACCEPTED"
      ) {
        setError(
          "Only accepted quotations can be converted to sales orders."
        );
        return;
      }

      // ========================================
      // ALREADY CONVERTED
      // ========================================

      if (
        quotation.convertedToSalesOrder
      ) {
        const salesOrderId =
          typeof quotation.convertedToSalesOrder ===
          "object"
            ? quotation
                .convertedToSalesOrder
                ._id
            : quotation.convertedToSalesOrder;

        if (salesOrderId) {
          navigate(
            `/sales/orders/${salesOrderId}`
          );
        }

        return;
      }

      // ========================================
      // OPEN CREATE SALES ORDER
      // ========================================

      navigate(
        `/sales/orders/create?quotation=${quotation._id}`
      );
    };

  // ==========================================
  // GET SALES ORDER ID
  // ==========================================

  const getConvertedSalesOrderId =
    () => {
      if (
        !quotation?.convertedToSalesOrder
      ) {
        return "";
      }

      if (
        typeof quotation.convertedToSalesOrder ===
        "object"
      ) {
        return (
          quotation
            .convertedToSalesOrder
            ?._id || ""
        );
      }

      return quotation.convertedToSalesOrder;
    };

  // ==========================================
  // GET NAME
  // ==========================================

  const getName = (
    value,
    fallback = "-"
  ) => {
    if (!value) {
      return fallback;
    }

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    return (
      value.name ||
      value.companyName ||
      value.customerName ||
      value.productName ||
      fallback
    );
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FORMAT AMOUNT
  // ==========================================

  const formatAmount = (
    amount
  ) => {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (
    status
  ) => {
    return `status-${String(
      status || ""
    )
      .toLowerCase()
      .replace(
        /_/g,
        "-"
      )}`;
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="quotation-view-page">
        <div className="quotation-view-loader">

          <div className="quotation-spinner"></div>

          <p>
            Loading quotation...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (
    error &&
    !quotation
  ) {
    return (
      <div className="quotation-view-page">

        <div className="quotation-view-error">
          {error}
        </div>

        <Link
          to="/sales/quotations"
          className="quotation-back-btn"
        >
          <FiArrowLeft />

          Back to Quotations
        </Link>

      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!quotation) {
    return (
      <div className="quotation-view-page">

        <div className="quotation-view-error">
          Quotation not found.
        </div>

        <Link
          to="/sales/quotations"
          className="quotation-back-btn"
        >
          <FiArrowLeft />

          Back to Quotations
        </Link>

      </div>
    );
  }

  // ==========================================
  // EDIT PERMISSION
  // ==========================================

  const canEdit =
    ![
      "ACCEPTED",
      "CANCELLED",
    ].includes(
      quotation.status
    );

  // ==========================================
  // STATUS PERMISSION
  // ==========================================

  const canChangeStatus =
    quotation.status !==
    "CANCELLED";

  // ==========================================
  // CONVERSION STATUS
  // ==========================================

  const isAccepted =
    quotation.status ===
    "ACCEPTED";

  const isConverted =
    Boolean(
      quotation.convertedToSalesOrder
    );

  const convertedSalesOrderId =
    getConvertedSalesOrderId();

  return (
    <div className="quotation-view-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="quotation-view-header">

        <div className="quotation-view-title">

          <Link
            to="/sales/quotations"
            className="quotation-back-icon"
          >
            <FiArrowLeft />
          </Link>

          <div>

            <div className="quotation-title-row">

              <FiFileText />

              <h1>
                {
                  quotation.quotationNumber
                }
              </h1>

              <span
                className={`quotation-status ${getStatusClass(
                  quotation.status
                )}`}
              >
                {
                  quotation.status
                }
              </span>

            </div>

            <p>
              Quotation details and items
            </p>

          </div>

        </div>


        {/* ==================================================
            HEADER ACTIONS
        ================================================== */}

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "10px",
            flexWrap:
              "wrap",
          }}
        >

          {/* ===============================================
              STATUS CHANGE
          =============================================== */}

          {canChangeStatus && (
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "8px",
              }}
            >

              <select
                value={
                  selectedStatus
                }
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value
                  )
                }
                disabled={
                  updatingStatus
                }
                style={{
                  minWidth:
                    "150px",
                  height:
                    "42px",
                  padding:
                    "0 12px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(148, 163, 184, 0.15)",
                  background:
                    "#020617",
                  color:
                    "#ffffff",
                  outline:
                    "none",
                  cursor:
                    updatingStatus
                      ? "not-allowed"
                      : "pointer",
                }}
              >

                {statuses.map(
                  (status) => (
                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >
                      {
                        status
                      }
                    </option>
                  )
                )}

              </select>


              <button
                type="button"
                onClick={
                  handleStatusUpdate
                }
                disabled={
                  updatingStatus ||
                  selectedStatus ===
                    quotation.status
                }
                style={{
                  height:
                    "42px",
                  padding:
                    "0 14px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(37, 99, 235, 0.35)",
                  background:
                    selectedStatus ===
                    quotation.status
                      ? "#1e293b"
                      : "#2563eb",
                  color:
                    "#ffffff",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "7px",
                  cursor:
                    updatingStatus ||
                    selectedStatus ===
                      quotation.status
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    updatingStatus ||
                    selectedStatus ===
                      quotation.status
                      ? 0.6
                      : 1,
                }}
              >

                <FiRefreshCw
                  style={{
                    animation:
                      updatingStatus
                        ? "quotationSpin 1s linear infinite"
                        : "none",
                  }}
                />

                {updatingStatus
                  ? "Updating..."
                  : "Update Status"}

              </button>

            </div>
          )}


          {/* ===============================================
              CONVERT TO SALES ORDER
          =============================================== */}

          {isAccepted &&
            !isConverted && (
              <button
                type="button"
                onClick={
                  handleConvertToSalesOrder
                }
                style={{
                  height:
                    "42px",
                  padding:
                    "0 15px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(37, 99, 235, 0.35)",
                  background:
                    "#2563eb",
                  color:
                    "#ffffff",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  cursor:
                    "pointer",
                  fontWeight:
                    "600",
                }}
              >

                <FiShoppingCart />

                Convert to Sales Order

              </button>
            )}


          {/* ===============================================
              ALREADY CONVERTED
          =============================================== */}

          {isAccepted &&
            isConverted && (
              <button
                type="button"
                onClick={() => {
                  if (
                    convertedSalesOrderId
                  ) {
                    navigate(
                      `/sales/orders/${convertedSalesOrderId}`
                    );
                  }
                }}
                style={{
                  height:
                    "42px",
                  padding:
                    "0 15px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(34, 197, 94, 0.3)",
                  background:
                    "rgba(34, 197, 94, 0.12)",
                  color:
                    "#4ade80",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  cursor:
                    convertedSalesOrderId
                      ? "pointer"
                      : "not-allowed",
                  fontWeight:
                    "600",
                  opacity:
                    convertedSalesOrderId
                      ? 1
                      : 0.6,
                }}
              >

                <FiShoppingCart />

                View Sales Order

              </button>
            )}


          {/* ===============================================
              EDIT QUOTATION
          =============================================== */}

          {canEdit && (
            <button
              type="button"
              className="quotation-edit-btn"
              onClick={() =>
                navigate(
                  `/sales/quotations/${quotation._id}/edit`
                )
              }
            >

              <FiEdit2 />

              Edit Quotation

            </button>
          )}

        </div>

      </div>


      {/* ==================================================
          ERROR MESSAGE
      ================================================== */}

      {error &&
        quotation && (
          <div
            className="quotation-view-error"
            style={{
              marginBottom:
                "20px",
            }}
          >
            {error}
          </div>
        )}


      {/* ==================================================
          BASIC INFORMATION
      ================================================== */}

      <div className="quotation-info-grid">

        {/* QUOTATION NUMBER */}

        <div className="quotation-info-card">

          <div className="quotation-info-icon">
            <FiFileText />
          </div>

          <div>

            <span>
              Quotation Number
            </span>

            <strong>
              {
                quotation.quotationNumber
              }
            </strong>

          </div>

        </div>


        {/* QUOTATION DATE */}

        <div className="quotation-info-card">

          <div className="quotation-info-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              Quotation Date
            </span>

            <strong>
              {formatDate(
                quotation.quotationDate
              )}
            </strong>

          </div>

        </div>


        {/* VALID UNTIL */}

        <div className="quotation-info-card">

          <div className="quotation-info-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              Valid Until
            </span>

            <strong>
              {formatDate(
                quotation.validUntil
              )}
            </strong>

          </div>

        </div>


        {/* CUSTOMER */}

        <div className="quotation-info-card">

          <div className="quotation-info-icon">
            <FiUser />
          </div>

          <div>

            <span>
              Customer
            </span>

            <strong>
              {getName(
                quotation.customer
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          COMPANY / BRANCH / CUSTOMER
      ================================================== */}

      <div className="quotation-details-grid">

        {/* COMPANY */}

        <div className="quotation-detail-card">

          <h2>

            <FiFileText />

            Company

          </h2>

          <div className="quotation-detail-content">

            <p>

              <span>
                Name
              </span>

              <strong>
                {getName(
                  quotation.company
                )}
              </strong>

            </p>


            <p>

              <span>
                Legal Name
              </span>

              <strong>
                {
                  quotation
                    .company
                    ?.legalName ||
                  "-"
                }
              </strong>

            </p>


            <p>

              <span>
                Email
              </span>

              <strong>
                {
                  quotation
                    .company
                    ?.email ||
                  "-"
                }
              </strong>

            </p>

          </div>

        </div>


        {/* BRANCH */}

        <div className="quotation-detail-card">

          <h2>

            <FiMapPin />

            Branch

          </h2>

          <div className="quotation-detail-content">

            <p>

              <span>
                Name
              </span>

              <strong>
                {getName(
                  quotation.branch
                )}
              </strong>

            </p>


            <p>

              <span>
                Branch Code
              </span>

              <strong>
                {
                  quotation
                    .branch
                    ?.branchCode ||
                  "-"
                }
              </strong>

            </p>


            <p>

              <span>
                Location
              </span>

              <strong>
                {[
                  quotation
                    .branch
                    ?.city,
                  quotation
                    .branch
                    ?.state,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    ", "
                  ) ||
                  "-"}
              </strong>

            </p>

          </div>

        </div>


        {/* CUSTOMER */}

        <div className="quotation-detail-card">

          <h2>

            <FiUser />

            Customer

          </h2>

          <div className="quotation-detail-content">

            <p>

              <span>
                Name
              </span>

              <strong>
                {getName(
                  quotation.customer
                )}
              </strong>

            </p>


            <p>

              <span>
                Phone
              </span>

              <strong>
                {
                  quotation
                    .customer
                    ?.phone ||
                  "-"
                }
              </strong>

            </p>


            <p>

              <span>
                Email
              </span>

              <strong>
                {
                  quotation
                    .customer
                    ?.email ||
                  "-"
                }
              </strong>

            </p>

          </div>

        </div>

      </div>


      {/* ==================================================
          CONVERSION INFORMATION
      ================================================== */}

      {isConverted && (
        <div
          style={{
            marginTop:
              "20px",
            padding:
              "16px 18px",
            borderRadius:
              "12px",
            border:
              "1px solid rgba(34, 197, 94, 0.22)",
            background:
              "rgba(34, 197, 94, 0.08)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "15px",
            flexWrap:
              "wrap",
          }}
        >

          <div>

            <strong
              style={{
                color:
                  "#4ade80",
                display:
                  "block",
                marginBottom:
                  "5px",
              }}
            >
              Sales Order Created
            </strong>

            <span
              style={{
                color:
                  "#94a3b8",
                fontSize:
                  "13px",
              }}
            >
              This quotation has already
              been converted into a sales
              order.
            </span>

          </div>


          <button
            type="button"
            onClick={() => {
              if (
                convertedSalesOrderId
              ) {
                navigate(
                  `/sales/orders/${convertedSalesOrderId}`
                );
              }
            }}
            disabled={
              !convertedSalesOrderId
            }
            style={{
              height:
                "38px",
              padding:
                "0 13px",
              borderRadius:
                "8px",
              border:
                "1px solid rgba(37, 99, 235, 0.35)",
              background:
                "#2563eb",
              color:
                "#ffffff",
              cursor:
                convertedSalesOrderId
                  ? "pointer"
                  : "not-allowed",
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "7px",
              opacity:
                convertedSalesOrderId
                  ? 1
                  : 0.6,
            }}
          >

            <FiShoppingCart />

            View Sales Order

          </button>

        </div>
      )}


      {/* ==================================================
          ITEMS
      ================================================== */}

      <div className="quotation-items-card">

        <div className="quotation-section-title">

          <h2>

            <FiPackage />

            Quotation Items

          </h2>

          <span>
            {
              quotation.items
                ?.length || 0
            }{" "}
            Items
          </span>

        </div>


        <div className="quotation-items-table-wrapper">

          <table className="quotation-items-table">

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  Product
                </th>

                <th>
                  Description
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Unit Price
                </th>

                <th>
                  Discount
                </th>

                <th>
                  Tax
                </th>

                <th>
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              {quotation.items?.map(
                (
                  item,
                  index
                ) => (

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
                        {getName(
                          item.product
                        )}
                      </strong>

                    </td>

                    <td>
                      {
                        item.description ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        item.quantity
                      }
                    </td>

                    <td>
                      {formatAmount(
                        item.unitPrice
                      )}
                    </td>

                    <td>
                      {Number(
                        item.discountPercent ||
                          0
                      ).toFixed(
                        2
                      )}
                      %
                    </td>

                    <td>
                      {Number(
                        item.taxPercent ||
                          0
                      ).toFixed(
                        2
                      )}
                      %
                    </td>

                    <td>

                      <strong>
                        {formatAmount(
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

      </div>


      {/* ==================================================
          NOTES + TOTALS
      ================================================== */}

      <div className="quotation-bottom-grid">

        {/* NOTES */}

        <div className="quotation-notes-card">

          <h2>
            Notes
          </h2>

          <p>
            {
              quotation.notes ||
              "No notes added."
            }
          </p>


          <h2>
            Terms & Conditions
          </h2>

          <p>
            {
              quotation
                .termsAndConditions ||
              "No terms and conditions added."
            }
          </p>

        </div>


        {/* TOTALS */}

        <div className="quotation-total-card">

          <div>

            <span>
              Subtotal
            </span>

            <strong>
              {formatAmount(
                quotation.subtotal
              )}
            </strong>

          </div>


          <div>

            <span>
              Discount
            </span>

            <strong>
              -
              {" "}
              {formatAmount(
                quotation.discountAmount
              )}
            </strong>

          </div>


          <div>

            <span>
              Taxable Amount
            </span>

            <strong>
              {formatAmount(
                quotation.taxableAmount
              )}
            </strong>

          </div>


          <div>

            <span>
              Tax
            </span>

            <strong>
              {formatAmount(
                quotation.taxAmount
              )}
            </strong>

          </div>


          <div className="quotation-grand-total">

            <span>
              Total Amount
            </span>

            <strong>
              {formatAmount(
                quotation.totalAmount
              )}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

export default QuotationView;