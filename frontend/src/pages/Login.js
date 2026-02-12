import { useState } from "react";
import API, { setAuthToken } from "../services/api";
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
  }
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const navigate = useNavigate();

  const isFormValid = email.trim() && password.trim();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const res = await API.post("/auth/login", {
        email,
        password
      });

      const token = res.data.token;

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
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin(e);
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
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin(e);
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
            {isLoading ? "Please wait..." : "Login"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account? {" "}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
