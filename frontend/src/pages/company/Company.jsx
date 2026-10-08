import { useEffect, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiHome,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/company.css";

function Company() {
  // =====================================================
  // STATES
  // =====================================================

  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingCompany, setEditingCompany] =
    useState(null);

  const [viewCompany, setViewCompany] =
    useState(null);

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    email: "",
    phone: "",

    gstNumber: "",
    panNumber: "",

    address: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },

    logo: "",

    currency: "INR",

    financialYearStart: "April",

    timezone: "Asia/Kolkata",

    taxEnabled: true,

    isActive: true,
  });

  // =====================================================
  // FETCH COMPANIES
  // =====================================================

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      setError("");

      const response =
        await api.get("/companies");

      console.log(
        "Companies API Response:",
        response.data
      );

      /*
        Backend response:

        {
          success: true,
          pagination: {...},
          count: 1,
          companies: [...]
        }
      */

      const companyData =
        Array.isArray(
          response.data?.companies
        )
          ? response.data.companies
          : Array.isArray(
              response.data?.data
            )
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

      setCompanies(companyData);
    } catch (err) {
      console.error(
        "Company Fetch Error:",
        err
      );

      setCompanies([]);

      setError(
        err.response?.data?.message ||
          "Failed to load companies."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchCompanies();
  }, []);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    // =====================================
    // CHECKBOX
    // =====================================

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    // =====================================
    // ADDRESS FIELDS
    // =====================================

    const addressFields = [
      "street",
      "city",
      "state",
      "country",
      "pincode",
    ];

    if (addressFields.includes(name)) {
      setFormData((prev) => ({
        ...prev,

        address: {
          ...prev.address,

          [name]: value,
        },
      }));

      return;
    }

    // =====================================
    // NORMAL FIELDS
    // =====================================

    setFormData((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setFormData({
      name: "",
      legalName: "",
      email: "",
      phone: "",

      gstNumber: "",
      panNumber: "",

      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },

      logo: "",

      currency: "INR",

      financialYearStart: "April",

      timezone: "Asia/Kolkata",

      taxEnabled: true,

      isActive: true,
    });

    setEditingCompany(null);
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const handleAddCompany = () => {
    resetForm();

    setError("");

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const handleEditCompany = (company) => {
    setEditingCompany(company);

    setFormData({
      name:
        company.name || "",

      legalName:
        company.legalName || "",

      email:
        company.email || "",

      phone:
        company.phone || "",

      gstNumber:
        company.gstNumber || "",

      panNumber:
        company.panNumber || "",

      address: {
        street:
          company.address?.street || "",

        city:
          company.address?.city || "",

        state:
          company.address?.state || "",

        country:
          company.address?.country ||
          "India",

        pincode:
          company.address?.pincode || "",
      },

      logo:
        company.logo || "",

      currency:
        company.currency || "INR",

      financialYearStart:
        company.financialYearStart ||
        "April",

      timezone:
        company.timezone ||
        "Asia/Kolkata",

      taxEnabled:
        company.taxEnabled !== false,

      isActive:
        company.isActive !== false,
    });

    setError("");

    setShowModal(true);
  };

  // =====================================================
  // SAVE COMPANY
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      // =====================================
      // VALIDATION
      // =====================================

      if (!formData.name.trim()) {
        setError(
          "Company name is required."
        );

        return;
      }

      // =====================================
      // CLEAN PAYLOAD
      // =====================================

      const payload = {
        name:
          formData.name.trim(),

        legalName:
          formData.legalName.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        gstNumber:
          formData.gstNumber
            .trim()
            .toUpperCase(),

        panNumber:
          formData.panNumber
            .trim()
            .toUpperCase(),

        address: {
          street:
            formData.address.street.trim(),

          city:
            formData.address.city.trim(),

          state:
            formData.address.state.trim(),

          country:
            formData.address.country.trim() ||
            "India",

          pincode:
            formData.address.pincode.trim(),
        },

        logo:
          formData.logo.trim(),

        currency:
          formData.currency,

        financialYearStart:
          formData.financialYearStart,

        timezone:
          formData.timezone,

        taxEnabled:
          formData.taxEnabled,

        isActive:
          formData.isActive,
      };

      console.log(
        "Company Payload:",
        payload
      );

      // =====================================
      // UPDATE
      // =====================================

      if (editingCompany) {
        const response =
          await api.put(
            `/companies/${editingCompany._id}`,
            payload
          );

        console.log(
          "Company Update Response:",
          response.data
        );
      }

      // =====================================
      // CREATE
      // =====================================

      else {
        const response =
          await api.post(
            "/companies",
            payload
          );

        console.log(
          "Company Create Response:",
          response.data
        );
      }

      // =====================================
      // CLOSE MODAL
      // =====================================

      setShowModal(false);

      // =====================================
      // RESET FORM
      // =====================================

      resetForm();

      // =====================================
      // REFRESH DATA
      // =====================================

      await fetchCompanies();
    } catch (err) {
      console.error(
        "Company Save Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save company."
      );
    }
  };

  // =====================================================
  // DELETE COMPANY
  // =====================================================

  const handleDelete = async (company) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${company.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response =
        await api.delete(
          `/companies/${company._id}`
        );

      console.log(
        "Company Delete Response:",
        response.data
      );

      await fetchCompanies();
    } catch (err) {
      console.error(
        "Company Delete Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete company."
      );
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredCompanies =
    Array.isArray(companies)
      ? companies.filter(
          (company) => {
            const searchValue =
              search
                .toLowerCase()
                .trim();

            const name =
              company.name
                ?.toLowerCase() || "";

            const legalName =
              company.legalName
                ?.toLowerCase() || "";

            const email =
              company.email
                ?.toLowerCase() || "";

            const phone =
              company.phone
                ?.toLowerCase() || "";

            const gstNumber =
              company.gstNumber
                ?.toLowerCase() || "";

            const panNumber =
              company.panNumber
                ?.toLowerCase() || "";

            const city =
              company.address?.city
                ?.toLowerCase() || "";

            const state =
              company.address?.state
                ?.toLowerCase() || "";

            return (
              name.includes(searchValue) ||
              legalName.includes(
                searchValue
              ) ||
              email.includes(searchValue) ||
              phone.includes(searchValue) ||
              gstNumber.includes(
                searchValue
              ) ||
              panNumber.includes(
                searchValue
              ) ||
              city.includes(searchValue) ||
              state.includes(searchValue)
            );
          }
        )
      : [];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="company-page">
        <div className="company-loading">
          <div className="company-loader" />

          <p>
            Loading companies...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="company-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="company-header">

        <div>
          <div className="company-title-row">

            <div className="company-title-icon">
              <FiHome />
            </div>

            <div>

              <h2>
                Companies
              </h2>

              <p>
                Manage your business
                companies and
                organization details.
              </p>

            </div>

          </div>
        </div>

        <button
          className="company-add-btn"
          onClick={handleAddCompany}
        >
          <FiPlus />

          <span>
            Add Company
          </span>
        </button>

      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="company-error">
          {error}
        </div>
      )}

      {/* =========================================
          TOOLBAR
      ========================================= */}

      <div className="company-toolbar">

        <div className="company-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="company-count">

          {filteredCompanies.length}{" "}

          {filteredCompanies.length === 1
            ? "Company"
            : "Companies"}

        </div>

      </div>

      {/* =========================================
          COMPANY LIST
      ========================================= */}

      {filteredCompanies.length === 0 ? (

        <div className="company-empty">

          <div className="company-empty-icon">
            <FiHome />
          </div>

          <h3>
            {search
              ? "No companies found"
              : "No companies available"}
          </h3>

          <p>
            {search
              ? "Try a different search term."
              : "Create your first company to get started."}
          </p>

          {!search && (
            <button
              className="company-add-btn"
              onClick={handleAddCompany}
            >
              <FiPlus />

              Add Company
            </button>
          )}

        </div>

      ) : (

        <div className="company-grid">

          {filteredCompanies.map(
            (company) => (

              <div
                className="company-card"
                key={company._id}
              >

                {/* =================================
                    CARD TOP
                ================================= */}

                <div className="company-card-top">

                  <div className="company-logo">
                    <FiHome />
                  </div>

                  <div className="company-card-actions">

                    <button
                      title="View"
                      onClick={() =>
                        setViewCompany(
                          company
                        )
                      }
                    >
                      <FiEye />
                    </button>

                    <button
                      title="Edit"
                      onClick={() =>
                        handleEditCompany(
                          company
                        )
                      }
                    >
                      <FiEdit2 />
                    </button>

                    <button
                      className="delete"
                      title="Delete"
                      onClick={() =>
                        handleDelete(
                          company
                        )
                      }
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </div>

                {/* =================================
                    COMPANY DETAILS
                ================================= */}

                <div className="company-card-body">

                  <h3>
                    {company.name}
                  </h3>

                  <p className="company-legal-name">

                    {company.legalName ||
                      "Legal name not available"}

                  </p>

                  <div className="company-detail">

                    <FiMail />

                    <span>
                      {company.email ||
                        "Email not available"}
                    </span>

                  </div>

                  <div className="company-detail">

                    <FiPhone />

                    <span>
                      {company.phone ||
                        "Phone not available"}
                    </span>

                  </div>

                  <div className="company-detail">

                    <FiMapPin />

                    <span>

                      {[
                        company.address?.city,

                        company.address?.state,

                        company.address?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location not available"}

                    </span>

                  </div>

                </div>

                {/* =================================
                    CARD FOOTER
                ================================= */}

                <div className="company-card-footer">

                  <span
                    className={
                      company.isActive ===
                      false
                        ? "company-status inactive"
                        : "company-status"
                    }
                  >

                    <span />

                    {company.isActive ===
                    false
                      ? "Inactive"
                      : "Active"}

                  </span>

                  <span className="company-id">

                    ID:{" "}

                    {company._id?.slice(
                      -6
                    )}

                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* =========================================
          ADD / EDIT MODAL
      ========================================= */}

      {showModal && (

        <div
          className="company-modal-overlay"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >

          <div
            className="company-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="company-modal-header">

              <div>

                <h3>

                  {editingCompany
                    ? "Edit Company"
                    : "Add Company"}

                </h3>

                <p>

                  {editingCompany
                    ? "Update company information."
                    : "Create a new company."}

                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              className="company-form"
              onSubmit={handleSubmit}
            >

              <div className="company-form-grid">

                {/* COMPANY NAME */}

                <div className="company-form-group">

                  <label>
                    Company Name *
                  </label>

                  <input
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="WebNexa Technologies"
                    required
                  />

                </div>

                {/* LEGAL NAME */}

                <div className="company-form-group">

                  <label>
                    Legal Name
                  </label>

                  <input
                    name="legalName"
                    value={
                      formData.legalName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="WebNexa Technologies Private Limited"
                  />

                </div>

                {/* EMAIL */}

                <div className="company-form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="company@example.com"
                  />

                </div>

                {/* PHONE */}

                <div className="company-form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="+91 9876543210"
                  />

                </div>

                {/* GST */}

                <div className="company-form-group">

                  <label>
                    GST Number
                  </label>

                  <input
                    name="gstNumber"
                    value={
                      formData.gstNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="GST Number"
                  />

                </div>

                {/* PAN */}

                <div className="company-form-group">

                  <label>
                    PAN Number
                  </label>

                  <input
                    name="panNumber"
                    value={
                      formData.panNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="PAN Number"
                  />

                </div>

                {/* ADDRESS */}

                <div className="company-form-group full">

                  <label>
                    Address
                  </label>

                  <textarea
                    name="street"
                    value={
                      formData.address
                        .street
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Company address"
                    rows="3"
                  />

                </div>

                {/* CITY */}

                <div className="company-form-group">

                  <label>
                    City
                  </label>

                  <input
                    name="city"
                    value={
                      formData.address
                        .city
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Coimbatore"
                  />

                </div>

                {/* STATE */}

                <div className="company-form-group">

                  <label>
                    State
                  </label>

                  <input
                    name="state"
                    value={
                      formData.address
                        .state
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Tamil Nadu"
                  />

                </div>

                {/* COUNTRY */}

                <div className="company-form-group">

                  <label>
                    Country
                  </label>

                  <input
                    name="country"
                    value={
                      formData.address
                        .country
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="India"
                  />

                </div>

                {/* PINCODE */}

                <div className="company-form-group">

                  <label>
                    Pincode
                  </label>

                  <input
                    name="pincode"
                    value={
                      formData.address
                        .pincode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="641001"
                  />

                </div>

                {/* CURRENCY */}

                <div className="company-form-group">

                  <label>
                    Currency
                  </label>

                  <select
                    name="currency"
                    value={
                      formData.currency
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="INR">
                      INR - Indian Rupee
                    </option>

                    <option value="USD">
                      USD - US Dollar
                    </option>

                    <option value="EUR">
                      EUR - Euro
                    </option>

                    <option value="GBP">
                      GBP - British Pound
                    </option>

                  </select>

                </div>

                {/* FINANCIAL YEAR */}

                <div className="company-form-group">

                  <label>
                    Financial Year Start
                  </label>

                  <select
                    name="financialYearStart"
                    value={
                      formData.financialYearStart
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="April">
                      April
                    </option>

                    <option value="January">
                      January
                    </option>

                  </select>

                </div>

                {/* TIMEZONE */}

                <div className="company-form-group">

                  <label>
                    Timezone
                  </label>

                  <input
                    name="timezone"
                    value={
                      formData.timezone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Asia/Kolkata"
                  />

                </div>

              </div>

              {/* =================================
                  SETTINGS
              ================================= */}

              <div
                className="company-form-group"
                style={{
                  marginTop: "18px",
                }}
              >

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="checkbox"
                    name="taxEnabled"
                    checked={
                      formData.taxEnabled
                    }
                    onChange={
                      handleChange
                    }
                  />

                  Tax Enabled

                </label>

              </div>

              <div
                className="company-form-group"
                style={{
                  marginTop: "10px",
                }}
              >

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      formData.isActive
                    }
                    onChange={
                      handleChange
                    }
                  />

                  Active Company

                </label>

              </div>

              {/* =================================
                  FORM ACTIONS
              ================================= */}

              <div className="company-form-actions">

                <button
                  type="button"
                  className="company-cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="company-save-btn"
                >

                  {editingCompany
                    ? "Update Company"
                    : "Create Company"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================================
          VIEW MODAL
      ========================================= */}

      {viewCompany && (

        <div
          className="company-modal-overlay"
          onClick={() =>
            setViewCompany(null)
          }
        >

          <div
            className="company-modal company-view-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* VIEW HEADER */}

            <div className="company-view-header">

              <div className="company-view-logo">
                <FiHome />
              </div>

              <div>

                <h3>
                  {viewCompany.name}
                </h3>

                <p>
                  {viewCompany.legalName ||
                    "Company details"}
                </p>

              </div>

            </div>

            {/* VIEW DETAILS */}

            <div className="company-view-details">

              <div>

                <span>
                  Email
                </span>

                <strong>
                  {viewCompany.email ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Phone
                </span>

                <strong>
                  {viewCompany.phone ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  GST Number
                </span>

                <strong>
                  {viewCompany.gstNumber ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  PAN Number
                </span>

                <strong>
                  {viewCompany.panNumber ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Address
                </span>

                <strong>
                  {viewCompany.address
                    ?.street || "-"}
                </strong>

              </div>

              <div>

                <span>
                  City
                </span>

                <strong>
                  {viewCompany.address
                    ?.city || "-"}
                </strong>

              </div>

              <div>

                <span>
                  State
                </span>

                <strong>
                  {viewCompany.address
                    ?.state || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Country
                </span>

                <strong>
                  {viewCompany.address
                    ?.country || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Pincode
                </span>

                <strong>
                  {viewCompany.address
                    ?.pincode || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Currency
                </span>

                <strong>
                  {viewCompany.currency ||
                    "INR"}
                </strong>

              </div>

              <div>

                <span>
                  Financial Year
                </span>

                <strong>
                  {viewCompany.financialYearStart ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Timezone
                </span>

                <strong>
                  {viewCompany.timezone ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Tax
                </span>

                <strong>
                  {viewCompany.taxEnabled
                    ? "Enabled"
                    : "Disabled"}
                </strong>

              </div>

              <div>

                <span>
                  Status
                </span>

                <strong
                  className={
                    viewCompany.isActive ===
                    false
                      ? "view-inactive"
                      : "view-active"
                  }
                >
                  {viewCompany.isActive ===
                  false
                    ? "Inactive"
                    : "Active"}
                </strong>

              </div>

            </div>

            {/* VIEW ACTIONS */}

            <div className="company-form-actions">

              <button
                type="button"
                className="company-cancel-btn"
                onClick={() =>
                  setViewCompany(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="company-save-btn"
                onClick={() => {
                  setViewCompany(null);

                  handleEditCompany(
                    viewCompany
                  );
                }}
              >

                <FiEdit2 />

                Edit Company

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Company;