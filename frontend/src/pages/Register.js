import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f4f6f8",
    padding: "16px"
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "350px"
  },
  title: {
    marginBottom: "20px",
    textAlign: "center",
    color: "#111827"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px"
  },
  select: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#fff"
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  buttonHover: {
    background: "#1d4ed8"
  },
  buttonDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed"
  },
  footerText: {
    marginTop: "15px",
    textAlign: "center",
    fontSize: "14px"
  },
  link: {
    color: "#2563eb",
    textDecoration: "none"
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px"
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px"
  }
};

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
  const [hovered, setHovered] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const navigate = useNavigate();

  const isFormValid =
    form.full_name.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.preferred_language.trim();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await API.post("/auth/register", form);
      setSuccess("Registered successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <form onSubmit={handleRegister}>
          <input
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRegister(e);
            }}
            onFocus={() => setFocusedField("full_name")}
            onBlur={() => setFocusedField("")}
            required
            style={{
              ...styles.input,
              borderColor:
                focusedField === "full_name"
                  ? "#2563eb"
                  : "#d1d5db"
            }}
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRegister(e);
            }}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField("")}
            required
            style={{
              ...styles.input,
              borderColor:
                focusedField === "email"
                  ? "#2563eb"
                  : "#d1d5db"
            }}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRegister(e);
            }}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField("")}
            required
            style={{
              ...styles.input,
              borderColor:
                focusedField === "password"
                  ? "#2563eb"
                  : "#d1d5db"
            }}
          />

          <select
            name="skill_level"
            value={form.skill_level}
            onChange={handleChange}
            onFocus={() => setFocusedField("skill_level")}
            onBlur={() => setFocusedField("")}
            style={{
              ...styles.select,
              borderColor:
                focusedField === "skill_level"
                  ? "#2563eb"
                  : "#d1d5db"
            }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <input
            name="preferred_language"
            placeholder="Preferred Language"
            value={form.preferred_language}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRegister(e);
            }}
            onFocus={() => setFocusedField("preferred_language")}
            onBlur={() => setFocusedField("")}
            style={{
              ...styles.input,
              borderColor:
                focusedField === "preferred_language"
                  ? "#2563eb"
                  : "#d1d5db"
            }}
          />

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              ...styles.button,
              ...(hovered && isFormValid && !isLoading
                ? styles.buttonHover
                : {}),
              ...(!isFormValid || isLoading
                ? styles.buttonDisabled
                : {})
            }}
          >
            {isLoading ? "Please wait..." : "Register"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account? {" "}
          <Link to="/" style={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
