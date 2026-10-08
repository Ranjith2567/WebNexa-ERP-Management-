import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `/auth/reset-password/${token}`,
        {
          password: form.password,
        }
      );

      setMessage(
        response.data?.message ||
          "Password reset successfully."
      );

      setForm({
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-card-wrapper">
        <div className="login-card">
          <h2>Reset Password</h2>

          <p className="login-subtitle">
            Create a new password for your WebNexa ERP
            account.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>New Password</label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>

            <div className="login-field">
              <label>Confirm Password</label>

              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>

            {message && (
              <div className="login-success">
                {message}
              </div>
            )}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <Link
            className="auth-back-link"
            to="/login"
          >
            ← Back to Login
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ResetPassword;