import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import { setAuthToken } from "./services/api";

const token = localStorage.getItem("token");
if (token) setAuthToken(token);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
