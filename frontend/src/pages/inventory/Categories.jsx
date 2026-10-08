import { useEffect, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/categories.css";

const Categories = () => {
  // ==========================================
  // STATES
  // ==========================================
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    totalCategories: 0,
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    code: "",
    description: "",
    parentCategory: "",
    isActive: true,
  });

  // ==========================================
  // FETCH COMPANIES
  // ==========================================
  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const data =
        response.data?.companies ||
        response.data?.data ||
        [];

      setCompanies(data);
    } catch (err) {
      console.error(
        "Fetch Companies Error:",
        err
      );
    }
  };

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================
  const fetchCategories = async () => {
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

      const response = await api.get(
        "/categories",
        {
          params,
        }
      );

      const data = response.data;

      setCategories(data?.categories || []);

      setPagination(
        data?.pagination || {
          totalCategories: 0,
          currentPage: 1,
          itemsPerPage: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      console.error(
        "Fetch Categories Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to fetch categories"
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
  // PAGE / FILTER CHANGE
  // ==========================================
  useEffect(() => {
    fetchCategories();
  }, [page, activeFilter]);

  // ==========================================
  // SEARCH DEBOUNCE
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCategories();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ==========================================
  // FORM CHANGE
  // ==========================================
  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================
  const openAddModal = () => {
    setEditingCategory(null);

    setFormData({
      company: "",
      name: "",
      code: "",
      description: "",
      parentCategory: "",
      isActive: true,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================
  const openEditModal = (category) => {
    setEditingCategory(category);

    setFormData({
      company:
        category.company?._id ||
        category.company ||
        "",

      name: category.name || "",

      code: category.code || "",

      description:
        category.description || "",

      parentCategory:
        category.parentCategory?._id ||
        category.parentCategory ||
        "",

      isActive:
        category.isActive !== false,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // VIEW CATEGORY
  // ==========================================
  const handleView = async (id) => {
    try {
      setError("");

      const response = await api.get(
        `/categories/${id}`
      );

      setSelectedCategory(
        response.data?.category || null
      );

      setShowViewModal(true);
    } catch (err) {
      console.error(
        "View Category Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to fetch category"
      );
    }
  };

  // ==========================================
  // SUBMIT CATEGORY
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Company validation
      if (!formData.company) {
        setError("Company is required");
        return;
      }

      // Name validation
      if (!formData.name.trim()) {
        setError(
          "Category name is required"
        );
        return;
      }

      // Code validation
      if (!formData.code.trim()) {
        setError(
          "Category code is required"
        );
        return;
      }

      const payload = {
        company: formData.company,

        name: formData.name.trim(),

        code: formData.code
          .trim()
          .toUpperCase(),

        description:
          formData.description.trim(),

        parentCategory:
          formData.parentCategory || null,

        isActive: formData.isActive,
      };

      // ======================================
      // UPDATE
      // ======================================
      if (editingCategory) {
        const response = await api.put(
          `/categories/${editingCategory._id}`,
          payload
        );

        setSuccess(
          response.data?.message ||
            "Category updated successfully"
        );
      }

      // ======================================
      // CREATE
      // ======================================
      else {
        const response = await api.post(
          "/categories",
          payload
        );

        setSuccess(
          response.data?.message ||
            "Category created successfully"
        );
      }

      setShowModal(false);
      setEditingCategory(null);

      await fetchCategories();
    } catch (err) {
      console.error(
        "Save Category Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/categories/${id}`
      );

      setSuccess(
        response.data?.message ||
          "Category deleted successfully"
      );

      await fetchCategories();
    } catch (err) {
      console.error(
        "Delete Category Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete category"
      );
    }
  };

  // ==========================================
  // GET PARENT CATEGORIES
  // ==========================================
  const getParentCategories = () => {
    if (!formData.company) {
      return [];
    }

    return categories.filter(
      (category) => {
        const categoryCompany =
          category.company?._id ||
          category.company;

        if (
          categoryCompany !==
          formData.company
        ) {
          return false;
        }

        // Prevent itself as parent
        if (
          editingCategory &&
          category._id ===
            editingCategory._id
        ) {
          return false;
        }

        return category.isActive !== false;
      }
    );
  };

  // ==========================================
  // CLOSE ADD / EDIT MODAL
  // ==========================================
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
  };

  // ==========================================
  // CLOSE VIEW MODAL
  // ==========================================
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedCategory(null);
  };

  // ==========================================
  // COMPANY NAME
  // ==========================================
  const getCompanyName = (company) => {
    if (!company) return "-";

    return (
      company.name ||
      company.legalName ||
      "-"
    );
  };

  // ==========================================
  // PARENT CATEGORY NAME
  // ==========================================
  const getParentName = (parent) => {
    if (!parent) {
      return "Main Category";
    }

    if (typeof parent === "object") {
      return (
        parent.name ||
        parent.code ||
        "Main Category"
      );
    }

    return "Main Category";
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="categories-page">

      {/* ======================================
          HEADER
      ====================================== */}
      <div className="categories-header">
        <div className="categories-title-row">

          <div className="categories-title-icon">
            <FiLayers />
          </div>

          <div>
            <h1>Categories</h1>

            <p>
              Manage product categories and
              category hierarchy
            </p>
          </div>

        </div>

        <button
          type="button"
          className="categories-add-btn"
          onClick={openAddModal}
        >
          <FiPlus />
          Add Category
        </button>
      </div>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}
      {error && (
        <div className="categories-alert error">

          <FiXCircle />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* ======================================
          SUCCESS MESSAGE
      ====================================== */}
      {success && (
        <div className="categories-alert success">

          <FiCheckCircle />

          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* ======================================
          FILTERS
      ====================================== */}
      <div className="categories-filter-card">

        <div className="categories-search-box">

          <FiSearch />

          <input
            type="text"
            placeholder="Search by name, code or description..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          className="categories-filter-select"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(
              e.target.value
            );
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
          className="categories-refresh-btn"
          onClick={fetchCategories}
          title="Refresh"
        >
          <FiRefreshCw />
        </button>

      </div>

      {/* ======================================
          SUMMARY
      ====================================== */}
      <div className="categories-summary">

        <div className="categories-summary-card">

          <div className="categories-summary-icon">
            <FiLayers />
          </div>

          <div>
            <span>
              Total Categories
            </span>

            <strong>
              {pagination.totalCategories ||
                0}
            </strong>
          </div>

        </div>

        <div className="categories-summary-card">

          <div className="categories-summary-icon active">
            <FiCheckCircle />
          </div>

          <div>
            <span>
              Current Page
            </span>

            <strong>
              {pagination.currentPage ||
                1}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================
          TABLE CARD
      ====================================== */}
      <div className="categories-table-card">

        <div className="categories-table-header">

          <div>
            <h2>
              Category List
            </h2>

            <span>
              {categories.length} categories
              displayed
            </span>
          </div>

        </div>

        {/* LOADING */}
        {loading ? (
          <div className="categories-loading">

            <div className="categories-spinner"></div>

            <p>
              Loading categories...
            </p>

          </div>
        ) : categories.length === 0 ? (

          /* EMPTY */
          <div className="categories-empty">

            <div className="categories-empty-icon">
              <FiLayers />
            </div>

            <h3>
              No categories found
            </h3>

            <p>
              Create your first product category
              to get started.
            </p>

            <button
              type="button"
              onClick={openAddModal}
            >
              <FiPlus />
              Add Category
            </button>

          </div>
        ) : (

          /* TABLE */
          <div className="categories-table-wrapper">

            <table className="categories-table">

              <thead>
                <tr>
                  <th>Category</th>
                  <th>Code</th>
                  <th>Company</th>
                  <th>Parent</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {categories.map(
                  (category) => (
                    <tr
                      key={
                        category._id
                      }
                    >

                      {/* CATEGORY */}
                      <td>

                        <div className="category-name-cell">

                          <div className="category-row-icon">
                            <FiLayers />
                          </div>

                          <div>

                            <strong>
                              {
                                category.name
                              }
                            </strong>

                            {category.description && (
                              <span>
                                {
                                  category.description
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* CODE */}
                      <td>
                        <span className="category-code">
                          {
                            category.code
                          }
                        </span>
                      </td>

                      {/* COMPANY */}
                      <td>
                        <span>
                          {getCompanyName(
                            category.company
                          )}
                        </span>
                      </td>

                      {/* PARENT */}
                      <td>
                        <span className="category-parent">
                          {getParentName(
                            category.parentCategory
                          )}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>

                        <span
                          className={`category-status ${
                            category.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >

                          {category.isActive ? (
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

                      {/* CREATED BY */}
                      <td>
                        <span>
                          {
                            category
                              .createdBy
                              ?.name || "-"
                          }
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>

                        <div className="category-actions">

                          <button
                            type="button"
                            className="category-action view"
                            title="View"
                            onClick={() =>
                              handleView(
                                category._id
                              )
                            }
                          >
                            <FiEye />
                          </button>

                          <button
                            type="button"
                            className="category-action edit"
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            className="category-action delete"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                category._id
                              )
                            }
                          >
                            <FiTrash2 />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* ====================================
            PAGINATION
        ==================================== */}
        {!loading &&
          categories.length > 0 && (
            <div className="categories-pagination">

              <span>
                Page{" "}
                {pagination.currentPage ||
                  1}{" "}
                of{" "}
                {pagination.totalPages ||
                  1}
              </span>

              <div>

                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.max(
                          prev - 1,
                          1
                        )
                    )
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        prev + 1
                    )
                  }
                >
                  Next
                </button>

              </div>

            </div>
          )}

      </div>

      {/* ======================================
          ADD / EDIT MODAL
      ====================================== */}
      {showModal && (
        <div
          className="categories-modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="categories-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}
            <div className="categories-modal-header">

              <div>

                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p>
                  {editingCategory
                    ? "Update category information"
                    : "Create a new product category"}
                </p>

              </div>

              <button
                type="button"
                className="categories-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            {/* FORM */}
            <form
              className="categories-form"
              onSubmit={handleSubmit}
            >

              <div className="categories-form-grid">

                {/* COMPANY */}
                <div className="categories-form-group">

                  <label>
                    Company
                    <span>*</span>
                  </label>

                  <select
                    name="company"
                    value={
                      formData.company
                    }
                    onChange={(e) => {
                      setFormData(
                        (prev) => ({
                          ...prev,
                          company:
                            e.target
                              .value,
                          parentCategory:
                            "",
                        })
                      );
                    }}
                    disabled={
                      !!editingCategory
                    }
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

                {/* CATEGORY NAME */}
                <div className="categories-form-group">

                  <label>
                    Category Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter category name"
                    required
                  />

                </div>

                {/* CATEGORY CODE */}
                <div className="categories-form-group">

                  <label>
                    Category Code
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={
                      formData.code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. ELEC"
                    required
                  />

                </div>

                {/* PARENT CATEGORY */}
                <div className="categories-form-group">

                  <label>
                    Parent Category
                  </label>

                  <select
                    name="parentCategory"
                    value={
                      formData.parentCategory
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !formData.company
                    }
                  >

                    <option value="">
                      Main Category
                    </option>

                    {getParentCategories().map(
                      (category) => (
                        <option
                          key={
                            category._id
                          }
                          value={
                            category._id
                          }
                        >
                          {
                            category.name
                          }{" "}
                          (
                          {
                            category.code
                          }
                          )
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* DESCRIPTION */}
              <div className="categories-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter category description..."
                  rows="4"
                />

              </div>

              {/* ACTIVE */}
              <label className="categories-checkbox">

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

                <span>
                  Category is active
                </span>

              </label>

              {/* BUTTONS */}
              <div className="categories-modal-actions">

                <button
                  type="button"
                  className="categories-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="categories-save-btn"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <span className="categories-button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />

                      {editingCategory
                        ? "Update Category"
                        : "Create Category"}
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
        selectedCategory && (
          <div
            className="categories-modal-overlay"
            onMouseDown={
              closeViewModal
            }
          >

            <div
              className="categories-view-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}
              <div className="categories-modal-header">

                <div>

                  <h2>
                    Category Details
                  </h2>

                  <p>
                    Complete category
                    information
                  </p>

                </div>

                <button
                  type="button"
                  className="categories-modal-close"
                  onClick={
                    closeViewModal
                  }
                >
                  ×
                </button>

              </div>

              {/* CONTENT */}
              <div className="categories-view-content">

                <div className="categories-view-title">

                  <div className="categories-view-icon">
                    <FiLayers />
                  </div>

                  <div>

                    <h3>
                      {
                        selectedCategory.name
                      }
                    </h3>

                    <span>
                      {
                        selectedCategory.code
                      }
                    </span>

                  </div>

                </div>

                <div className="categories-view-grid">

                  <div>
                    <label>
                      Company
                    </label>

                    <strong>
                      {getCompanyName(
                        selectedCategory.company
                      )}
                    </strong>
                  </div>

                  <div>
                    <label>
                      Parent Category
                    </label>

                    <strong>
                      {getParentName(
                        selectedCategory.parentCategory
                      )}
                    </strong>
                  </div>

                  <div>
                    <label>
                      Status
                    </label>

                    <strong
                      className={
                        selectedCategory.isActive
                          ? "view-status-active"
                          : "view-status-inactive"
                      }
                    >
                      {selectedCategory.isActive
                        ? "Active"
                        : "Inactive"}
                    </strong>
                  </div>

                  <div>
                    <label>
                      Created By
                    </label>

                    <strong>
                      {
                        selectedCategory
                          .createdBy
                          ?.name || "-"
                      }
                    </strong>
                  </div>

                </div>

                <div className="categories-view-description">

                  <label>
                    Description
                  </label>

                  <p>
                    {selectedCategory.description ||
                      "No description provided."}
                  </p>

                </div>

              </div>

              {/* FOOTER */}
              <div className="categories-modal-actions">

                <button
                  type="button"
                  className="categories-cancel-btn"
                  onClick={
                    closeViewModal
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="categories-save-btn"
                  onClick={() => {
                    closeViewModal();

                    openEditModal(
                      selectedCategory
                    );
                  }}
                >
                  <FiEdit2 />
                  Edit Category
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

export default Categories;