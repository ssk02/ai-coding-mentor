const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cors({
    origin: "*"
}));
app.use(express.json());

// 🔹 Rate limiting middleware
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 30,                   // max 30 requests per minute
  message: "Too many messages sent. Please wait before sending more.",
  standardHeaders: false,
  skip: (req) => {
    // Skip rate limiting for non-chat routes
    return !req.path.includes("/api/chat");
  }
});

app.use(chatLimiter);

/*app.get("/", (req, res) => {
    res.send("AI Coding Mentor API running");
});*/

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/history", require("./routes/history.routes"));
app.use("/", require("./routes/view.routes"));

// 🔹 Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  
  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || "An unexpected error occurred."
  });
});

// 🔹 Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;