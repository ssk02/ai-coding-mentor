import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isFormValid = email.trim() && password.trim();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!isFormValid || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password
      });

      const token = response.data.token;

      localStorage.setItem("token", token);
      setAuthToken(token);
      navigate("/chat");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell app-shell-auth">
      <div className="auth-backdrop" />

      <div className="auth-layout">
        <section className="auth-hero">
          <div>
            <p className="eyebrow">AI Coding Mentor</p>
            <h1>Learn with a workspace that feels focused.</h1>
            <p>
              Ask coding questions, keep conversations organized, and get help
              that matches the pace of your learning.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>Persistent threads</strong>
              <span>Keep one conversation per topic so your progress stays easy to revisit.</span>
            </div>
            <div className="auth-highlight">
              <strong>Guided replies</strong>
              <span>Get explanations, debugging help, and practical next steps in one place.</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in</h2>
            <p>Continue where your last mentoring session left off.</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            {error && <div className="feedback-banner error">{error}</div>}

            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
