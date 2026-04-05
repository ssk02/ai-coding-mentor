import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { setAuthToken } from "./services/api";

const token = localStorage.getItem("token");
if (token) setAuthToken(token);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
              </ProtectedRoute>
            } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
