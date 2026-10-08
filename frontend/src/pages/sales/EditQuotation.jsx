import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/edit-quotation.css";

function EditQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [quotation, setQuotation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    company: "",
    branch: "",
    quotationDate: "",
    validUntil: "",
    customer: "",
    salesPerson: "",
    notes: "",
    termsAndConditions: "",
  });

  const [items, setItems] = useState([]);

  /* =====================================
     LOAD ALL DATA
  ===================================== */

  useEffect(() => {
    loadData();
  }, [id]);

  const getArray = (response, key) => {
    return (
      response?.data?.[key] ||
      response?.data?.data ||
      []
    );
  };

  const getId = (item) => {
    if (!item) return "";
    return item._id || item.id || "";
  };

  const getName = (item) => {
    if (!item) return "";

    return (
      item.name ||
      item.companyName ||
      item.customerName ||
      item.productName ||
      item.branchName ||
      ""
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        quotationResponse,
        companiesResponse,
        branchesResponse,
        customersResponse,
        productsResponse,
      ] = await Promise.all([
        api.get(`/quotations/${id}`),
        api.get("/companies"),
        api.get("/branches"),
        api.get("/customers"),
        api.get("/products"),
      ]);

      const quotationData =
        quotationResponse.data.quotation;

      setQuotation(quotationData);

      setCompanies(
        getArray(companiesResponse, "companies")
      );

      setBranches(
        getArray(branchesResponse, "branches")
      );

      setCustomers(
        getArray(customersResponse, "customers")
      );

      setProducts(
        getArray(productsResponse, "products")
      );

      setFormData({
        company: getId(quotationData.company),
        branch: getId(quotationData.branch),
        quotationDate: quotationData.quotationDate
          ? quotationData.quotationDate.substring(0, 10)
          : "",
        validUntil: quotationData.validUntil
          ? quotationData.validUntil.substring(0, 10)
          : "",
        customer: getId(quotationData.customer),
        salesPerson: getId(
          quotationData.salesPerson
        ),
        notes: quotationData.notes || "",
        termsAndConditions:
          quotationData.termsAndConditions || "",
      });

      setItems(
        (quotationData.items || []).map((item) => ({
          product: getId(item.product),
          description: item.description || "",
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
          discountPercent: Number(
            item.discountPercent || 0
          ),
          taxPercent: Number(
            item.taxPercent || 0
          ),
        }))
      );
    } catch (err) {
      console.error("Edit quotation load error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load quotation."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================
     FORM HANDLERS
  ===================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================
     ITEM HANDLERS
  ===================================== */

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      return;
    }

    setItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find(
      (product) =>
        getId(product) === productId
    );

    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          product: productId,
          description:
            item.description ||
            selectedProduct?.description ||
            "",
          unitPrice: selectedProduct
            ? Number(
                selectedProduct.sellingPrice ||
                  selectedProduct.salePrice ||
                  selectedProduct.price ||
                  item.unitPrice ||
                  0
              )
            : item.unitPrice,
        };
      })
    );
  };

  /* =====================================
     CALCULATIONS
  ===================================== */

  const calculateItem = (item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const discountPercent = Number(
      item.discountPercent || 0
    );
    const taxPercent = Number(
      item.taxPercent || 0
    );

    const gross = quantity * unitPrice;

    const discountAmount =
      gross * (discountPercent / 100);

    const taxableAmount =
      gross - discountAmount;

    const taxAmount =
      taxableAmount * (taxPercent / 100);

    const lineTotal =
      taxableAmount + taxAmount;

    return {
      gross,
      discountAmount,
      taxableAmount,
      taxAmount,
      lineTotal,
    };
  };

  const totals = items.reduce(
    (acc, item) => {
      const calculation = calculateItem(item);

      acc.subtotal += calculation.gross;
      acc.discount += calculation.discountAmount;
      acc.taxable += calculation.taxableAmount;
      acc.tax += calculation.taxAmount;
      acc.total += calculation.lineTotal;

      return acc;
    },
    {
      subtotal: 0,
      discount: 0,
      taxable: 0,
      tax: 0,
      total: 0,
    }
  );

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    );
  };

  /* =====================================
     SUBMIT
  ===================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!formData.quotationDate) {
        setError("Quotation date is required.");
        return;
      }

      if (!formData.validUntil) {
        setError("Valid until date is required.");
        return;
      }

      if (
        new Date(formData.validUntil) <
        new Date(formData.quotationDate)
      ) {
        setError(
          "Valid until date cannot be before quotation date."
        );
        return;
      }

      if (!formData.customer) {
        setError("Please select a customer.");
        return;
      }

      if (!items.length) {
        setError(
          "At least one quotation item is required."
        );
        return;
      }

      const usedProducts = new Set();

      for (const item of items) {
        if (!item.product) {
          setError("Please select a product for every item.");
          return;
        }

        if (usedProducts.has(item.product)) {
          setError(
            "Same product cannot be added more than once."
          );
          return;
        }

        usedProducts.add(item.product);

        if (Number(item.quantity) <= 0) {
          setError(
            "Quantity must be greater than zero."
          );
          return;
        }

        if (Number(item.unitPrice) < 0) {
          setError(
            "Unit price cannot be negative."
          );
          return;
        }

        if (
          Number(item.discountPercent) < 0 ||
          Number(item.discountPercent) > 100
        ) {
          setError(
            "Discount must be between 0 and 100."
          );
          return;
        }

        if (
          Number(item.taxPercent) < 0 ||
          Number(item.taxPercent) > 100
        ) {
          setError(
            "Tax must be between 0 and 100."
          );
          return;
        }
      }

      const payload = {
        quotationDate: formData.quotationDate,
        validUntil: formData.validUntil,
        customer: formData.customer,
        salesPerson:
          formData.salesPerson || null,

        items: items.map((item) => ({
          product: item.product,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountPercent: Number(
            item.discountPercent || 0
          ),
          taxPercent: Number(
            item.taxPercent || 0
          ),
        })),

        notes: formData.notes.trim(),
        termsAndConditions:
          formData.termsAndConditions.trim(),
      };

      await api.patch(
        `/quotations/${id}`,
        payload
      );

      navigate(`/sales/quotations/${id}`);
    } catch (err) {
      console.error("Quotation update error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update quotation."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================
     LOADING
  ===================================== */

  if (loading) {
    return (
      <div className="edit-quotation-page">
        <div className="edit-quotation-loader">
          <div className="edit-quotation-spinner"></div>
          <p>Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="edit-quotation-page">
        <div className="edit-quotation-error">
          {error || "Quotation not found."}
        </div>

        <Link
          to="/sales/quotations"
          className="edit-quotation-back"
        >
          <FiArrowLeft />
          Back to Quotations
        </Link>
      </div>
    );
  }

  if (
    ["ACCEPTED", "CANCELLED"].includes(
      quotation.status
    )
  ) {
    return (
      <div className="edit-quotation-page">
        <div className="edit-quotation-error">
          This quotation cannot be edited because its
          status is {quotation.status}.
        </div>

        <Link
          to={`/sales/quotations/${id}`}
          className="edit-quotation-back"
        >
          <FiArrowLeft />
          Back to Quotation
        </Link>
      </div>
    );
  }

  const filteredBranches = branches.filter(
    (branch) =>
      getId(branch.company) === formData.company ||
      getId(branch) === getId(quotation.branch)
  );

  const filteredCustomers = customers.filter(
    (customer) =>
      getId(customer.company) === formData.company ||
      getId(customer) === getId(quotation.customer)
  );

  /* =====================================
     UI
  ===================================== */

  return (
    <div className="edit-quotation-page">

      {/* HEADER */}

      <div className="edit-quotation-header">

        <div className="edit-quotation-heading">

          <Link
            to={`/sales/quotations/${id}`}
            className="edit-quotation-back-icon"
          >
            <FiArrowLeft />
          </Link>

          <div>
            <div className="edit-quotation-title">
              <FiFileText />

              <h1>
                Edit{" "}
                {quotation.quotationNumber}
              </h1>
            </div>

            <p>
              Update quotation details and items
            </p>
          </div>

        </div>

        <button
          type="submit"
          form="editQuotationForm"
          className="edit-quotation-save-btn"
          disabled={saving}
        >
          <FiSave />

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>

      </div>

      {error && (
        <div className="edit-quotation-error">
          {error}
        </div>
      )}

      <form
        id="editQuotationForm"
        onSubmit={handleSubmit}
      >

        {/* BASIC DETAILS */}

        <div className="edit-quotation-card">

          <div className="edit-quotation-card-title">
            <h2>Quotation Information</h2>
          </div>

          <div className="edit-quotation-form-grid">

            <div className="edit-quotation-field">
              <label>Company</label>

              <input
                type="text"
                value={
                  getName(quotation.company) ||
                  "-"
                }
                disabled
              />
            </div>

            <div className="edit-quotation-field">
              <label>Branch</label>

              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              >
                {filteredBranches.map((branch) => (
                  <option
                    key={getId(branch)}
                    value={getId(branch)}
                  >
                    {getName(branch)}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-quotation-field">
              <label>
                Quotation Date
                <span>*</span>
              </label>

              <input
                type="date"
                name="quotationDate"
                value={formData.quotationDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="edit-quotation-field">
              <label>
                Valid Until
                <span>*</span>
              </label>

              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                required
              />
            </div>

            <div className="edit-quotation-field">
              <label>
                Customer
                <span>*</span>
              </label>

              <select
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Customer
                </option>

                {filteredCustomers.map(
                  (customer) => (
                    <option
                      key={getId(customer)}
                      value={getId(customer)}
                    >
                      {getName(customer)}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>
        </div>

        {/* ITEMS */}

        <div className="edit-quotation-card">

          <div className="edit-quotation-items-header">

            <div>
              <h2>Quotation Items</h2>
              <p>
                Add or update products
              </p>
            </div>

            <button
              type="button"
              className="edit-quotation-add-item"
              onClick={addItem}
            >
              <FiPlus />
              Add Item
            </button>

          </div>

          <div className="edit-quotation-items">

            {items.map((item, index) => {
              const calculation =
                calculateItem(item);

              return (
                <div
                  className="edit-quotation-item"
                  key={index}
                >

                  <div className="edit-quotation-item-top">

                    <span>
                      Item {index + 1}
                    </span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="edit-quotation-remove"
                        onClick={() =>
                          removeItem(index)
                        }
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    )}

                  </div>

                  <div className="edit-quotation-item-grid">

                    <div className="edit-quotation-field item-product">
                      <label>
                        Product
                        <span>*</span>
                      </label>

                      <select
                        value={item.product}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">
                          Select Product
                        </option>

                        {products.map(
                          (product) => (
                            <option
                              key={getId(product)}
                              value={getId(product)}
                            >
                              {getName(product)}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="edit-quotation-field item-description">
                      <label>
                        Description
                      </label>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Product description"
                      />
                    </div>

                    <div className="edit-quotation-field">
                      <label>
                        Quantity
                        <span>*</span>
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="edit-quotation-field">
                      <label>
                        Unit Price
                        <span>*</span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unitPrice",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="edit-quotation-field">
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
                          updateItem(
                            index,
                            "discountPercent",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="edit-quotation-field">
                      <label>
                        Tax %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxPercent}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "taxPercent",
                            e.target.value
                          )
                        }
                      />
                    </div>

                  </div>

                  <div className="edit-quotation-line-total">

                    <span>
                      Line Total
                    </span>

                    <strong>
                      {formatAmount(
                        calculation.lineTotal
                      )}
                    </strong>

                  </div>

                </div>
              );
            })}

          </div>
        </div>

        {/* NOTES */}

        <div className="edit-quotation-card">

          <div className="edit-quotation-card-title">
            <h2>Additional Information</h2>
          </div>

          <div className="edit-quotation-textarea-grid">

            <div className="edit-quotation-field">
              <label>Notes</label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="5"
                placeholder="Enter notes..."
              />
            </div>

            <div className="edit-quotation-field">
              <label>
                Terms & Conditions
              </label>

              <textarea
                name="termsAndConditions"
                value={
                  formData.termsAndConditions
                }
                onChange={handleChange}
                rows="5"
                placeholder="Enter terms and conditions..."
              />
            </div>

          </div>

        </div>

        {/* TOTALS */}

        <div className="edit-quotation-total-card">

          <div>
            <span>Subtotal</span>
            <strong>
              {formatAmount(
                totals.subtotal
              )}
            </strong>
          </div>

          <div>
            <span>Discount</span>
            <strong>
              -{" "}
              {formatAmount(
                totals.discount
              )}
            </strong>
          </div>

          <div>
            <span>Taxable Amount</span>
            <strong>
              {formatAmount(
                totals.taxable
              )}
            </strong>
          </div>

          <div>
            <span>Tax</span>
            <strong>
              {formatAmount(
                totals.tax
              )}
            </strong>
          </div>

          <div className="edit-quotation-grand-total">
            <span>Total Amount</span>

            <strong>
              {formatAmount(
                totals.total
              )}
            </strong>
          </div>

        </div>

      </form>
    </div>
  );
}

export default EditQuotation;