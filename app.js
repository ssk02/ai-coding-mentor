const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

function validateAIProviderConfig() {
  const mode = (process.env.AI_MODE || "live").toLowerCase();
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const validProviders = ["openai", "gemini"];

  if (!validProviders.includes(provider)) {
    throw new Error(
      `Invalid AI_PROVIDER: "${provider}". Supported providers: ${validProviders.join(
        ", "
      )}`
    );
  }

  if (mode === "mock") {
    console.log("AI_MODE=mock, skipping live provider credential validation");
    console.log(`Configured AI Provider: ${provider.toUpperCase()}`);
    return;
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
    }
    console.log("OpenAI provider configured");
  } else if (provider === "gemini") {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error(
        "GOOGLE_GENERATIVE_AI_API_KEY is required when AI_PROVIDER=gemini"
      );
    }
    console.log("Google Gemini provider configured");
  }

  console.log(`Using AI Provider: ${provider.toUpperCase()}`);
}

try {
  validateAIProviderConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json());

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: "Too many messages sent. Please wait before sending more.",
  standardHeaders: false,
  skip: (req) => !req.path.includes("/api/chat")
});

app.use(chatLimiter);

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/history", require("./routes/history.routes"));
app.use("/", require("./routes/view.routes"));

app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  if (err.status === 429) {
    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "An unexpected error occurred."
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
