import { useEffect, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiTag,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiGlobe,
  FiImage,
  FiBriefcase,
} from "react-icons/fi";

import api from "../../services/api";

import "../../styles/brands.css";

function Brands() {
  /* =========================
      STATE
  ========================= */

  const [brands, setBrands] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    total: 0,
  });

  /* =========================
      MODALS
  ========================= */

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingBrand, setEditingBrand] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  /* =========================
      FORM
  ========================= */

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    code: "",
    description: "",
    logo: "",
    website: "",
    isActive: true,
  });

  /* =========================
      FETCH COMPANIES
  ========================= */

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const companyData =
        response.data?.companies ||
        response.data?.data ||
        [];

      setCompanies(companyData);
    } catch (err) {
      console.error("Fetch Companies Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to fetch companies"
      );
    }
  };

  /* =========================
      FETCH BRANDS
  ========================= */

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (activeFilter !== "") {
        params.isActive = activeFilter;
      }

      const response = await api.get("/brands", {
        params,
      });

      const brandData =
        response.data?.brands ||
        response.data?.data ||
        [];

      setBrands(brandData);

      if (response.data?.pagination) {
        setPagination({
          page:
            response.data.pagination.page ||
            page,

          limit:
            response.data.pagination.limit ||
            10,

          totalPages:
            response.data.pagination.totalPages ||
            1,

          hasNextPage:
            response.data.pagination.hasNextPage ||
            false,

          hasPreviousPage:
            response.data.pagination.hasPreviousPage ||
            false,

          total:
            response.data.total ||
            0,
        });
      }
    } catch (err) {
      console.error("Fetch Brands Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to fetch brands"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      INITIAL LOAD
  ========================= */

  useEffect(() => {
    fetchCompanies();
  }, []);

  /* =========================
      FETCH BRANDS
  ========================= */

  useEffect(() => {
    fetchBrands();
  }, [page, activeFilter]);

  /* =========================
      SEARCH
  ========================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBrands();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* =========================
      FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =========================
      RESET FORM
  ========================= */

  const resetForm = () => {
    setFormData({
      company: "",
      name: "",
      code: "",
      description: "",
      logo: "",
      website: "",
      isActive: true,
    });

    setEditingBrand(null);
  };

  /* =========================
      OPEN ADD MODAL
  ========================= */

  const handleAdd = () => {
    resetForm();

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /* =========================
      OPEN EDIT MODAL
  ========================= */

  const handleEdit = (brand) => {
    setEditingBrand(brand);

    setFormData({
      company:
        brand.company?._id ||
        brand.company ||
        "",

      name: brand.name || "",

      code: brand.code || "",

      description:
        brand.description || "",

      logo:
        brand.logo || "",

      website:
        brand.website || "",

      isActive:
        brand.isActive !== false,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /* =========================
      CLOSE MODAL
  ========================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);

    resetForm();
  };

  /* =========================
      SAVE BRAND
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /* =========================
        VALIDATION
    ========================= */

    if (!editingBrand && !formData.company) {
      setError("Please select a company.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Brand name is required.");
      return;
    }

    if (!formData.code.trim()) {
      setError("Brand code is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),

        code: formData.code
          .trim()
          .toUpperCase(),

        description:
          formData.description.trim(),

        logo:
          formData.logo.trim(),

        website:
          formData.website.trim(),

        isActive:
          formData.isActive,
      };

      /* =========================
          CREATE
      ========================= */

      if (!editingBrand) {
        payload.company =
          formData.company;

        const response = await api.post(
          "/brands",
          payload
        );

        setSuccess(
          response.data?.message ||
            "Brand created successfully."
        );
      }

      /* =========================
          UPDATE
      ========================= */

      else {
        const response = await api.put(
          `/brands/${editingBrand._id}`,
          payload
        );

        setSuccess(
          response.data?.message ||
            "Brand updated successfully."
        );
      }

      setShowModal(false);

      resetForm();

      await fetchBrands();
    } catch (err) {
      console.error(
        "Save Brand Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save brand."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
      VIEW BRAND
  ========================= */

  const handleView = (brand) => {
    setSelectedBrand(brand);
    setShowViewModal(true);
  };

  /* =========================
      DELETE BRAND
  ========================= */

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${brand.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/brands/${brand._id}`
      );

      setSuccess(
        response.data?.message ||
          "Brand deleted successfully."
      );

      await fetchBrands();
    } catch (err) {
      console.error(
        "Delete Brand Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete brand."
      );
    }
  };

  /* =========================
      REFRESH
  ========================= */

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await fetchBrands();
  };

  /* =========================
      COMPANY NAME
  ========================= */

  const getCompanyName = (brand) => {
    if (!brand?.company) {
      return "-";
    }

    if (typeof brand.company === "object") {
      return (
        brand.company.name ||
        brand.company.legalName ||
        "-"
      );
    }

    const company = companies.find(
      (item) => item._id === brand.company
    );

    return company?.name || "-";
  };

  /* =========================
      FORMAT DATE
  ========================= */

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

  /* =========================
      WEBSITE URL
  ========================= */

  const getWebsiteUrl = (website) => {
    if (!website) return "";

    if (
      website.startsWith("http://") ||
      website.startsWith("https://")
    ) {
      return website;
    }

    return `https://${website}`;
  };

  /* =========================
      PAGE CHANGE
  ========================= */

  const handlePrevious = () => {
    if (pagination.hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  /* =========================
      SUMMARY
  ========================= */

  const totalBrands = pagination.total || 0;

  const activeBrands = brands.filter(
    (brand) => brand.isActive
  ).length;

  const inactiveBrands = brands.filter(
    (brand) => !brand.isActive
  ).length;

  return (
    <div className="brands-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="brands-header">

        <div>
          <div className="brands-title-row">
            <div className="brands-title-icon">
              <FiTag />
            </div>

            <div>
              <h1>Brands</h1>

              <p>
                Manage product brands across
                your companies.
              </p>
            </div>
          </div>
        </div>

        <button
          className="brands-add-btn"
          onClick={handleAdd}
        >
          <FiPlus />
          Add Brand
        </button>

      </div>


      {/* =========================
          ALERTS
      ========================= */}

      {error && (
        <div className="brands-alert brands-alert-error">
          <FiXCircle />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="brands-alert brands-alert-success">
          <FiCheckCircle />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}


      {/* =========================
          SUMMARY CARDS
      ========================= */}

      <div className="brands-summary">

        <div className="brands-summary-card">

          <div className="brands-summary-icon total">
            <FiTag />
          </div>

          <div>
            <span>Total Brands</span>
            <strong>{totalBrands}</strong>
          </div>

        </div>


        <div className="brands-summary-card">

          <div className="brands-summary-icon active">
            <FiCheckCircle />
          </div>

          <div>
            <span>Active</span>
            <strong>{activeBrands}</strong>
          </div>

        </div>


        <div className="brands-summary-card">

          <div className="brands-summary-icon inactive">
            <FiXCircle />
          </div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveBrands}</strong>
          </div>

        </div>

      </div>


      {/* =========================
          FILTERS
      ========================= */}

      <div className="brands-toolbar">

        <div className="brands-search-box">

          <FiSearch />

          <input
            type="text"
            placeholder="Search by brand name, code or description..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="brands-search-clear"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}

        </div>


        <select
          className="brands-filter-select"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">
            All Status
          </option>

          <option value="true">
            Active
          </option>

          <option value="false">
            Inactive
          </option>
        </select>


        <button
          type="button"
          className="brands-refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh"
        >
          <FiRefreshCw
            className={
              loading
                ? "brands-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>


      {/* =========================
          TABLE CARD
      ========================= */}

      <div className="brands-table-card">

        <div className="brands-table-header">

          <div>
            <h2>Brand List</h2>

            <span>
              {totalBrands} brand
              {totalBrands !== 1
                ? "s"
                : ""}
            </span>
          </div>

        </div>


        {loading ? (
          <div className="brands-loading">

            <FiRefreshCw className="brands-spin" />

            <p>
              Loading brands...
            </p>

          </div>
        ) : brands.length === 0 ? (

          <div className="brands-empty">

            <div className="brands-empty-icon">
              <FiTag />
            </div>

            <h3>
              No brands found
            </h3>

            <p>
              {search ||
              activeFilter !== ""
                ? "Try changing your search or filters."
                : "Create your first brand to get started."}
            </p>

            {!search &&
              activeFilter === "" && (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="brands-empty-btn"
                >
                  <FiPlus />
                  Add Brand
                </button>
              )}

          </div>

        ) : (

          <div className="brands-table-wrapper">

            <table className="brands-table">

              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Code</th>
                  <th>Company</th>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {brands.map((brand) => (

                  <tr key={brand._id}>

                    {/* BRAND */}

                    <td>

                      <div className="brands-name-cell">

                        <div className="brands-logo-cell">

                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <FiTag />
                          )}

                        </div>

                        <div>

                          <strong>
                            {brand.name}
                          </strong>

                          {brand.description && (
                            <span>
                              {brand.description}
                            </span>
                          )}

                        </div>

                      </div>

                    </td>


                    {/* CODE */}

                    <td>
                      <span className="brands-code">
                        {brand.code}
                      </span>
                    </td>


                    {/* COMPANY */}

                    <td>

                      <div className="brands-company-cell">

                        <FiBriefcase />

                        <span>
                          {getCompanyName(
                            brand
                          )}
                        </span>

                      </div>

                    </td>


                    {/* WEBSITE */}

                    <td>

                      {brand.website ? (
                        <a
                          href={getWebsiteUrl(
                            brand.website
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="brands-website"
                        >
                          <FiGlobe />

                          <span>
                            Website
                          </span>
                        </a>
                      ) : (
                        <span className="brands-no-data">
                          -
                        </span>
                      )}

                    </td>


                    {/* STATUS */}

                    <td>

                      <span
                        className={`brands-status ${
                          brand.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {brand.isActive ? (
                          <>
                            <FiCheckCircle />
                            Active
                          </>
                        ) : (
                          <>
                            <FiXCircle />
                            Inactive
                          </>
                        )}
                      </span>

                    </td>


                    {/* DATE */}

                    <td>

                      <span className="brands-date">
                        {formatDate(
                          brand.createdAt
                        )}
                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td>

                      <div className="brands-actions">

                        <button
                          type="button"
                          className="brands-action-btn view"
                          title="View"
                          onClick={() =>
                            handleView(brand)
                          }
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="brands-action-btn edit"
                          title="Edit"
                          onClick={() =>
                            handleEdit(brand)
                          }
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className="brands-action-btn delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(brand)
                          }
                        >
                          <FiTrash2 />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* =========================
            PAGINATION
        ========================= */}

        {!loading &&
          brands.length > 0 && (
            <div className="brands-pagination">

              <div className="brands-pagination-info">
                Page{" "}
                <strong>
                  {pagination.page}
                </strong>{" "}
                of{" "}
                <strong>
                  {pagination.totalPages}
                </strong>
              </div>

              <div className="brands-pagination-buttons">

                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={
                    !pagination.hasPreviousPage
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    !pagination.hasNextPage
                  }
                >
                  Next
                </button>

              </div>

            </div>
          )}

      </div>


      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="brands-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="brands-modal">

            {/* MODAL HEADER */}

            <div className="brands-modal-header">

              <div className="brands-modal-title">

                <div className="brands-modal-icon">
                  <FiTag />
                </div>

                <div>

                  <h2>
                    {editingBrand
                      ? "Edit Brand"
                      : "Add Brand"}
                  </h2>

                  <p>
                    {editingBrand
                      ? "Update brand information."
                      : "Create a new product brand."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="brands-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              className="brands-form"
              onSubmit={handleSubmit}
            >

              {/* COMPANY */}

              <div className="brands-form-group">

                <label>
                  Company
                  {!editingBrand && (
                    <span>*</span>
                  )}
                </label>

                <select
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  disabled={!!editingBrand}
                >
                  <option value="">
                    Select Company
                  </option>

                  {companies.map(
                    (company) => (
                      <option
                        key={company._id}
                        value={company._id}
                      >
                        {company.name ||
                          company.legalName}
                      </option>
                    )
                  )}

                </select>

                {editingBrand && (
                  <small>
                    Company cannot be changed
                    after creation.
                  </small>
                )}

              </div>


              {/* NAME + CODE */}

              <div className="brands-form-row">

                <div className="brands-form-group">

                  <label>
                    Brand Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Samsung"
                    maxLength={150}
                  />

                </div>


                <div className="brands-form-group">

                  <label>
                    Brand Code
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. SAM"
                    maxLength={50}
                  />

                </div>

              </div>


              {/* DESCRIPTION */}

              <div className="brands-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Enter brand description..."
                  rows={4}
                />

              </div>


              {/* LOGO */}

              <div className="brands-form-group">

                <label>
                  Logo URL
                </label>

                <div className="brands-input-icon">

                  <FiImage />

                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                  />

                </div>

              </div>


              {/* WEBSITE */}

              <div className="brands-form-group">

                <label>
                  Website
                </label>

                <div className="brands-input-icon">

                  <FiGlobe />

                  <input
                    type="text"
                    name="website"
                    value={
                      formData.website
                    }
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />

                </div>

              </div>


              {/* ACTIVE STATUS */}

              <div className="brands-toggle-row">

                <div>

                  <strong>
                    Active Brand
                  </strong>

                  <span>
                    Allow this brand to be
                    used for products.
                  </span>

                </div>

                <label className="brands-switch">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      formData.isActive
                    }
                    onChange={handleChange}
                  />

                  <span className="brands-slider" />

                </label>

              </div>


              {/* FORM ACTIONS */}

              <div className="brands-form-actions">

                <button
                  type="button"
                  className="brands-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="brands-save-btn"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <FiRefreshCw className="brands-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      {editingBrand
                        ? "Update Brand"
                        : "Create Brand"}
                    </>
                  )}

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
        selectedBrand && (

          <div
            className="brands-modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                setShowViewModal(false);
              }
            }}
          >

            <div className="brands-view-modal">

              {/* HEADER */}

              <div className="brands-modal-header">

                <div className="brands-modal-title">

                  <div className="brands-modal-icon">
                    <FiEye />
                  </div>

                  <div>

                    <h2>
                      Brand Details
                    </h2>

                    <p>
                      View complete brand
                      information.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="brands-modal-close"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>

              </div>


              {/* BRAND HERO */}

              <div className="brands-view-hero">

                <div className="brands-view-logo">

                  {selectedBrand.logo ? (
                    <img
                      src={
                        selectedBrand.logo
                      }
                      alt={
                        selectedBrand.name
                      }
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <FiTag />
                  )}

                </div>

                <div>

                  <h3>
                    {selectedBrand.name}
                  </h3>

                  <span>
                    {selectedBrand.code}
                  </span>

                </div>

              </div>


              {/* DETAILS */}

              <div className="brands-details-grid">

                <div className="brands-detail-item">

                  <span>
                    Company
                  </span>

                  <strong>
                    {getCompanyName(
                      selectedBrand
                    )}
                  </strong>

                </div>


                <div className="brands-detail-item">

                  <span>
                    Status
                  </span>

                  <strong
                    className={
                      selectedBrand.isActive
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {selectedBrand.isActive
                      ? "Active"
                      : "Inactive"}
                  </strong>

                </div>


                <div className="brands-detail-item full">

                  <span>
                    Description
                  </span>

                  <strong>
                    {selectedBrand.description ||
                      "No description available."}
                  </strong>

                </div>


                <div className="brands-detail-item">

                  <span>
                    Website
                  </span>

                  {selectedBrand.website ? (
                    <a
                      href={getWebsiteUrl(
                        selectedBrand.website
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedBrand.website}
                    </a>
                  ) : (
                    <strong>
                      -
                    </strong>
                  )}

                </div>


                <div className="brands-detail-item">

                  <span>
                    Created
                  </span>

                  <strong>
                    {formatDate(
                      selectedBrand.createdAt
                    )}
                  </strong>

                </div>


                <div className="brands-detail-item">

                  <span>
                    Created By
                  </span>

                  <strong>
                    {selectedBrand.createdBy?.name ||
                      selectedBrand.createdBy?.email ||
                      "-"}
                  </strong>

                </div>

              </div>


              {/* VIEW ACTIONS */}

              <div className="brands-view-actions">

                <button
                  type="button"
                  className="brands-cancel-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="brands-save-btn"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(
                      selectedBrand
                    );
                  }}
                >
                  <FiEdit2 />
                  Edit Brand
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Brands;