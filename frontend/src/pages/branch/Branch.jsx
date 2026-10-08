import { useEffect, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiGitBranch,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
} from "react-icons/fi";

import api from "../../services/api";

import "../../styles/branch.css";

function Branch() {
  // =====================================================
  // STATES
  // =====================================================

  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingBranch, setEditingBranch] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    branchCode: "",
    email: "",
    phone: "",

    address: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },

    isMainBranch: false,
  });

  // =====================================================
  // FETCH BRANCHES
  // =====================================================

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/branches");

      console.log(
        "Branches API Response:",
        response.data
      );

      const branchData =
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.branches)
          ? response.data.branches
          : [];

      setBranches(branchData);
    } catch (err) {
      console.error(
        "Fetch branches error:",
        err
      );

      setBranches([]);

      setError(
        err.response?.data?.message ||
          "Failed to load branches"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH COMPANIES
  // =====================================================

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies");

      console.log(
        "Companies API Response:",
        response.data
      );

      const companyData =
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.companies)
          ? response.data.companies
          : [];

      setCompanies(companyData);
    } catch (err) {
      console.error(
        "Fetch companies error:",
        err
      );

      setCompanies([]);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchBranches();
    fetchCompanies();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    // Main branch checkbox
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    // Address fields
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

    // Normal fields
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
      company: "",
      name: "",
      branchCode: "",
      email: "",
      phone: "",

      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },

      isMainBranch: false,
    });

    setEditingBranch(null);
  };

  // =====================================================
  // ADD BRANCH
  // =====================================================

  const handleAdd = () => {
    resetForm();

    setError("");

    setShowModal(true);
  };

  // =====================================================
  // EDIT BRANCH
  // =====================================================

  const handleEdit = (branch) => {
    setEditingBranch(branch);

    setFormData({
      company:
        branch.company?._id ||
        branch.company ||
        "",

      name:
        branch.name || "",

      branchCode:
        branch.branchCode || "",

      email:
        branch.email || "",

      phone:
        branch.phone || "",

      address: {
        street:
          branch.address?.street || "",

        city:
          branch.address?.city || "",

        state:
          branch.address?.state || "",

        country:
          branch.address?.country ||
          "India",

        pincode:
          branch.address?.pincode || "",
      },

      isMainBranch:
        branch.isMainBranch || false,
    });

    setError("");

    setShowModal(true);
  };

  // =====================================================
  // SAVE BRANCH
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      // Company validation
      if (!formData.company) {
        setError(
          "Please select a company"
        );

        return;
      }

      // Branch name validation
      if (!formData.name.trim()) {
        setError(
          "Branch name is required"
        );

        return;
      }

      // Branch code validation
      if (!formData.branchCode.trim()) {
        setError(
          "Branch code is required"
        );

        return;
      }

      // Prepare clean payload
      const payload = {
        company: formData.company,

        name: formData.name.trim(),

        branchCode:
          formData.branchCode
            .trim()
            .toUpperCase(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

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

        isMainBranch:
          formData.isMainBranch,
      };

      console.log(
        "Branch Payload:",
        payload
      );

      // UPDATE
      if (editingBranch) {
        await api.put(
          `/branches/${editingBranch._id}`,
          payload
        );
      }

      // CREATE
      else {
        await api.post(
          "/branches",
          payload
        );
      }

      // Close modal
      setShowModal(false);

      // Reset
      resetForm();

      // Refresh list
      await fetchBranches();
    } catch (err) {
      console.error(
        "Save branch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save branch"
      );
    }
  };

  // =====================================================
  // DELETE BRANCH
  // =====================================================

  const handleDelete = async (branch) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${branch.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/branches/${branch._id}`
      );

      await fetchBranches();
    } catch (err) {
      console.error(
        "Delete branch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete branch"
      );
    }
  };

  // =====================================================
  // VIEW BRANCH
  // =====================================================

  const handleView = (branch) => {
    setSelectedBranch(branch);

    setShowViewModal(true);
  };

  // =====================================================
  // COMPANY NAME
  // =====================================================

  const getCompanyName = (company) => {
    if (!company) {
      return "No Company";
    }

    // Populated company
    if (
      typeof company === "object"
    ) {
      return (
        company.name ||
        company.legalName ||
        "Unknown Company"
      );
    }

    // Company ID
    const foundCompany =
      companies.find(
        (item) =>
          item._id === company
      );

    return (
      foundCompany?.name ||
      foundCompany?.legalName ||
      "Unknown Company"
    );
  };

  // =====================================================
  // FILTER BRANCHES
  // =====================================================

  const filteredBranches =
    Array.isArray(branches)
      ? branches.filter(
          (branch) => {
            const searchText =
              search
                .toLowerCase()
                .trim();

            const companyName =
              getCompanyName(
                branch.company
              ).toLowerCase();

            const street =
              branch.address?.street
                ?.toLowerCase() || "";

            const city =
              branch.address?.city
                ?.toLowerCase() || "";

            const state =
              branch.address?.state
                ?.toLowerCase() || "";

            const country =
              branch.address?.country
                ?.toLowerCase() || "";

            const pincode =
              branch.address?.pincode
                ?.toLowerCase() || "";

            return (
              branch.name
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              branch.branchCode
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              branch.email
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              branch.phone
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              companyName.includes(
                searchText
              ) ||

              street.includes(
                searchText
              ) ||

              city.includes(
                searchText
              ) ||

              state.includes(
                searchText
              ) ||

              country.includes(
                searchText
              ) ||

              pincode.includes(
                searchText
              )
            );
          }
        )
      : [];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="branch-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="branch-header">

        <div className="branch-header-left">

          <div className="branch-title-icon">
            <FiGitBranch />
          </div>

          <div>
            <h1>
              Branch Management
            </h1>

            <p>
              Manage company branches
              and locations
            </p>
          </div>

        </div>

        <button
          type="button"
          className="branch-add-btn"
          onClick={handleAdd}
        >
          <FiPlus />

          Add Branch
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="branch-error">
          {error}
        </div>
      )}

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="branch-toolbar">

        <div className="branch-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search branches..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="branch-count">

          {filteredBranches.length}

          {" "}

          {filteredBranches.length === 1
            ? "Branch"
            : "Branches"}

        </div>

      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="branch-loading">

          <div className="branch-spinner"></div>

          <p>
            Loading branches...
          </p>

        </div>

      ) : filteredBranches.length === 0 ? (

        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="branch-empty">

          <div className="branch-empty-icon">
            <FiGitBranch />
          </div>

          <h3>
            No branches found
          </h3>

          <p>
            {search
              ? "Try changing your search."
              : "Create your first branch to get started."}
          </p>

          {!search && (
            <button
              type="button"
              className="branch-add-btn"
              onClick={handleAdd}
            >
              <FiPlus />

              Add Branch
            </button>
          )}

        </div>

      ) : (

        /* =================================================
           BRANCH GRID
        ================================================= */

        <div className="branch-grid">

          {filteredBranches.map(
            (branch) => (

              <div
                className="branch-card"
                key={branch._id}
              >

                {/* =======================================
                    CARD TOP
                ======================================= */}

                <div className="branch-card-top">

                  <div className="branch-card-icon">
                    <FiGitBranch />
                  </div>

                  <div className="branch-card-actions">

                    {/* VIEW */}

                    <button
                      type="button"
                      onClick={() =>
                        handleView(
                          branch
                        )
                      }
                      title="View Branch"
                    >
                      <FiEye />
                    </button>

                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(
                          branch
                        )
                      }
                      title="Edit Branch"
                    >
                      <FiEdit2 />
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      className="delete"
                      onClick={() =>
                        handleDelete(
                          branch
                        )
                      }
                      title="Delete Branch"
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </div>

                {/* =======================================
                    CARD CONTENT
                ======================================= */}

                <div className="branch-card-content">

                  <div className="branch-name-row">

                    <h3>
                      {branch.name}
                    </h3>

                    {branch.isMainBranch && (
                      <span className="main-branch-badge">
                        Main Branch
                      </span>
                    )}

                  </div>

                  <span className="branch-code">
                    {branch.branchCode ||
                      "No Branch Code"}
                  </span>

                  {/* COMPANY */}

                  <div className="branch-detail">

                    <FiHome />

                    <span>
                      {getCompanyName(
                        branch.company
                      )}
                    </span>

                  </div>

                  {/* EMAIL */}

                  {branch.email && (
                    <div className="branch-detail">

                      <FiMail />

                      <span>
                        {branch.email}
                      </span>

                    </div>
                  )}

                  {/* PHONE */}

                  {branch.phone && (
                    <div className="branch-detail">

                      <FiPhone />

                      <span>
                        {branch.phone}
                      </span>

                    </div>
                  )}

                  {/* LOCATION */}

                  {(branch.address?.city ||
                    branch.address?.state) && (

                    <div className="branch-detail">

                      <FiMapPin />

                      <span>

                        {branch.address?.city}

                        {branch.address?.city &&
                          branch.address?.state &&
                          ", "}

                        {branch.address?.state}

                      </span>

                    </div>

                  )}

                </div>

                {/* =======================================
                    CARD FOOTER
                ======================================= */}

                <div className="branch-card-footer">

                  <span
                    className={
                      branch.isActive !==
                      false
                        ? "status active"
                        : "status inactive"
                    }
                  >

                    <span className="status-dot"></span>

                    {branch.isActive !==
                    false
                      ? "Active"
                      : "Inactive"}

                  </span>

                  <span className="branch-id">

                    ID:

                    {" "}

                    {branch._id
                      ?.slice(-6)
                      .toUpperCase()}

                  </span>

                </div>

              </div>
            )
          )}

        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="branch-modal-overlay"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >

          <div
            className="branch-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="branch-modal-header">

              <div>

                <h2>
                  {editingBranch
                    ? "Edit Branch"
                    : "Add New Branch"}
                </h2>

                <p>
                  {editingBranch
                    ? "Update branch information"
                    : "Create a new company branch"}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              className="branch-form"
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                {/* COMPANY */}

                <div className="form-group">

                  <label>
                    Company
                    <span>*</span>
                  </label>

                  <select
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select Company
                    </option>

                    {companies.map(
                      (company) => (

                        <option
                          key={
                            company._id
                          }
                          value={
                            company._id
                          }
                        >
                          {company.name ||
                            company.legalName}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* BRANCH NAME */}

                <div className="form-group">

                  <label>
                    Branch Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter branch name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                {/* BRANCH CODE */}

                <div className="form-group">

                  <label>
                    Branch Code
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="branchCode"
                    placeholder="e.g. WN-MAIN-001"
                    value={
                      formData.branchCode
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="branch@company.com"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* PHONE */}

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* CITY */}

                <div className="form-group">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    value={
                      formData.address
                        .city
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* STATE */}

                <div className="form-group">

                  <label>
                    State
                  </label>

                  <input
                    type="text"
                    name="state"
                    placeholder="Enter state"
                    value={
                      formData.address
                        .state
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* COUNTRY */}

                <div className="form-group">

                  <label>
                    Country
                  </label>

                  <input
                    type="text"
                    name="country"
                    placeholder="Enter country"
                    value={
                      formData.address
                        .country
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* PINCODE */}

                <div className="form-group">

                  <label>
                    Pincode
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    placeholder="Enter pincode"
                    value={
                      formData.address
                        .pincode
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  STREET ADDRESS
              ================================================= */}

              <div className="form-group full-width">

                <label>
                  Address
                </label>

                <textarea
                  name="street"
                  rows="3"
                  placeholder="Enter branch address"
                  value={
                    formData.address
                      .street
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* =================================================
                  MAIN BRANCH
              ================================================= */}

              <label className="checkbox-group">

                <input
                  type="checkbox"
                  name="isMainBranch"
                  checked={
                    formData.isMainBranch
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Mark as Main Branch
                </span>

              </label>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="branch-modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(
                      false
                    );

                    resetForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                >
                  {editingBranch
                    ? "Update Branch"
                    : "Create Branch"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showViewModal &&
        selectedBranch && (

          <div
            className="branch-modal-overlay"
            onClick={() =>
              setShowViewModal(
                false
              )
            }
          >

            <div
              className="branch-modal view-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="branch-modal-header">

                <div>

                  <h2>
                    Branch Details
                  </h2>

                  <p>
                    Complete branch
                    information
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              {/* VIEW CONTENT */}

              <div className="branch-view-content">

                {/* TITLE */}

                <div className="branch-view-title">

                  <div className="branch-view-icon">
                    <FiGitBranch />
                  </div>

                  <div>

                    <h3>
                      {
                        selectedBranch.name
                      }
                    </h3>

                    <span>
                      {
                        selectedBranch.branchCode ||
                        "No Branch Code"
                      }
                    </span>

                  </div>

                </div>

                {/* STATUS */}

                <div className="branch-view-status">

                  <span
                    className={
                      selectedBranch.isActive !==
                      false
                        ? "status active"
                        : "status inactive"
                    }
                  >

                    <span className="status-dot"></span>

                    {selectedBranch.isActive !==
                    false
                      ? "Active"
                      : "Inactive"}

                  </span>

                  {selectedBranch.isMainBranch && (
                    <span className="main-branch-badge">
                      Main Branch
                    </span>
                  )}

                </div>

                {/* DETAILS */}

                <div className="branch-view-grid">

                  {/* COMPANY */}

                  <div className="view-detail">

                    <span className="view-label">
                      Company
                    </span>

                    <strong>
                      {getCompanyName(
                        selectedBranch.company
                      )}
                    </strong>

                  </div>

                  {/* BRANCH CODE */}

                  <div className="view-detail">

                    <span className="view-label">
                      Branch Code
                    </span>

                    <strong>
                      {
                        selectedBranch.branchCode ||
                        "-"
                      }
                    </strong>

                  </div>

                  {/* EMAIL */}

                  <div className="view-detail">

                    <span className="view-label">
                      Email
                    </span>

                    <strong>
                      {
                        selectedBranch.email ||
                        "-"
                      }
                    </strong>

                  </div>

                  {/* PHONE */}

                  <div className="view-detail">

                    <span className="view-label">
                      Phone
                    </span>

                    <strong>
                      {
                        selectedBranch.phone ||
                        "-"
                      }
                    </strong>

                  </div>

                  {/* CITY */}

                  <div className="view-detail">

                    <span className="view-label">
                      City
                    </span>

                    <strong>
                      {
                        selectedBranch
                          .address
                          ?.city ||
                        "-"
                      }
                    </strong>

                  </div>

                  {/* STATE */}

                  <div className="view-detail">

                    <span className="view-label">
                      State
                    </span>

                    <strong>
                      {
                        selectedBranch
                          .address
                          ?.state ||
                        "-"
                      }
                    </strong>

                  </div>

                  {/* COUNTRY */}

                  <div className="view-detail">

                    <span className="view-label">
                      Country
                    </span>

                    <strong>
                      {
                        selectedBranch
                          .address
                          ?.country ||
                        "-"
                      }
                    </strong>

                  </div>

                  {/* PINCODE */}

                  <div className="view-detail">

                    <span className="view-label">
                      Pincode
                    </span>

                    <strong>
                      {
                        selectedBranch
                          .address
                          ?.pincode ||
                        "-"
                      }
                    </strong>

                  </div>

                </div>

                {/* ADDRESS */}

                <div className="view-address">

                  <span className="view-label">
                    Address
                  </span>

                  <p>
                    {
                      selectedBranch
                        .address
                        ?.street ||
                      "No address provided"
                    }
                  </p>

                </div>

                {/* ACTIONS */}

                <div className="branch-modal-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setShowViewModal(
                        false
                      )
                    }
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => {
                      setShowViewModal(
                        false
                      );

                      handleEdit(
                        selectedBranch
                      );
                    }}
                  >
                    <FiEdit2 />

                    Edit Branch
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Branch;