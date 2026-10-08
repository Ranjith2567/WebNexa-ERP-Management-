import { useEffect, useState } from "react";
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiHome,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/settings.css";

function Settings() {
  const { user } = useAuth();

  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    email: "",
    phone: "",
    gstNumber: "",
    panNumber: "",
    logo: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
    currency: "INR",
    financialYearStart: "April",
    timezone: "Asia/Kolkata",
    taxEnabled: true,
  });

  // ==========================================
  // FETCH COMPANY SETTINGS
  // ==========================================

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!user?.company) {
        setError(
          "No company is assigned to the logged-in user."
        );
        return;
      }

      const response = await api.get("/companies");

      const companies =
        response.data?.companies ||
        response.data?.data ||
        [];

      const loggedInCompanyId =
        typeof user.company === "object"
          ? user.company._id
          : user.company;

      const company = companies.find(
        (item) =>
          item._id === loggedInCompanyId
      );

      if (!company) {
        setError("Company settings not found.");
        return;
      }

      setCompanyId(company._id);

      setFormData({
        name: company.name || "",
        legalName: company.legalName || "",
        email: company.email || "",
        phone: company.phone || "",
        gstNumber: company.gstNumber || "",
        panNumber: company.panNumber || "",
        logo: company.logo || "",

        address: {
          street:
            company.address?.street || "",
          city:
            company.address?.city || "",
          state:
            company.address?.state || "",
          country:
            company.address?.country || "India",
          pincode:
            company.address?.pincode || "",
        },

        currency:
          company.currency || "INR",

        financialYearStart:
          company.financialYearStart || "April",

        timezone:
          company.timezone || "Asia/Kolkata",

        taxEnabled:
          company.taxEnabled !== undefined
            ? company.taxEnabled
            : true,
      });
    } catch (err) {
      console.error(
        "Settings Fetch Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load company settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company) {
      fetchSettings();
    }
  }, [user]);

  // ==========================================
  // INPUT HANDLING
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));

    setSuccess("");
  };

  const handleTaxChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      taxEnabled: e.target.checked,
    }));

    setSuccess("");
  };

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!companyId) {
        setError("Company ID not found.");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        legalName: formData.legalName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gstNumber:
          formData.gstNumber
            .trim()
            .toUpperCase(),
        panNumber:
          formData.panNumber
            .trim()
            .toUpperCase(),

        logo: formData.logo.trim(),

        address: {
          street:
            formData.address.street.trim(),
          city:
            formData.address.city.trim(),
          state:
            formData.address.state.trim(),
          country:
            formData.address.country.trim(),
          pincode:
            formData.address.pincode.trim(),
        },

        currency:
          formData.currency.trim(),

        financialYearStart:
          formData.financialYearStart.trim(),

        timezone:
          formData.timezone.trim(),

        taxEnabled:
          formData.taxEnabled,
      };

      const response = await api.put(
        `/companies/${companyId}`,
        payload
      );

      if (response.data?.success) {
        setSuccess(
          "Company settings updated successfully."
        );

        if (response.data.company) {
          const company =
            response.data.company;

          setFormData({
            name: company.name || "",
            legalName:
              company.legalName || "",
            email: company.email || "",
            phone: company.phone || "",
            gstNumber:
              company.gstNumber || "",
            panNumber:
              company.panNumber || "",
            logo: company.logo || "",

            address: {
              street:
                company.address?.street ||
                "",
              city:
                company.address?.city ||
                "",
              state:
                company.address?.state ||
                "",
              country:
                company.address?.country ||
                "India",
              pincode:
                company.address?.pincode ||
                "",
            },

            currency:
              company.currency || "INR",

            financialYearStart:
              company.financialYearStart ||
              "April",

            timezone:
              company.timezone ||
              "Asia/Kolkata",

            taxEnabled:
              company.taxEnabled !==
              undefined
                ? company.taxEnabled
                : true,
          });
        }
      } else {
        setError(
          response.data?.message ||
            "Failed to update settings."
        );
      }
    } catch (err) {
      console.error(
        "Settings Update Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update company settings."
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
      <div className="settings-page">
        <div className="settings-loading">
          <div className="settings-spinner" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="settings-page">
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <div className="settings-title-row">
            <div className="settings-title-icon">
              <FiSettings />
            </div>

            <div>
              <h1>Settings</h1>
              <p>
                Manage your company and ERP
                preferences
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="settings-refresh-btn"
          onClick={fetchSettings}
          disabled={saving}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="settings-alert settings-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="settings-alert settings-alert-success">
          <FiCheckCircle />
          {success}
        </div>
      )}

      <form
        className="settings-form"
        onSubmit={handleSubmit}
      >
        {/* COMPANY INFORMATION */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon">
              <FiHome />
            </div>

            <div>
              <h2>Company Information</h2>
              <p>
                Basic information about your
                company
              </p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field">
              <label>Company Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="settings-field">
              <label>Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
              />
            </div>

            <div className="settings-field">
              <label>Email</label>
              <div className="settings-input-icon">
                <FiMail />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="settings-field">
              <label>Phone</label>
              <div className="settings-input-icon">
                <FiPhone />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="settings-field">
              <label>GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
              />
            </div>

            <div className="settings-field">
              <label>PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
              />
            </div>

            <div className="settings-field settings-field-full">
              <label>Logo URL</label>
              <input
                type="text"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* ADDRESS */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon">
              <FiMapPin />
            </div>

            <div>
              <h2>Company Address</h2>
              <p>
                Registered company address
              </p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field settings-field-full">
              <label>Street</label>
              <input
                type="text"
                name="street"
                value={
                  formData.address.street
                }
                onChange={
                  handleAddressChange
                }
              />
            </div>

            <div className="settings-field">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={
                  formData.address.city
                }
                onChange={
                  handleAddressChange
                }
              />
            </div>

            <div className="settings-field">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={
                  formData.address.state
                }
                onChange={
                  handleAddressChange
                }
              />
            </div>

            <div className="settings-field">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={
                  formData.address.country
                }
                onChange={
                  handleAddressChange
                }
              />
            </div>

            <div className="settings-field">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={
                  formData.address.pincode
                }
                onChange={
                  handleAddressChange
                }
                maxLength="6"
              />
            </div>
          </div>
        </section>

        {/* ERP PREFERENCES */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon">
              <FiSettings />
            </div>

            <div>
              <h2>ERP Preferences</h2>
              <p>
                Configure your ERP business
                preferences
              </p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field">
              <label>Currency</label>

              <div className="settings-input-icon">
                <FiDollarSign />

                <select
                  name="currency"
                  value={
                    formData.currency
                  }
                  onChange={handleChange}
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
            </div>

            <div className="settings-field">
              <label>
                Financial Year Start
              </label>

              <div className="settings-input-icon">
                <FiCalendar />

                <select
                  name="financialYearStart"
                  value={
                    formData.financialYearStart
                  }
                  onChange={handleChange}
                >
                  <option value="January">
                    January
                  </option>

                  <option value="April">
                    April
                  </option>

                  <option value="July">
                    July
                  </option>

                  <option value="October">
                    October
                  </option>
                </select>
              </div>
            </div>

            <div className="settings-field">
              <label>Timezone</label>

              <div className="settings-input-icon">
                <FiGlobe />

                <select
                  name="timezone"
                  value={
                    formData.timezone
                  }
                  onChange={handleChange}
                >
                  <option value="Asia/Kolkata">
                    Asia/Kolkata
                  </option>

                  <option value="UTC">
                    UTC
                  </option>

                  <option value="Asia/Dubai">
                    Asia/Dubai
                  </option>

                  <option value="Asia/Singapore">
                    Asia/Singapore
                  </option>
                </select>
              </div>
            </div>

            <div className="settings-field">
              <label>Tax</label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={
                    formData.taxEnabled
                  }
                  onChange={handleTaxChange}
                />

                <span className="settings-toggle-slider" />

                <span>
                  Enable Tax
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* SAVE */}
        <div className="settings-actions">
          <button
            type="submit"
            className="settings-save-btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="settings-btn-spinner" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;