import { useState } from "react";
import API, { setAuthToken } from "../services/api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await API.post("/auth/login", {
      email,
      password
    });

    const token = res.data.token;

    localStorage.setItem("token", token);
    setAuthToken(token);

    navigate("/chat");
  };

  return (
    <div>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
      <p>
        Don’t have an account? <a href="/register">Register</a>
        </p>

    </div>
  );
}

export default Login;
