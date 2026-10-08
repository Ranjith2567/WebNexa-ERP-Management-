import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/create-sales-order.css";

function EditSalesOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // MASTER DATA
  // ==========================================

  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    orderDate: "",
    expectedDeliveryDate: "",
    warehouse: "",
    notes: "",
    termsAndConditions: "",
  });

  // ==========================================
  // WAREHOUSE TEXT
  // ==========================================

  const [warehouseText, setWarehouseText] =
    useState("");

  // ==========================================
  // ITEMS
  // ==========================================

  const [items, setItems] = useState([]);

  // ==========================================
  // GET ID
  // ==========================================

  const getId = (item) => {
    return item?._id || item?.id || "";
  };

  // ==========================================
  // GET NAME
  // ==========================================

  const getName = (item) => {
    return (
      item?.name ||
      item?.productName ||
      item?.warehouseName ||
      ""
    );
  };

  // ==========================================
  // SEARCH VALUES
  // ==========================================

  const getSearchValues = (item) => {
    return [
      item?.name,
      item?.productName,
      item?.warehouseName,
      item?.sku,
      item?.productCode,
      item?.code,
    ]
      .filter(Boolean)
      .map((value) =>
        String(value)
          .trim()
          .toLowerCase()
      );
  };

  // ==========================================
  // FIND BY TEXT
  // ==========================================

  const findItemByText = (list, text) => {
    const value = String(text || "")
      .trim()
      .toLowerCase();

    if (!value) {
      return null;
    }

    return (
      list.find((item) =>
        getSearchValues(item).includes(value)
      ) || null
    );
  };

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        orderResponse,
        branchesResponse,
        warehousesResponse,
        productsResponse,
      ] = await Promise.all([
        api.get(`/sales-orders/${id}`),
        api.get("/branches"),
        api.get("/warehouses"),
        api.get("/products"),
      ]);

      const salesOrder =
        orderResponse.data?.salesOrder;

      if (!salesOrder) {
        setError("Sales order not found.");
        return;
      }

      // ========================================
      // DRAFT CHECK
      // ========================================

      if (salesOrder.status !== "DRAFT") {
        setError(
          "Only DRAFT sales orders can be edited."
        );
        return;
      }

      setOrder(salesOrder);

      setBranches(
        branchesResponse.data?.branches ||
          branchesResponse.data?.data ||
          []
      );

      setWarehouses(
        warehousesResponse.data?.warehouses ||
          warehousesResponse.data?.data ||
          []
      );

      setProducts(
        productsResponse.data?.products ||
          productsResponse.data?.data ||
          []
      );

      // ========================================
      // FORM VALUES
      // ========================================

      setFormData({
        orderDate: salesOrder.orderDate
          ? new Date(salesOrder.orderDate)
              .toISOString()
              .split("T")[0]
          : "",

        expectedDeliveryDate:
          salesOrder.expectedDeliveryDate
            ? new Date(
                salesOrder.expectedDeliveryDate
              )
                .toISOString()
                .split("T")[0]
            : "",

        warehouse:
          salesOrder.warehouse?._id ||
          salesOrder.warehouse ||
          "",

        notes: salesOrder.notes || "",

        termsAndConditions:
          salesOrder.termsAndConditions || "",
      });

      // ========================================
      // WAREHOUSE TEXT
      // ========================================

      setWarehouseText(
        salesOrder.warehouse?.name ||
          salesOrder.warehouse?.warehouseName ||
          ""
      );

      // ========================================
      // ITEMS
      // ========================================

      setItems(
        (salesOrder.items || []).map(
          (item) => ({
            product:
              item.product?._id ||
              item.product ||
              "",

            productText:
              item.product?.name ||
              item.product?.productName ||
              "",

            description:
              item.description ||
              item.product?.description ||
              "",

            quantity:
              item.quantity ?? 1,

            unitPrice:
              item.unitPrice ?? 0,

            discountPercent:
              item.discountPercent ?? 0,

            taxPercent:
              item.taxPercent ?? 0,
          })
        )
      );
    } catch (err) {
      console.error(
        "Sales order edit loading error:",
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

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // WAREHOUSE CHANGE
  // ==========================================

  const handleWarehouseChange = (value) => {
    setWarehouseText(value);

    const selected =
      findItemByText(
        warehouses,
        value
      );

    setFormData((prev) => ({
      ...prev,
      warehouse: selected
        ? getId(selected)
        : "",
    }));
  };

  // ==========================================
  // PRODUCT CHANGE
  // ==========================================

  const handleProductChange = (
    index,
    value
  ) => {
    setItems((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        productText: value,
      };

      const selected =
        findItemByText(
          products,
          value
        );

      if (selected) {
        updated[index].product =
          getId(selected);

        updated[index].description =
          selected.description ||
          selected.name ||
          selected.productName ||
          "";

        updated[index].unitPrice =
          selected.sellingPrice ??
          selected.salePrice ??
          selected.price ??
          selected.selling_price ??
          0;
      } else {
        updated[index].product = "";
      }

      return updated;
    });
  };

  // ==========================================
  // PRODUCT BLUR
  // ==========================================

  const handleProductBlur = (index) => {
    setItems((prev) => {
      const updated = [...prev];

      const selected =
        findItemByText(
          products,
          updated[index].productText
        );

      if (selected) {
        updated[index].product =
          getId(selected);

        updated[index].description =
          selected.description ||
          selected.name ||
          selected.productName ||
          "";

        updated[index].unitPrice =
          selected.sellingPrice ??
          selected.salePrice ??
          selected.price ??
          selected.selling_price ??
          0;
      }

      return updated;
    });
  };

  // ==========================================
  // ITEM CHANGE
  // ==========================================

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setItems((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  // ==========================================
  // ADD ITEM
  // ==========================================

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: "",
        productText: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
      },
    ]);
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================

  const removeItem = (index) => {
    if (items.length === 1) {
      return;
    }

    setItems((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  // ==========================================
  // CALCULATE ITEM
  // ==========================================

  const calculateItem = (item) => {
    const quantity =
      Number(item.quantity) || 0;

    const unitPrice =
      Number(item.unitPrice) || 0;

    const discountPercent =
      Number(item.discountPercent) || 0;

    const taxPercent =
      Number(item.taxPercent) || 0;

    const gross =
      quantity * unitPrice;

    const discountAmount =
      gross *
      (discountPercent / 100);

    const taxableAmount =
      gross - discountAmount;

    const taxAmount =
      taxableAmount *
      (taxPercent / 100);

    const lineTotal =
      taxableAmount + taxAmount;

    return {
      gross,
      discountAmount,
      taxAmount,
      lineTotal,
    };
  };

  // ==========================================
  // TOTALS
  // ==========================================

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    items.forEach((item) => {
      const calculated =
        calculateItem(item);

      subtotal += calculated.gross;

      discountAmount +=
        calculated.discountAmount;

      taxAmount +=
        calculated.taxAmount;

      totalAmount +=
        calculated.lineTotal;
    });

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  }, [items]);

  // ==========================================
  // SUBMIT UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.orderDate) {
      setError("Order date is required.");
      return;
    }

    if (!formData.warehouse) {
      setError(
        "Please select a valid warehouse."
      );
      return;
    }

    if (!items.length) {
      setError(
        "Please add at least one product."
      );
      return;
    }

    // Resolve products
    const finalItems = items.map((item) => {
      const selected =
        findItemByText(
          products,
          item.productText
        );

      return {
        ...item,
        product: selected
          ? getId(selected)
          : item.product,
      };
    });

    const invalidItem =
      finalItems.find(
        (item) =>
          !item.product ||
          Number(item.quantity) <= 0 ||
          Number(item.unitPrice) < 0
      );

    if (invalidItem) {
      setError(
        "Please select valid products and enter valid quantity and price."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        orderDate:
          formData.orderDate,

        expectedDeliveryDate:
          formData.expectedDeliveryDate ||
          null,

        warehouse:
          formData.warehouse,

        items: finalItems.map(
          (item) => ({
            product: item.product,

            description:
              item.description,

            quantity:
              Number(item.quantity),

            unitPrice:
              Number(item.unitPrice),

            discountPercent:
              Number(
                item.discountPercent
              ) || 0,

            taxPercent:
              Number(
                item.taxPercent
              ) || 0,
          })
        ),

        notes:
          formData.notes,

        termsAndConditions:
          formData.termsAndConditions,
      };

      console.log(
        "Sales Order Update Payload:",
        payload
      );

      const response =
        await api.patch(
          `/sales-orders/${id}`,
          payload
        );

      if (response.data?.success) {
        navigate(
          `/sales/orders/${id}`
        );
      } else {
        setError(
          response.data?.message ||
            "Sales order update failed."
        );
      }
    } catch (err) {
      console.error(
        "Update sales order error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update sales order."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="create-sales-order-page">
        <div className="sales-order-card">
          Loading sales order...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="create-sales-order-page">

      {/* HEADER */}

      <div className="create-sales-order-header">

        <div>

          <Link
            to={`/sales/orders/${id}`}
            className="back-to-orders"
          >
            <FiArrowLeft />
            <span>
              Back to Sales Order
            </span>
          </Link>

          <h1>
            Edit Sales Order
          </h1>

          <p>
            Update draft sales order
          </p>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="sales-order-error">
          {error}
        </div>
      )}

      {order && (
        <form onSubmit={handleSubmit}>

          {/* =================================
              ORDER INFORMATION
          ================================= */}

          <section className="sales-order-card">

            <div className="sales-order-card-header">

              <div>
                <h2>
                  Order Information
                </h2>

                <p>
                  Sales order details
                </p>
              </div>

            </div>

            <div className="sales-order-form-grid">

              {/* ORDER NUMBER */}

              <div className="form-group">

                <label>
                  Sales Order Number
                </label>

                <input
                  type="text"
                  value={
                    order.salesOrderNumber ||
                    ""
                  }
                  disabled
                />

              </div>

              {/* COMPANY */}

              <div className="form-group">

                <label>
                  Company
                </label>

                <input
                  type="text"
                  value={
                    order.company?.name ||
                    "-"
                  }
                  disabled
                />

              </div>

              {/* BRANCH */}

              <div className="form-group">

                <label>
                  Branch
                </label>

                <input
                  type="text"
                  value={
                    order.branch?.name ||
                    "-"
                  }
                  disabled
                />

              </div>

              {/* CUSTOMER */}

              <div className="form-group">

                <label>
                  Customer
                </label>

                <input
                  type="text"
                  value={
                    order.customer?.name ||
                    "-"
                  }
                  disabled
                />

              </div>

              {/* ORDER DATE */}

              <div className="form-group">

                <label>
                  Order Date *
                </label>

                <input
                  type="date"
                  name="orderDate"
                  value={
                    formData.orderDate
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* EXPECTED DELIVERY */}

              <div className="form-group">

                <label>
                  Expected Delivery Date
                </label>

                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={
                    formData.expectedDeliveryDate
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* WAREHOUSE */}

              <div className="form-group">

                <label>
                  Warehouse *
                </label>

                <input
                  type="text"
                  list="edit-warehouses-list"
                  value={
                    warehouseText
                  }
                  onChange={(e) =>
                    handleWarehouseChange(
                      e.target.value
                    )
                  }
                  placeholder="Select warehouse"
                  autoComplete="off"
                />

                <datalist id="edit-warehouses-list">

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={getId(
                          warehouse
                        )}
                        value={getName(
                          warehouse
                        )}
                      />
                    )
                  )}

                </datalist>

              </div>

              {/* STATUS */}

              <div className="form-group">

                <label>
                  Status
                </label>

                <input
                  type="text"
                  value={
                    order.status ||
                    "DRAFT"
                  }
                  disabled
                />

              </div>

            </div>

          </section>

          {/* =================================
              ORDER ITEMS
          ================================= */}

          <section className="sales-order-card">

            <div className="sales-order-card-header order-items-header">

              <div>

                <h2>
                  Order Items
                </h2>

                <p>
                  Update products and quantities
                </p>

              </div>

              <button
                type="button"
                className="add-item-button"
                onClick={addItem}
              >
                <FiPlus />
                Add Item
              </button>

            </div>

            <div className="order-items-container">

              {items.map(
                (item, index) => {

                  const calculated =
                    calculateItem(item);

                  return (
                    <div
                      className="order-item-row"
                      key={index}
                    >

                      {/* PRODUCT */}

                      <div className="form-group product-field">

                        <label>
                          Product *
                        </label>

                        <input
                          type="text"
                          list={`edit-products-list-${index}`}
                          value={
                            item.productText
                          }
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            handleProductBlur(
                              index
                            )
                          }
                          placeholder="Select product"
                          autoComplete="off"
                        />

                        <datalist
                          id={`edit-products-list-${index}`}
                        >

                          {products.map(
                            (product) => (
                              <option
                                key={getId(
                                  product
                                )}
                                value={getName(
                                  product
                                )}
                              />
                            )
                          )}

                        </datalist>

                      </div>

                      {/* DESCRIPTION */}

                      <div className="form-group">

                        <label>
                          Description
                        </label>

                        <input
                          type="text"
                          value={
                            item.description
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Product description"
                        />

                      </div>

                      {/* QUANTITY */}

                      <div className="form-group">

                        <label>
                          Qty
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      {/* UNIT PRICE */}

                      <div className="form-group">

                        <label>
                          Unit Price
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.unitPrice
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      {/* DISCOUNT */}

                      <div className="form-group">

                        <label>
                          Discount %
                        </label>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            item.discountPercent
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "discountPercent",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      {/* TAX */}

                      <div className="form-group">

                        <label>
                          Tax %
                        </label>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            item.taxPercent
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "taxPercent",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      {/* TOTAL */}

                      <div className="form-group line-total-field">

                        <label>
                          Total
                        </label>

                        <div className="line-total">
                          ₹
                          {calculated.lineTotal.toFixed(
                            2
                          )}
                        </div>

                      </div>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() =>
                          removeItem(
                            index
                          )
                        }
                        disabled={
                          items.length === 1
                        }
                        title="Remove item"
                      >
                        <FiTrash2 />
                      </button>

                    </div>
                  );
                }
              )}

            </div>

            {/* TOTALS */}

            <div className="sales-order-totals">

              <div className="total-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  ₹
                  {totals.subtotal.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="total-row">

                <span>
                  Discount
                </span>

                <strong>
                  ₹
                  {totals.discountAmount.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="total-row">

                <span>
                  Tax
                </span>

                <strong>
                  ₹
                  {totals.taxAmount.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="total-row grand-total">

                <span>
                  Total Amount
                </span>

                <strong>
                  ₹
                  {totals.totalAmount.toFixed(
                    2
                  )}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================
              ADDITIONAL INFORMATION
          ================================= */}

          <section className="sales-order-card">

            <div className="sales-order-card-header">

              <div>

                <h2>
                  Additional Information
                </h2>

                <p>
                  Update notes and terms
                </p>

              </div>

            </div>

            <div className="sales-order-form-grid">

              <div className="form-group full-width">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter notes..."
                  rows="4"
                />

              </div>

              <div className="form-group full-width">

                <label>
                  Terms & Conditions
                </label>

                <textarea
                  name="termsAndConditions"
                  value={
                    formData.termsAndConditions
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter terms and conditions..."
                  rows="4"
                />

              </div>

            </div>

          </section>

          {/* =================================
              ACTIONS
          ================================= */}

          <div className="sales-order-actions">

            <Link
              to={`/sales/orders/${id}`}
              className="cancel-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="save-order-button"
              disabled={saving}
            >
              {saving
                ? "Updating..."
                : "Update Sales Order"}
            </button>

          </div>

        </form>
      )}

    </div>
  );
}

export default EditSalesOrder;