import { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/login.css";
import { Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);

      const { token, user } = response.data;

      login(user, token);

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand">
        <h1>WebNexa ERP</h1>

        <p>
          A complete business management platform for
          inventory, sales, purchases, finance and operations.
        </p>

        <div className="login-features">
          <span>✓ Inventory Management</span>
          <span>✓ Sales & Purchase Management</span>
          <span>✓ Finance & Reports</span>
          <span>✓ Role Based Access</span>
        </div>
      </section>

      <section className="login-card-wrapper">
        <div className="login-card">
          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Sign in to your WebNexa ERP account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <Link
  to="/forgot-password"
  className="auth-back-link"
>
  Forgot Password?
</Link>
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;