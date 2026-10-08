import { useEffect, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiUsers,
  FiMail,
  FiPhone,
  FiMapPin,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/customers.css";

function Customers() {
  // =====================================================
  // STATES
  // =====================================================

  const [customers, setCustomers] = useState([]);

  const [companies, setCompanies] = useState([]);

  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [customerTypeFilter, setCustomerTypeFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("active");

  const [showModal, setShowModal] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const [viewCustomer, setViewCustomer] =
    useState(null);

  const [saving, setSaving] = useState(false);

  // =====================================================
  // PAGINATION
  // =====================================================

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    company: "",
    branch: "",

    customerType: "INDIVIDUAL",

    name: "",

    companyName: "",

    email: "",

    phone: "",

    alternatePhone: "",

    gstNumber: "",

    panNumber: "",

    billingAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
    },

    shippingAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
    },

    creditLimit: 0,

    paymentTerms: 0,

    openingBalance: 0,

    notes: "",

    isActive: true,
  });

  // =====================================================
  // FETCH COMPANIES
  // =====================================================

  const fetchCompanies = async () => {
    try {
      const response =
        await api.get("/companies");

      const companyData =
        Array.isArray(
          response.data?.companies
        )
          ? response.data.companies
          : Array.isArray(
              response.data?.data
            )
          ? response.data.data
          : [];

      setCompanies(companyData);
    } catch (err) {
      console.error(
        "Company Fetch Error:",
        err
      );
    }
  };

  // =====================================================
  // FETCH BRANCHES
  // =====================================================

  const fetchBranches = async (companyId = "") => {
    try {
      let url = "/branches";

      if (companyId) {
        url += `?company=${companyId}`;
      }

      const response =
        await api.get(url);

      const branchData =
        Array.isArray(
          response.data?.branches
        )
          ? response.data.branches
          : Array.isArray(
              response.data?.data
            )
          ? response.data.data
          : [];

      setBranches(branchData);
    } catch (err) {
      console.error(
        "Branch Fetch Error:",
        err
      );

      setBranches([]);
    }
  };

  // =====================================================
  // FETCH CUSTOMERS
  // =====================================================

  const fetchCustomers = async (
    currentPage = page
  ) => {
    try {
      setLoading(true);

      setError("");

      const params = {
        page: currentPage,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (customerTypeFilter) {
        params.customerType =
          customerTypeFilter;
      }

      if (statusFilter === "active") {
        params.isActive = true;
      }

      if (statusFilter === "inactive") {
        params.isActive = false;
      }

      const response =
        await api.get(
          "/customers",
          { params }
        );

      console.log(
        "Customers API Response:",
        response.data
      );

      const customerData =
        Array.isArray(
          response.data?.customers
        )
          ? response.data.customers
          : Array.isArray(
              response.data?.data
            )
          ? response.data.data
          : [];

      setCustomers(customerData);

      if (response.data?.pagination) {
        setPagination(
          response.data.pagination
        );
      } else {
        setPagination({
          total: customerData.length,
          page: currentPage,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      }
    } catch (err) {
      console.error(
        "Customer Fetch Error:",
        err
      );

      setCustomers([]);

      setError(
        err.response?.data?.message ||
          "Failed to load customers."
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

    fetchBranches();

    fetchCustomers(1);
  }, []);

  // =====================================================
  // FILTER CHANGE
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);

      fetchCustomers(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    search,
    customerTypeFilter,
    statusFilter,
  ]);

  // =====================================================
  // PAGE CHANGE
  // =====================================================

  useEffect(() => {
    if (page !== 1) {
      fetchCustomers(page);
    }
  }, [page]);

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

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // ADDRESS HANDLING
  // =====================================================

  const handleAddressChange = (
    addressType,
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,

      [addressType]: {
        ...prev[addressType],

        [field]: value,
      },
    }));
  };

  // =====================================================
  // COMPANY CHANGE
  // =====================================================

  const handleCompanyChange = async (
    e
  ) => {
    const companyId =
      e.target.value;

    setFormData((prev) => ({
      ...prev,

      company: companyId,

      branch: "",
    }));

    if (companyId) {
      await fetchBranches(companyId);
    } else {
      setBranches([]);
    }
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setFormData({
      company: "",
      branch: "",

      customerType: "INDIVIDUAL",

      name: "",

      companyName: "",

      email: "",

      phone: "",

      alternatePhone: "",

      gstNumber: "",

      panNumber: "",

      billingAddress: {
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "India",
        postalCode: "",
      },

      shippingAddress: {
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "India",
        postalCode: "",
      },

      creditLimit: 0,

      paymentTerms: 0,

      openingBalance: 0,

      notes: "",

      isActive: true,
    });

    setEditingCustomer(null);

    setBranches([]);
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const handleAddCustomer = () => {
    resetForm();

    setError("");

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const handleEditCustomer = async (
    customer
  ) => {
    setEditingCustomer(customer);

    const companyId =
      customer.company?._id ||
      customer.company ||
      "";

    if (companyId) {
      await fetchBranches(companyId);
    }

    setFormData({
      company: companyId,

      branch:
        customer.branch?._id ||
        customer.branch ||
        "",

      customerType:
        customer.customerType ||
        "INDIVIDUAL",

      name:
        customer.name || "",

      companyName:
        customer.companyName || "",

      email:
        customer.email || "",

      phone:
        customer.phone || "",

      alternatePhone:
        customer.alternatePhone || "",

      gstNumber:
        customer.gstNumber || "",

      panNumber:
        customer.panNumber || "",

      billingAddress: {
        addressLine1:
          customer.billingAddress
            ?.addressLine1 || "",

        addressLine2:
          customer.billingAddress
            ?.addressLine2 || "",

        city:
          customer.billingAddress
            ?.city || "",

        state:
          customer.billingAddress
            ?.state || "",

        country:
          customer.billingAddress
            ?.country || "India",

        postalCode:
          customer.billingAddress
            ?.postalCode || "",
      },

      shippingAddress: {
        addressLine1:
          customer.shippingAddress
            ?.addressLine1 || "",

        addressLine2:
          customer.shippingAddress
            ?.addressLine2 || "",

        city:
          customer.shippingAddress
            ?.city || "",

        state:
          customer.shippingAddress
            ?.state || "",

        country:
          customer.shippingAddress
            ?.country || "India",

        postalCode:
          customer.shippingAddress
            ?.postalCode || "",
      },

      creditLimit:
        customer.creditLimit ?? 0,

      paymentTerms:
        customer.paymentTerms ?? 0,

      openingBalance:
        customer.openingBalance ?? 0,

      notes:
        customer.notes || "",

      isActive:
        customer.isActive !== false,
    });

    setError("");

    setShowModal(true);
  };

  // =====================================================
  // SAVE CUSTOMER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      setError("");

      // =====================================
      // VALIDATION
      // =====================================

      if (!formData.company) {
        setError(
          "Company is required."
        );

        return;
      }

      if (!formData.branch) {
        setError(
          "Branch is required."
        );

        return;
      }

      if (!formData.name.trim()) {
        setError(
          "Customer name is required."
        );

        return;
      }

      if (!formData.phone.trim()) {
        setError(
          "Phone number is required."
        );

        return;
      }

      if (
        formData.customerType ===
          "BUSINESS" &&
        !formData.companyName.trim()
      ) {
        setError(
          "Company name is required for business customers."
        );

        return;
      }

      // =====================================
      // CLEAN PAYLOAD
      // =====================================

      const payload = {
        company:
          formData.company,

        branch:
          formData.branch,

        customerType:
          formData.customerType,

        name:
          formData.name.trim(),

        companyName:
          formData.companyName.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        alternatePhone:
          formData.alternatePhone.trim(),

        gstNumber:
          formData.gstNumber
            .trim()
            .toUpperCase(),

        panNumber:
          formData.panNumber
            .trim()
            .toUpperCase(),

        billingAddress: {
          addressLine1:
            formData.billingAddress
              .addressLine1.trim(),

          addressLine2:
            formData.billingAddress
              .addressLine2.trim(),

          city:
            formData.billingAddress.city.trim(),

          state:
            formData.billingAddress.state.trim(),

          country:
            formData.billingAddress.country.trim() ||
            "India",

          postalCode:
            formData.billingAddress
              .postalCode.trim(),
        },

        shippingAddress: {
          addressLine1:
            formData.shippingAddress
              .addressLine1.trim(),

          addressLine2:
            formData.shippingAddress
              .addressLine2.trim(),

          city:
            formData.shippingAddress.city.trim(),

          state:
            formData.shippingAddress.state.trim(),

          country:
            formData.shippingAddress.country.trim() ||
            "India",

          postalCode:
            formData.shippingAddress
              .postalCode.trim(),
        },

        creditLimit:
          Number(formData.creditLimit) || 0,

        paymentTerms:
          Number(formData.paymentTerms) || 0,

        openingBalance:
          Number(formData.openingBalance) || 0,

        notes:
          formData.notes.trim(),

        isActive:
          formData.isActive,
      };

      console.log(
        "Customer Payload:",
        payload
      );

      // =====================================
      // UPDATE
      // =====================================

      if (editingCustomer) {
        const response =
          await api.patch(
            `/customers/${editingCustomer._id}`,
            payload
          );

        console.log(
          "Customer Update Response:",
          response.data
        );
      }

      // =====================================
      // CREATE
      // =====================================

      else {
        const response =
          await api.post(
            "/customers",
            payload
          );

        console.log(
          "Customer Create Response:",
          response.data
        );
      }

      // =====================================
      // CLOSE
      // =====================================

      setShowModal(false);

      resetForm();

      // =====================================
      // REFRESH
      // =====================================

      await fetchCustomers(page);
    } catch (err) {
      console.error(
        "Customer Save Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DEACTIVATE CUSTOMER
  // =====================================================

  const handleDelete = async (
    customer
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to deactivate "${customer.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/customers/${customer._id}`
      );

      await fetchCustomers(page);
    } catch (err) {
      console.error(
        "Customer Delete Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to deactivate customer."
      );
    }
  };

  // =====================================================
  // RESTORE CUSTOMER
  // =====================================================

  const handleRestore = async (
    customer
  ) => {
    const confirmed =
      window.confirm(
        `Restore "${customer.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.patch(
        `/customers/${customer._id}/restore`
      );

      await fetchCustomers(page);
    } catch (err) {
      console.error(
        "Customer Restore Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to restore customer."
      );
    }
  };

  // =====================================================
  // PAGINATION HANDLERS
  // =====================================================

  const handlePreviousPage = () => {
    if (
      pagination.hasPreviousPage
    ) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (
      pagination.hasNextPage
    ) {
      setPage((prev) => prev + 1);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="customers-page">

        <div className="customers-loading">

          <div className="customers-loader" />

          <p>
            Loading customers...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="customers-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="customers-header">

        <div>

          <div className="customers-title-row">

            <div className="customers-title-icon">
              <FiUsers />
            </div>

            <div>

              <h2>
                Customers
              </h2>

              <p>
                Manage your customers and
                customer account details.
              </p>

            </div>

          </div>

        </div>

        <button
          className="customers-add-btn"
          onClick={handleAddCustomer}
        >
          <FiPlus />

          <span>
            Add Customer
          </span>

        </button>

      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="customers-error">
          {error}
        </div>
      )}

      {/* =========================================
          TOOLBAR
      ========================================= */}

      <div className="customers-toolbar">

        <div className="customers-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <select
          className="customers-filter"
          value={customerTypeFilter}
          onChange={(e) =>
            setCustomerTypeFilter(
              e.target.value
            )
          }
        >

          <option value="">
            All Types
          </option>

          <option value="INDIVIDUAL">
            Individual
          </option>

          <option value="BUSINESS">
            Business
          </option>

        </select>

        <select
          className="customers-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>

          <option value="">
            All Status
          </option>

        </select>

        <div className="customers-count">

          {pagination.total}{" "}

          {pagination.total === 1
            ? "Customer"
            : "Customers"}

        </div>

      </div>

      {/* =========================================
          CUSTOMER LIST
      ========================================= */}

      {customers.length === 0 ? (

        <div className="customers-empty">

          <div className="customers-empty-icon">
            <FiUsers />
          </div>

          <h3>

            {search ||
            customerTypeFilter ||
            statusFilter ===
              "inactive"
              ? "No customers found"
              : "No customers available"}

          </h3>

          <p>

            {search ||
            customerTypeFilter ||
            statusFilter ===
              "inactive"
              ? "Try changing your search or filters."
              : "Create your first customer to get started."}

          </p>

          {!search &&
            !customerTypeFilter &&
            statusFilter ===
              "active" && (
              <button
                className="customers-add-btn"
                onClick={
                  handleAddCustomer
                }
              >
                <FiPlus />

                Add Customer
              </button>
            )}

        </div>

      ) : (

        <div className="customers-grid">

          {customers.map(
            (customer) => (

              <div
                className="customers-card"
                key={
                  customer._id
                }
              >

                {/* =================================
                    CARD TOP
                ================================= */}

                <div className="customers-card-top">

                  <div className="customers-avatar">
                    <FiUsers />
                  </div>

                  <div className="customers-card-actions">

                    <button
                      title="View"
                      onClick={() =>
                        setViewCustomer(
                          customer
                        )
                      }
                    >
                      <FiEye />
                    </button>

                    {customer.isActive !==
                      false && (
                      <button
                        title="Edit"
                        onClick={() =>
                          handleEditCustomer(
                            customer
                          )
                        }
                      >
                        <FiEdit2 />
                      </button>
                    )}

                    {customer.isActive !==
                      false ? (
                      <button
                        className="delete"
                        title="Deactivate"
                        onClick={() =>
                          handleDelete(
                            customer
                          )
                        }
                      >
                        <FiTrash2 />
                      </button>
                    ) : (
                      <button
                        className="restore"
                        title="Restore"
                        onClick={() =>
                          handleRestore(
                            customer
                          )
                        }
                      >
                        <FiRefreshCw />
                      </button>
                    )}

                  </div>

                </div>

                {/* =================================
                    CUSTOMER DETAILS
                ================================= */}

                <div className="customers-card-body">

                  <div className="customers-code">

                    {customer.customerCode ||
                      "CUS-000000"}

                  </div>

                  <h3>
                    {customer.name}
                  </h3>

                  <p className="customers-customer-type">

                    {customer.customerType ===
                    "BUSINESS"
                      ? customer.companyName ||
                        "Business Customer"
                      : "Individual Customer"}

                  </p>

                  <div className="customers-detail">

                    <FiMail />

                    <span>

                      {customer.email ||
                        "Email not available"}

                    </span>

                  </div>

                  <div className="customers-detail">

                    <FiPhone />

                    <span>

                      {customer.phone ||
                        "Phone not available"}

                    </span>

                  </div>

                  <div className="customers-detail">

                    <FiMapPin />

                    <span>

                      {[
                        customer.branch
                          ?.name,

                        customer.branch
                          ?.city,

                        customer.branch
                          ?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        "Branch not available"}

                    </span>

                  </div>

                </div>

                {/* =================================
                    CARD FOOTER
                ================================= */}

                <div className="customers-card-footer">

                  <span
                    className={
                      customer.isActive ===
                      false
                        ? "customers-status inactive"
                        : "customers-status"
                    }
                  >

                    <span />

                    {customer.isActive ===
                    false
                      ? "Inactive"
                      : "Active"}

                  </span>

                  <span className="customers-type-badge">

                    {customer.customerType ===
                    "BUSINESS"
                      ? "Business"
                      : "Individual"}

                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* =========================================
          PAGINATION
      ========================================= */}

      {customers.length > 0 &&
        pagination.totalPages > 1 && (

        <div className="customers-pagination">

          <button
            onClick={
              handlePreviousPage
            }
            disabled={
              !pagination.hasPreviousPage
            }
          >
            Previous
          </button>

          <span>

            Page{" "}
            {pagination.page}{" "}
            of{" "}
            {pagination.totalPages}

          </span>

          <button
            onClick={
              handleNextPage
            }
            disabled={
              !pagination.hasNextPage
            }
          >
            Next
          </button>

        </div>

      )}

      {/* =========================================
          ADD / EDIT MODAL
      ========================================= */}

      {showModal && (

        <div
          className="customers-modal-overlay"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >

          <div
            className="customers-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="customers-modal-header">

              <div>

                <h3>

                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}

                </h3>

                <p>

                  {editingCustomer
                    ? "Update customer information."
                    : "Create a new customer."}

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
              className="customers-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="customers-form-grid">

                {/* COMPANY */}

                <div className="customers-form-group">

                  <label>
                    Company *
                  </label>

                  <select
                    name="company"
                    value={
                      formData.company
                    }
                    onChange={
                      handleCompanyChange
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
                          {company.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* BRANCH */}

                <div className="customers-form-group">

                  <label>
                    Branch *
                  </label>

                  <select
                    name="branch"
                    value={
                      formData.branch
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      !formData.company
                    }
                  >

                    <option value="">
                      Select Branch
                    </option>

                    {branches.map(
                      (branch) => (
                        <option
                          key={
                            branch._id
                          }
                          value={
                            branch._id
                          }
                        >
                          {branch.name}
                          {branch.branchCode
                            ? ` (${branch.branchCode})`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* CUSTOMER TYPE */}

                <div className="customers-form-group">

                  <label>
                    Customer Type *
                  </label>

                  <select
                    name="customerType"
                    value={
                      formData.customerType
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="INDIVIDUAL">
                      Individual
                    </option>

                    <option value="BUSINESS">
                      Business
                    </option>

                  </select>

                </div>

                {/* CUSTOMER NAME */}

                <div className="customers-form-group">

                  <label>
                    Customer Name *
                  </label>

                  <input
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Customer name"
                    required
                  />

                </div>

                {/* BUSINESS COMPANY NAME */}

                {formData.customerType ===
                  "BUSINESS" && (

                  <div className="customers-form-group">

                    <label>
                      Business Company Name *
                    </label>

                    <input
                      name="companyName"
                      value={
                        formData.companyName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Business company name"
                      required
                    />

                  </div>

                )}

                {/* EMAIL */}

                <div className="customers-form-group">

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
                    placeholder="customer@example.com"
                  />

                </div>

                {/* PHONE */}

                <div className="customers-form-group">

                  <label>
                    Phone *
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
                    required
                  />

                </div>

                {/* ALTERNATE PHONE */}

                <div className="customers-form-group">

                  <label>
                    Alternate Phone
                  </label>

                  <input
                    name="alternatePhone"
                    value={
                      formData.alternatePhone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Alternate phone"
                  />

                </div>

                {/* GST */}

                <div className="customers-form-group">

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

                <div className="customers-form-group">

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

                {/* BILLING ADDRESS */}

                <div className="customers-form-section-title">
                  <span>
                    Billing Address
                  </span>
                </div>

                <div className="customers-form-group full">

                  <label>
                    Address Line 1
                  </label>

                  <input
                    value={
                      formData
                        .billingAddress
                        .addressLine1
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "billingAddress",
                        "addressLine1",
                        e.target.value
                      )
                    }
                    placeholder="Street address"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    Address Line 2
                  </label>

                  <input
                    value={
                      formData
                        .billingAddress
                        .addressLine2
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "billingAddress",
                        "addressLine2",
                        e.target.value
                      )
                    }
                    placeholder="Apartment, area..."
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    City
                  </label>

                  <input
                    value={
                      formData
                        .billingAddress
                        .city
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "billingAddress",
                        "city",
                        e.target.value
                      )
                    }
                    placeholder="Coimbatore"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    State
                  </label>

                  <input
                    value={
                      formData
                        .billingAddress
                        .state
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "billingAddress",
                        "state",
                        e.target.value
                      )
                    }
                    placeholder="Tamil Nadu"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    Country
                  </label>

                  <input
                    value={
                      formData
                        .billingAddress
                        .country
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "billingAddress",
                        "country",
                        e.target.value
                      )
                    }
                    placeholder="India"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    Postal Code
                  </label>

                  <input
                    value={
                      formData
                        .billingAddress
                        .postalCode
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "billingAddress",
                        "postalCode",
                        e.target.value
                      )
                    }
                    placeholder="641001"
                  />

                </div>

                {/* SHIPPING ADDRESS */}

                <div className="customers-form-section-title">
                  <span>
                    Shipping Address
                  </span>
                </div>

                <div className="customers-form-group full">

                  <label>
                    Address Line 1
                  </label>

                  <input
                    value={
                      formData
                        .shippingAddress
                        .addressLine1
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "shippingAddress",
                        "addressLine1",
                        e.target.value
                      )
                    }
                    placeholder="Street address"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    Address Line 2
                  </label>

                  <input
                    value={
                      formData
                        .shippingAddress
                        .addressLine2
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "shippingAddress",
                        "addressLine2",
                        e.target.value
                      )
                    }
                    placeholder="Apartment, area..."
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    City
                  </label>

                  <input
                    value={
                      formData
                        .shippingAddress
                        .city
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "shippingAddress",
                        "city",
                        e.target.value
                      )
                    }
                    placeholder="Coimbatore"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    State
                  </label>

                  <input
                    value={
                      formData
                        .shippingAddress
                        .state
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "shippingAddress",
                        "state",
                        e.target.value
                      )
                    }
                    placeholder="Tamil Nadu"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    Country
                  </label>

                  <input
                    value={
                      formData
                        .shippingAddress
                        .country
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "shippingAddress",
                        "country",
                        e.target.value
                      )
                    }
                    placeholder="India"
                  />

                </div>

                <div className="customers-form-group">

                  <label>
                    Postal Code
                  </label>

                  <input
                    value={
                      formData
                        .shippingAddress
                        .postalCode
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        "shippingAddress",
                        "postalCode",
                        e.target.value
                      )
                    }
                    placeholder="641001"
                  />

                </div>

                {/* CREDIT LIMIT */}

                <div className="customers-form-group">

                  <label>
                    Credit Limit
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="creditLimit"
                    value={
                      formData.creditLimit
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                  />

                </div>

                {/* PAYMENT TERMS */}

                <div className="customers-form-group">

                  <label>
                    Payment Terms
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="paymentTerms"
                    value={
                      formData.paymentTerms
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                  />

                </div>

                {/* OPENING BALANCE */}

                <div className="customers-form-group">

                  <label>
                    Opening Balance
                  </label>

                  <input
                    type="number"
                    name="openingBalance"
                    value={
                      formData.openingBalance
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                  />

                </div>

                {/* NOTES */}

                <div className="customers-form-group full">

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
                    placeholder="Additional notes..."
                    rows="3"
                  />

                </div>

              </div>

              {/* ACTIVE */}

              <div
                className="customers-form-group"
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
                    name="isActive"
                    checked={
                      formData.isActive
                    }
                    onChange={
                      handleChange
                    }
                  />

                  Active Customer

                </label>

              </div>

              {/* FORM ACTIONS */}

              <div className="customers-form-actions">

                <button
                  type="button"
                  className="customers-cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customers-save-btn"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingCustomer
                    ? "Update Customer"
                    : "Create Customer"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================================
          VIEW MODAL
      ========================================= */}

      {viewCustomer && (

        <div
          className="customers-modal-overlay"
          onClick={() =>
            setViewCustomer(null)
          }
        >

          <div
            className="customers-modal customers-view-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* VIEW HEADER */}

            <div className="customers-view-header">

              <div className="customers-view-logo">
                <FiUsers />
              </div>

              <div>

                <h3>
                  {viewCustomer.name}
                </h3>

                <p>

                  {viewCustomer.customerCode ||
                    "Customer details"}

                </p>

              </div>

            </div>

            {/* VIEW DETAILS */}

            <div className="customers-view-details">

              <div>

                <span>
                  Customer Type
                </span>

                <strong>
                  {viewCustomer.customerType ===
                  "BUSINESS"
                    ? "Business"
                    : "Individual"}
                </strong>

              </div>

              <div>

                <span>
                  Company
                </span>

                <strong>
                  {viewCustomer.company
                    ?.name || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Branch
                </span>

                <strong>
                  {viewCustomer.branch
                    ?.name || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Email
                </span>

                <strong>
                  {viewCustomer.email ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Phone
                </span>

                <strong>
                  {viewCustomer.phone ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Alternate Phone
                </span>

                <strong>
                  {viewCustomer.alternatePhone ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Business Name
                </span>

                <strong>
                  {viewCustomer.companyName ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  GST Number
                </span>

                <strong>
                  {viewCustomer.gstNumber ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  PAN Number
                </span>

                <strong>
                  {viewCustomer.panNumber ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Credit Limit
                </span>

                <strong>
                  ₹{" "}
                  {Number(
                    viewCustomer.creditLimit ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Payment Terms
                </span>

                <strong>
                  {viewCustomer.paymentTerms ||
                    0}{" "}
                  days
                </strong>

              </div>

              <div>

                <span>
                  Opening Balance
                </span>

                <strong>
                  ₹{" "}
                  {Number(
                    viewCustomer.openingBalance ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Billing Address
                </span>

                <strong>

                  {[
                    viewCustomer.billingAddress
                      ?.addressLine1,

                    viewCustomer.billingAddress
                      ?.city,

                    viewCustomer.billingAddress
                      ?.state,

                    viewCustomer.billingAddress
                      ?.country,

                    viewCustomer.billingAddress
                      ?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}

                </strong>

              </div>

              <div>

                <span>
                  Shipping Address
                </span>

                <strong>

                  {[
                    viewCustomer.shippingAddress
                      ?.addressLine1,

                    viewCustomer.shippingAddress
                      ?.city,

                    viewCustomer.shippingAddress
                      ?.state,

                    viewCustomer.shippingAddress
                      ?.country,

                    viewCustomer.shippingAddress
                      ?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}

                </strong>

              </div>

              <div>

                <span>
                  Status
                </span>

                <strong
                  className={
                    viewCustomer.isActive ===
                    false
                      ? "view-inactive"
                      : "view-active"
                  }
                >
                  {viewCustomer.isActive ===
                  false
                    ? "Inactive"
                    : "Active"}
                </strong>

              </div>

              <div>

                <span>
                  Notes
                </span>

                <strong>
                  {viewCustomer.notes ||
                    "-"}
                </strong>

              </div>

            </div>

            {/* VIEW ACTIONS */}

            <div className="customers-form-actions">

              <button
                type="button"
                className="customers-cancel-btn"
                onClick={() =>
                  setViewCustomer(null)
                }
              >
                Close
              </button>

              {viewCustomer.isActive !==
                false && (
                <button
                  type="button"
                  className="customers-save-btn"
                  onClick={() => {
                    setViewCustomer(null);

                    handleEditCustomer(
                      viewCustomer
                    );
                  }}
                >

                  <FiEdit2 />

                  Edit Customer

                </button>
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Customers;