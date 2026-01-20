const express = require("express");
const router = express.Router();
const axios = require("axios");

let JWT_TOKEN = ""; // simple demo storage

router.get("/", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/login", {
      email: req.body.email,
      password: req.body.password
    });

    JWT_TOKEN = response.data.token;
    res.redirect("/chat");

  } catch {
    res.render("login", { error: "Invalid credentials" });
  }
});

router.get("/chat", async (req, res) => {
  res.render("chat", { messages: [], conversation_id: null });
});

router.post("/chat", async (req, res) => {
  const { message, conversation_id } = req.body;

  const response = await axios.post(
    "http://localhost:5000/api/chat",
    { message, conversation_id },
    { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
  );

  res.render("chat", {
    messages: [
      { sender: "user", message_text: message },
      { sender: "assistant", message_text: response.data.reply }
    ],
    conversation_id: response.data.conversation_id
  });
});

module.exports = router;
