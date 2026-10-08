import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(
        response.data?.message ||
          "If the account exists, a password reset link has been sent."
      );

      setEmail("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
 <div className="login-page forgot-page">
  <section className="login-card-wrapper">
    <div className="login-card">
          <h2>Forgot Password?</h2>

          <p className="login-subtitle">
            Enter your registered email address and we'll
            send you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Email Address</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <Link className="auth-back-link" to="/login">
            ← Back to Login
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;