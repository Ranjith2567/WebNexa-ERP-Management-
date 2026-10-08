import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiUsers,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/users.css";

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "HR",
  "SALES",
  "PURCHASE",
  "INVENTORY",
  "ACCOUNTANT",
  "EMPLOYEE",
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  company: "",
  branch: "",
  department: "",
  designation: "",
  role: "EMPLOYEE",
  joiningDate: "",
  dateOfBirth: "",
  gender: "",
  address: {
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  },
  isActive: true,
};

function Users() {
  const [users, setUsers] = useState([]);

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (roleFilter) {
        params.role = roleFilter;
      }

      if (statusFilter !== "") {
        params.isActive = statusFilter;
      }

      params.page = 1;
      params.limit = 100;

      const response = await api.get("/users", {
        params,
      });

      const data = response.data;

      setUsers(
        Array.isArray(data?.employees)
          ? data.employees
          : Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error("Fetch users error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH FORM DATA
  // ==========================================

  const fetchFormData = async () => {
    try {
      const [
        companiesResponse,
        branchesResponse,
        departmentsResponse,
        designationsResponse,
      ] = await Promise.all([
        api.get("/companies"),
        api.get("/branches"),
        api.get("/departments"),
        api.get("/designations"),
      ]);

      const extractArray = (response) => {
        const data = response.data;

        if (Array.isArray(data)) {
          return data;
        }

        if (Array.isArray(data?.data)) {
          return data.data;
        }

        if (Array.isArray(data?.companies)) {
          return data.companies;
        }

        if (Array.isArray(data?.branches)) {
          return data.branches;
        }

        if (Array.isArray(data?.departments)) {
          return data.departments;
        }

        if (Array.isArray(data?.designations)) {
          return data.designations;
        }

        return [];
      };

      setCompanies(extractArray(companiesResponse));
      setBranches(extractArray(branchesResponse));
      setDepartments(extractArray(departmentsResponse));
      setDesignations(extractArray(designationsResponse));
    } catch (err) {
      console.error(
        "Fetch user form data error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load company, branch, department or designation data."
      );
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchUsers();
    fetchFormData();
  }, []);

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==========================================
  // OPEN CREATE
  // ==========================================

  const openCreateModal = () => {
    setEditingUser(null);

    setFormData({
      ...initialForm,
      address: {
        ...initialForm.address,
      },
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const handleEdit = (user) => {
    setEditingUser(user);

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      company: user.company?._id || user.company || "",
      branch: user.branch?._id || user.branch || "",
      department:
        user.department?._id ||
        user.department ||
        "",
      designation:
        user.designation?._id ||
        user.designation ||
        "",
      role: user.role || "EMPLOYEE",
      joiningDate: user.joiningDate
        ? user.joiningDate.substring(0, 10)
        : "",
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.substring(0, 10)
        : "",
      gender: user.gender || "",
      address: {
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        country:
          user.address?.country || "India",
        pincode: user.address?.pincode || "",
      },
      isActive:
        user.isActive !== undefined
          ? user.isActive
          : true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);
    setFormData({
      ...initialForm,
      address: {
        ...initialForm.address,
      },
    });
  };

  // ==========================================
  // VIEW USER
  // ==========================================

  const handleView = async (user) => {
    try {
      const id = user._id || user.id;

      const response = await api.get(
        `/users/${id}`
      );

      setSelectedUser(
        response.data?.employee ||
          response.data?.user ||
          response.data?.data ||
          user
      );

      setShowViewModal(true);
    } catch (err) {
      console.error("View user error:", err);

      setSelectedUser(user);
      setShowViewModal(true);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const id = user._id || user.id;

      await api.delete(`/users/${id}`);

      setSuccess(
        "User deleted successfully."
      );

      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!formData.name.trim()) {
        setError("Name is required.");
        setSaving(false);
        return;
      }

      if (!formData.email.trim()) {
        setError("Email is required.");
        setSaving(false);
        return;
      }

      if (!editingUser && !formData.password) {
        setError("Password is required.");
        setSaving(false);
        return;
      }

      if (!formData.company) {
        setError("Company is required.");
        setSaving(false);
        return;
      }

      if (!formData.branch) {
        setError("Branch is required.");
        setSaving(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company,
        branch: formData.branch,
        department:
          formData.department || null,
        designation:
          formData.designation || null,
        role: formData.role,
        joiningDate:
          formData.joiningDate || null,
        dateOfBirth:
          formData.dateOfBirth || null,
        gender: formData.gender || "",
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
        isActive: formData.isActive,
      };

      if (!editingUser) {
        payload.password =
          formData.password;
      }

      if (editingUser) {
        const id =
          editingUser._id ||
          editingUser.id;

        await api.put(
          `/users/${id}`,
          payload
        );

        setSuccess(
          "User updated successfully."
        );
      } else {
        await api.post(
          "/users",
          payload
        );

        setSuccess(
          "User created successfully."
        );
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      console.error(
        "Save user error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getUserId = (user) => {
    return (
      user._id ||
      user.id ||
      ""
    );
  };

  const getCompanyName = (user) => {
    if (
      user.company &&
      typeof user.company === "object"
    ) {
      return user.company.name || "-";
    }

    const company = companies.find(
      (item) =>
        item._id === user.company
    );

    return company?.name || "-";
  };

  const getBranchName = (user) => {
    if (
      user.branch &&
      typeof user.branch === "object"
    ) {
      return user.branch.name || "-";
    }

    const branch = branches.find(
      (item) =>
        item._id === user.branch
    );

    return branch?.name || "-";
  };

  const getDepartmentName = (user) => {
    if (
      user.department &&
      typeof user.department === "object"
    ) {
      return user.department.name || "-";
    }

    const department =
      departments.find(
        (item) =>
          item._id === user.department
      );

    return department?.name || "-";
  };

  const getDesignationName = (user) => {
    if (
      user.designation &&
      typeof user.designation ===
        "object"
    ) {
      return (
        user.designation.name || "-"
      );
    }

    const designation =
      designations.find(
        (item) =>
          item._id ===
          user.designation
      );

    return designation?.name || "-";
  };

  const formatRole = (role) => {
    if (!role) return "-";

    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString("en-IN");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="users-page">

      {/* HEADER */}
      <div className="users-page-header">

        <div>
          <div className="users-title-row">
            <div className="users-title-icon">
              <FiUsers />
            </div>

            <div>
              <h1>Users Management</h1>

              <p>
                Manage ERP users, roles and
                access accounts
              </p>
            </div>
          </div>
        </div>

        <button
          className="users-add-btn"
          onClick={openCreateModal}
        >
          <FiPlus />
          Create User
        </button>

      </div>

      {/* ALERTS */}
      {error && (
        <div className="users-alert users-alert-error">
          {error}
          <button
            onClick={() => setError("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="users-alert users-alert-success">
          <FiCheckCircle />
          {success}
          <button
            onClick={() => setSuccess("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="users-toolbar">

        <div className="users-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value)
          }
        >
          <option value="">
            All Roles
          </option>

          {ROLES.map((role) => (
            <option
              key={role}
              value={role}
            >
              {formatRole(role)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
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
          className="users-refresh-btn"
          onClick={fetchUsers}
          title="Refresh"
        >
          <FiRefreshCw
            className={
              loading
                ? "users-spin"
                : ""
            }
          />
        </button>

      </div>

      {/* USERS CONTENT */}
      <div className="users-content">

        {loading ? (
          <div className="users-loading">
            <FiRefreshCw className="users-spin" />
            <span>
              Loading users...
            </span>
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">

            <div className="users-empty-icon">
              <FiUsers />
            </div>

            <h3>
              No Users Found
            </h3>

            <p>
              Create your first ERP user
              to get started.
            </p>

            <button
              onClick={openCreateModal}
              className="users-empty-btn"
            >
              <FiPlus />
              Create User
            </button>

          </div>
        ) : (
          <div className="users-grid">

            {users.map((user) => (

              <div
                className="user-card"
                key={getUserId(user)}
              >

                {/* CARD HEADER */}
                <div className="user-card-header">

                  <div className="user-avatar">
                    {user.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "U"}
                  </div>

                  <div className="user-main-info">

                    <h3>
                      {user.name}
                    </h3>

                    <span>
                      {user.employeeId ||
                        "No Employee ID"}
                    </span>

                  </div>

                  <span
                    className={`user-status ${
                      user.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {user.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>

                {/* CARD BODY */}
                <div className="user-card-body">

                  <div className="user-info-row">
                    <FiMail />
                    <span>
                      {user.email}
                    </span>
                  </div>

                  <div className="user-info-row">
                    <FiPhone />
                    <span>
                      {user.phone || "-"}
                    </span>
                  </div>

                  <div className="user-info-row">
                    <FiBriefcase />
                    <span>
                      {formatRole(
                        user.role
                      )}
                    </span>
                  </div>

                  <div className="user-info-row">
                    <span className="user-info-label">
                      Company
                    </span>
                    <span>
                      {getCompanyName(
                        user
                      )}
                    </span>
                  </div>

                  <div className="user-info-row">
                    <span className="user-info-label">
                      Branch
                    </span>
                    <span>
                      {getBranchName(
                        user
                      )}
                    </span>
                  </div>

                </div>

                {/* CARD FOOTER */}
                <div className="user-card-footer">

                  <button
                    className="user-action view"
                    onClick={() =>
                      handleView(user)
                    }
                    title="View"
                  >
                    <FiEye />
                  </button>

                  <button
                    className="user-action edit"
                    onClick={() =>
                      handleEdit(user)
                    }
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>

                  <button
                    className="user-action delete"
                    onClick={() =>
                      handleDelete(user)
                    }
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

      {/* ======================================
          CREATE / EDIT MODAL
      ====================================== */}

      {showModal && (
        <div className="users-modal-overlay">

          <div className="users-modal">

            <div className="users-modal-header">

              <div>
                <h2>
                  {editingUser
                    ? "Edit User"
                    : "Create User"}
                </h2>

                <p>
                  {editingUser
                    ? "Update user account details"
                    : "Create a new ERP login account"}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
              >
                <FiX />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="users-form"
            >

              <div className="users-modal-body">

                {/* BASIC INFORMATION */}

                <div className="users-form-section">

                  <div className="users-section-title">
                    Basic Information
                  </div>

                  <div className="users-form-grid">

                    <div className="users-field">
                      <label>
                        Name *
                      </label>

                      <input
                        name="name"
                        value={
                          formData.name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        Email *
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
                        placeholder="Enter email"
                      />
                    </div>

                    {!editingUser && (
                      <div className="users-field">
                        <label>
                          Password *
                        </label>

                        <input
                          type="password"
                          name="password"
                          value={
                            formData.password
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter password"
                        />
                      </div>
                    )}

                    <div className="users-field">
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
                        placeholder="Enter phone number"
                      />
                    </div>

                  </div>

                </div>

                {/* ACCESS */}

                <div className="users-form-section">

                  <div className="users-section-title">
                    Access & Organization
                  </div>

                  <div className="users-form-grid">

                    <div className="users-field">
                      <label>
                        Role *
                      </label>

                      <select
                        name="role"
                        value={
                          formData.role
                        }
                        onChange={
                          handleChange
                        }
                      >
                        {ROLES.map(
                          (role) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {formatRole(
                                role
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="users-field">
                      <label>
                        Company *
                      </label>

                      <select
                        name="company"
                        value={
                          formData.company
                        }
                        onChange={
                          handleChange
                        }
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

                    <div className="users-field">
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

                    <div className="users-field">
                      <label>
                        Department
                      </label>

                      <select
                        name="department"
                        value={
                          formData.department
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select Department
                        </option>

                        {departments.map(
                          (department) => (
                            <option
                              key={
                                department._id
                              }
                              value={
                                department._id
                              }
                            >
                              {department.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="users-field">
                      <label>
                        Designation
                      </label>

                      <select
                        name="designation"
                        value={
                          formData.designation
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select Designation
                        </option>

                        {designations.map(
                          (designation) => (
                            <option
                              key={
                                designation._id
                              }
                              value={
                                designation._id
                              }
                            >
                              {
                                designation.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="users-field">
                      <label>
                        Status
                      </label>

                      <select
                        name="isActive"
                        value={
                          formData.isActive
                            ? "true"
                            : "false"
                        }
                        onChange={(e) =>
                          setFormData(
                            (prev) => ({
                              ...prev,
                              isActive:
                                e.target
                                  .value ===
                                "true",
                            })
                          )
                        }
                      >
                        <option value="true">
                          Active
                        </option>

                        <option value="false">
                          Inactive
                        </option>
                      </select>
                    </div>

                  </div>

                </div>

                {/* PERSONAL INFORMATION */}

                <div className="users-form-section">

                  <div className="users-section-title">
                    Personal Information
                  </div>

                  <div className="users-form-grid">

                    <div className="users-field">
                      <label>
                        Joining Date
                      </label>

                      <input
                        type="date"
                        name="joiningDate"
                        value={
                          formData.joiningDate
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        Date of Birth
                      </label>

                      <input
                        type="date"
                        name="dateOfBirth"
                        value={
                          formData.dateOfBirth
                        }
                        onChange={
                          handleChange
                        }
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        Gender
                      </label>

                      <select
                        name="gender"
                        value={
                          formData.gender
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select Gender
                        </option>

                        <option value="MALE">
                          Male
                        </option>

                        <option value="FEMALE">
                          Female
                        </option>

                        <option value="OTHER">
                          Other
                        </option>
                      </select>
                    </div>

                  </div>

                </div>

                {/* ADDRESS */}

                <div className="users-form-section">

                  <div className="users-section-title">
                    Address
                  </div>

                  <div className="users-form-grid">

                    <div className="users-field users-field-full">
                      <label>
                        Street
                      </label>

                      <input
                        name="address.street"
                        value={
                          formData.address
                            .street
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Street / Door No."
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        City
                      </label>

                      <input
                        name="address.city"
                        value={
                          formData.address
                            .city
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="City"
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        State
                      </label>

                      <input
                        name="address.state"
                        value={
                          formData.address
                            .state
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="State"
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        Country
                      </label>

                      <input
                        name="address.country"
                        value={
                          formData.address
                            .country
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Country"
                      />
                    </div>

                    <div className="users-field">
                      <label>
                        Pincode
                      </label>

                      <input
                        name="address.pincode"
                        value={
                          formData.address
                            .pincode
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="6 digit pincode"
                        maxLength={6}
                      />
                    </div>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="users-modal-footer">

                <button
                  type="button"
                  className="users-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="users-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      {editingUser
                        ? "Update User"
                        : "Create User"}
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
        selectedUser && (
          <div className="users-modal-overlay">

            <div className="users-modal users-view-modal">

              <div className="users-modal-header">

                <div>
                  <h2>
                    User Details
                  </h2>

                  <p>
                    View account information
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  <FiX />
                </button>

              </div>

              <div className="users-modal-body">

                <div className="users-profile-header">

                  <div className="users-profile-avatar">
                    {selectedUser.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "U"}
                  </div>

                  <div>
                    <h3>
                      {selectedUser.name}
                    </h3>

                    <p>
                      {selectedUser.email}
                    </p>

                    <span
                      className={`user-status ${
                        selectedUser.isActive
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {selectedUser.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                </div>

                <div className="users-view-grid">

                  <div>
                    <span>
                      Employee ID
                    </span>
                    <strong>
                      {selectedUser.employeeId ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Role
                    </span>
                    <strong>
                      {formatRole(
                        selectedUser.role
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Company
                    </span>
                    <strong>
                      {getCompanyName(
                        selectedUser
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Branch
                    </span>
                    <strong>
                      {getBranchName(
                        selectedUser
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Department
                    </span>
                    <strong>
                      {getDepartmentName(
                        selectedUser
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Designation
                    </span>
                    <strong>
                      {getDesignationName(
                        selectedUser
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>
                    <strong>
                      {selectedUser.phone ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Gender
                    </span>
                    <strong>
                      {selectedUser.gender ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Joining Date
                    </span>
                    <strong>
                      {formatDate(
                        selectedUser.joiningDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Date of Birth
                    </span>
                    <strong>
                      {formatDate(
                        selectedUser.dateOfBirth
                      )}
                    </strong>
                  </div>

                </div>

                <div className="users-view-address">

                  <span>
                    Address
                  </span>

                  <p>
                    {selectedUser.address
                      ?.street || ""}
                    {selectedUser.address
                      ?.city
                      ? `, ${selectedUser.address.city}`
                      : ""}
                    {selectedUser.address
                      ?.state
                      ? `, ${selectedUser.address.state}`
                      : ""}
                    {selectedUser.address
                      ?.pincode
                      ? ` - ${selectedUser.address.pincode}`
                      : ""}
                    {selectedUser.address
                      ?.country
                      ? `, ${selectedUser.address.country}`
                      : ""}
                  </p>

                </div>

              </div>

              <div className="users-modal-footer">

                <button
                  type="button"
                  className="users-cancel-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Users;