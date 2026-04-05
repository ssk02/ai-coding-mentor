import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    skill_level: "beginner",
    preferred_language: "Python"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const isFormValid =
    form.full_name.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.preferred_language.trim();

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!isFormValid || isLoading) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await API.post("/auth/register", {
        ...form,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        preferred_language: form.preferred_language.trim()
      });
      setSuccess("Registered successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
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
            <p className="eyebrow">Create your space</p>
            <h1>Set up a mentor workspace that matches how you learn.</h1>
            <p>
              Choose your level, note your preferred language, and keep every
              study session organized from day one.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>Skill-aware support</strong>
              <span>Beginner, intermediate, or advanced, the app can keep explanations on level.</span>
            </div>
            <div className="auth-highlight">
              <strong>Topic-by-topic history</strong>
              <span>Separate conversations make it easier to revisit debugging and theory later.</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow">New account</p>
            <h2>Register</h2>
            <p>Tell the mentor a little about you before your first session.</p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>
            {error && <div className="feedback-banner error">{error}</div>}
            {success && <div className="feedback-banner success">{success}</div>}

            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                name="full_name"
                className="auth-input"
                placeholder="Your name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                name="password"
                type="password"
                className="auth-input"
                placeholder="Choose a password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="register-skill-level">Skill level</label>
                <select
                  id="register-skill-level"
                  name="skill_level"
                  className="auth-select"
                  value={form.skill_level}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="register-language">Preferred language</label>
                <input
                  id="register-language"
                  name="preferred_language"
                  className="auth-input"
                  placeholder="Python"
                  value={form.preferred_language}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/">Login</Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Register;
