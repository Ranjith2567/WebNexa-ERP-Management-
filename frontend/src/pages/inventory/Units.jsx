import { useEffect, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiBox,
  FiTag,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/units.css";

const initialForm = {
  company: "",
  name: "",
  code: "",
  symbol: "",
  description: "",
  isActive: true,
};

function Units() {
  const [units, setUnits] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // FETCH COMPANIES
  // ==========================================
  const fetchCompanies = async () => {
    try {
      setCompanyLoading(true);

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

      setCompanies(
        Array.isArray(companyData)
          ? companyData
          : []
      );
    } catch (err) {
      console.error("Company fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load companies"
      );
    } finally {
      setCompanyLoading(false);
    }
  };

  // ==========================================
  // FETCH UNITS
  // ==========================================
  const fetchUnits = async (currentPage = page) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: currentPage,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (activeFilter !== "all") {
        params.isActive =
          activeFilter === "active";
      }

      const response = await api.get(
        "/units",
        { params }
      );

      setUnits(
        Array.isArray(response.data?.units)
          ? response.data.units
          : []
      );

      if (response.data?.pagination) {
        setPagination(
          response.data.pagination
        );
      }
    } catch (err) {
      console.error("Units fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load units"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    fetchCompanies();
  }, []);

  // ==========================================
  // FILTER / PAGE CHANGE
  // ==========================================
  useEffect(() => {
    fetchUnits(page);
  }, [page, activeFilter]);

  // ==========================================
  // SEARCH
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (page === 1) {
      fetchUnits(1);
    }
  }, [search]);

  // ==========================================
  // CLEAR ALERT
  // ==========================================
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================
  const openAddModal = () => {
    clearMessages();

    setEditingUnit(null);

    setFormData({
      ...initialForm,
      company:
        companies.length === 1
          ? companies[0]._id
          : "",
    });

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================
  const openEditModal = (unit) => {
    clearMessages();

    setEditingUnit(unit);

    setFormData({
      company:
        unit.company?._id ||
        unit.company ||
        "",

      name: unit.name || "",

      code: unit.code || "",

      symbol: unit.symbol || "",

      description:
        unit.description || "",

      isActive:
        typeof unit.isActive === "boolean"
          ? unit.isActive
          : true,
    });

    setShowModal(true);
  };

  // ==========================================
  // OPEN VIEW MODAL
  // ==========================================
  const openViewModal = async (unit) => {
    try {
      clearMessages();

      const response = await api.get(
        `/units/${unit._id}`
      );

      setSelectedUnit(
        response.data?.unit || unit
      );

      setShowViewModal(true);
    } catch (err) {
      console.error("Unit view error:", err);

      setSelectedUnit(unit);
      setShowViewModal(true);
    }
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================
  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingUnit(null);
    setFormData(initialForm);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUnit(null);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!formData.company) {
      setError("Company is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("Unit name is required");
      return;
    }

    if (!formData.code.trim()) {
      setError("Unit code is required");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        symbol: formData.symbol.trim(),
        description:
          formData.description.trim(),
        isActive: formData.isActive,
      };

      // Company is only required during creation.
      // Backend does not allow changing company.
      if (!editingUnit) {
        payload.company = formData.company;
      }

      let response;

      if (editingUnit) {
        response = await api.put(
          `/units/${editingUnit._id}`,
          payload
        );
      } else {
        response = await api.post(
          "/units",
          payload
        );
      }

      setSuccess(
        response.data?.message ||
          (editingUnit
            ? "Unit updated successfully"
            : "Unit created successfully")
      );

      setShowModal(false);
      setEditingUnit(null);
      setFormData(initialForm);

      await fetchUnits(page);
    } catch (err) {
      console.error(
        "Unit save error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save unit"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async (unit) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${unit.name}"?`
    );

    if (!confirmed) return;

    try {
      clearMessages();

      await api.delete(
        `/units/${unit._id}`
      );

      setSuccess(
        "Unit deleted successfully"
      );

      // If deleting the last item from a
      // page, move back one page.
      if (
        units.length === 1 &&
        page > 1
      ) {
        setPage((prev) => prev - 1);
      } else {
        await fetchUnits(page);
      }
    } catch (err) {
      console.error(
        "Unit delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete unit"
      );
    }
  };

  // ==========================================
  // COMPANY NAME
  // ==========================================
  const getCompanyName = (unit) => {
    if (unit?.company?.name) {
      return unit.company.name;
    }

    if (unit?.company?.legalName) {
      return unit.company.legalName;
    }

    const company = companies.find(
      (item) =>
        item._id === unit?.company
    );

    return (
      company?.name ||
      company?.legalName ||
      "-"
    );
  };

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages =
    pagination.pages || 1;

  const goToPage = (newPage) => {
    if (
      newPage < 1 ||
      newPage > totalPages
    ) {
      return;
    }

    setPage(newPage);
  };

  // ==========================================
  // PAGE NUMBERS
  // ==========================================
  const getPageNumbers = () => {
    const pages = [];

    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  };

  const activeOnPage =
    units.filter(
      (unit) => unit.isActive
    ).length;

  const inactiveOnPage =
    units.filter(
      (unit) => !unit.isActive
    ).length;

  return (
    <div className="units-page">

      {/* ======================================
          HEADER
      ====================================== */}
      <div className="units-header">
        <div>
          <div className="units-title-row">
            <div className="units-title-icon">
              <FiBox />
            </div>

            <div>
              <h1>Units</h1>

              <p>
                Manage measurement units for
                your products
              </p>
            </div>
          </div>
        </div>

        <button
          className="units-add-btn"
          onClick={openAddModal}
        >
          <FiPlus />
          Add Unit
        </button>
      </div>

      {/* ======================================
          ALERTS
      ====================================== */}
      {error && (
        <div className="units-alert units-alert-error">
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
        <div className="units-alert units-alert-success">
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

      {/* ======================================
          SUMMARY
      ====================================== */}
      <div className="units-summary">

        <div className="units-summary-card">
          <div className="units-summary-icon">
            <FiBox />
          </div>

          <div>
            <span>Total Units</span>
            <strong>
              {pagination.total || 0}
            </strong>
          </div>
        </div>

        <div className="units-summary-card">
          <div className="units-summary-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Active on Page</span>
            <strong>
              {activeOnPage}
            </strong>
          </div>
        </div>

        <div className="units-summary-card">
          <div className="units-summary-icon">
            <FiXCircle />
          </div>

          <div>
            <span>Inactive on Page</span>
            <strong>
              {inactiveOnPage}
            </strong>
          </div>
        </div>

        <div className="units-summary-card">
          <div className="units-summary-icon">
            <FiTag />
          </div>

          <div>
            <span>Showing</span>
            <strong>
              {units.length}
            </strong>
          </div>
        </div>

      </div>

      {/* ======================================
          TOOLBAR
      ====================================== */}
      <div className="units-toolbar">

        <div className="units-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search units..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="units-search-clear"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="units-filter-group">
          <button
            type="button"
            className={
              activeFilter === "all"
                ? "units-filter-btn active"
                : "units-filter-btn"
            }
            onClick={() => {
              setActiveFilter("all");
              setPage(1);
            }}
          >
            All
          </button>

          <button
            type="button"
            className={
              activeFilter === "active"
                ? "units-filter-btn active"
                : "units-filter-btn"
            }
            onClick={() => {
              setActiveFilter("active");
              setPage(1);
            }}
          >
            Active
          </button>

          <button
            type="button"
            className={
              activeFilter === "inactive"
                ? "units-filter-btn active"
                : "units-filter-btn"
            }
            onClick={() => {
              setActiveFilter("inactive");
              setPage(1);
            }}
          >
            Inactive
          </button>
        </div>

        <button
          type="button"
          className="units-refresh-btn"
          onClick={() =>
            fetchUnits(page)
          }
          title="Refresh"
        >
          <FiRefreshCw
            className={
              loading
                ? "units-refresh-spin"
                : ""
            }
          />
        </button>

      </div>

      {/* ======================================
          TABLE
      ====================================== */}
      <div className="units-table-card">

        {loading ? (
          <div className="units-loading">
            <FiRefreshCw className="units-spinner" />
            <p>Loading units...</p>
          </div>
        ) : units.length === 0 ? (
          <div className="units-empty">
            <div className="units-empty-icon">
              <FiBox />
            </div>

            <h3>No units found</h3>

            <p>
              {search
                ? "No units match your search."
                : "Create your first unit to get started."}
            </p>

            {!search && (
              <button
                className="units-empty-btn"
                onClick={openAddModal}
              >
                <FiPlus />
                Add Unit
              </button>
            )}
          </div>
        ) : (
          <div className="units-table-wrapper">

            <table className="units-table">

              <thead>
                <tr>
                  <th>UNIT</th>
                  <th>CODE</th>
                  <th>SYMBOL</th>
                  <th>COMPANY</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {units.map((unit) => (
                  <tr key={unit._id}>

                    <td>
                      <div className="units-name-cell">

                        <div className="units-avatar">
                          <FiBox />
                        </div>

                        <div>
                          <strong>
                            {unit.name}
                          </strong>

                          {unit.description && (
                            <span>
                              {unit.description}
                            </span>
                          )}
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="units-code">
                        {unit.code}
                      </span>
                    </td>

                    <td>
                      <span className="units-symbol">
                        {unit.symbol || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="units-company">
                        {getCompanyName(unit)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          unit.isActive
                            ? "units-status active"
                            : "units-status inactive"
                        }
                      >
                        {unit.isActive ? (
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

                    <td>
                      <div className="units-actions">

                        <button
                          type="button"
                          className="units-action view"
                          title="View"
                          onClick={() =>
                            openViewModal(unit)
                          }
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="units-action edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(unit)
                          }
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className="units-action delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(unit)
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

      </div>

      {/* ======================================
          PAGINATION
      ====================================== */}
      {!loading &&
        units.length > 0 &&
        totalPages > 1 && (
          <div className="units-pagination">

            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                goToPage(page - 1)
              }
            >
              Previous
            </button>

            <div className="units-page-numbers">
              {getPageNumbers().map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={
                      pageNumber === page
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      goToPage(pageNumber)
                    }
                  >
                    {pageNumber}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={
                page === totalPages
              }
              onClick={() =>
                goToPage(page + 1)
              }
            >
              Next
            </button>

          </div>
        )}

      {/* ======================================
          ADD / EDIT MODAL
      ====================================== */}
      {showModal && (
        <div
          className="units-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="units-modal">

            <div className="units-modal-header">

              <div>
                <h2>
                  {editingUnit
                    ? "Edit Unit"
                    : "Add Unit"}
                </h2>

                <p>
                  {editingUnit
                    ? "Update unit information"
                    : "Create a new measurement unit"}
                </p>
              </div>

              <button
                type="button"
                className="units-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="units-form"
            >

              {/* COMPANY */}
              <div className="units-form-group full">
                <label>
                  Company
                  <span>*</span>
                </label>

                <select
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  disabled={
                    editingUnit ||
                    companyLoading
                  }
                  required
                >
                  <option value="">
                    {companyLoading
                      ? "Loading companies..."
                      : "Select company"}
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

                {editingUnit && (
                  <small>
                    Company cannot be changed
                    after creation.
                  </small>
                )}
              </div>

              {/* UNIT NAME */}
              <div className="units-form-group">
                <label>
                  Unit Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Kilogram"
                  maxLength={100}
                  required
                />
              </div>

              {/* CODE */}
              <div className="units-form-group">
                <label>
                  Unit Code
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. KG"
                  maxLength={30}
                  required
                />

                <small>
                  Code will be stored in uppercase.
                </small>
              </div>

              {/* SYMBOL */}
              <div className="units-form-group">
                <label>Symbol</label>

                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="e.g. kg"
                  maxLength={20}
                />
              </div>

              {/* STATUS */}
              <div className="units-form-group">
                <label>Status</label>

                <label className="units-checkbox-label">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />

                  <span>
                    Active
                  </span>

                </label>
              </div>

              {/* DESCRIPTION */}
              <div className="units-form-group full">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Enter unit description..."
                  rows="4"
                  maxLength={500}
                />

                <small>
                  {formData.description.length}
                  /500
                </small>
              </div>

              {/* BUTTONS */}
              <div className="units-form-actions">

                <button
                  type="button"
                  className="units-cancel-btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="units-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="units-btn-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      {editingUnit
                        ? "Update Unit"
                        : "Create Unit"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================
          VIEW MODAL
      ====================================== */}
      {showViewModal &&
        selectedUnit && (
          <div
            className="units-modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target === e.currentTarget
              ) {
                closeViewModal();
              }
            }}
          >
            <div className="units-view-modal">

              <div className="units-modal-header">

                <div>
                  <h2>
                    Unit Details
                  </h2>

                  <p>
                    View complete unit information
                  </p>
                </div>

                <button
                  type="button"
                  className="units-modal-close"
                  onClick={closeViewModal}
                >
                  ×
                </button>

              </div>

              <div className="units-view-content">

                <div className="units-view-profile">

                  <div className="units-view-icon">
                    <FiBox />
                  </div>

                  <div>
                    <h3>
                      {selectedUnit.name}
                    </h3>

                    <span>
                      {selectedUnit.code}
                    </span>
                  </div>

                </div>

                <div className="units-view-grid">

                  <div className="units-view-item">
                    <span>Company</span>
                    <strong>
                      {getCompanyName(
                        selectedUnit
                      )}
                    </strong>
                  </div>

                  <div className="units-view-item">
                    <span>Unit Code</span>
                    <strong>
                      {selectedUnit.code ||
                        "-"}
                    </strong>
                  </div>

                  <div className="units-view-item">
                    <span>Symbol</span>
                    <strong>
                      {selectedUnit.symbol ||
                        "-"}
                    </strong>
                  </div>

                  <div className="units-view-item">
                    <span>Status</span>
                    <strong
                      className={
                        selectedUnit.isActive
                          ? "units-view-active"
                          : "units-view-inactive"
                      }
                    >
                      {selectedUnit.isActive
                        ? "Active"
                        : "Inactive"}
                    </strong>
                  </div>

                  <div className="units-view-item full">
                    <span>Description</span>
                    <strong>
                      {selectedUnit.description ||
                        "No description provided."}
                    </strong>
                  </div>

                  {selectedUnit.createdBy && (
                    <div className="units-view-item">
                      <span>Created By</span>
                      <strong>
                        {selectedUnit.createdBy
                          ?.name ||
                          selectedUnit.createdBy
                            ?.email ||
                          "-"}
                      </strong>
                    </div>
                  )}

                  {selectedUnit.createdAt && (
                    <div className="units-view-item">
                      <span>Created At</span>
                      <strong>
                        {new Date(
                          selectedUnit.createdAt
                        ).toLocaleDateString()}
                      </strong>
                    </div>
                  )}

                </div>

              </div>

              <div className="units-view-footer">

                <button
                  type="button"
                  className="units-cancel-btn"
                  onClick={closeViewModal}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="units-submit-btn"
                  onClick={() => {
                    closeViewModal();
                    openEditModal(
                      selectedUnit
                    );
                  }}
                >
                  <FiEdit2 />
                  Edit Unit
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}

export default Units;