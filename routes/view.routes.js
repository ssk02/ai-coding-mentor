const express = require("express");
const router = express.Router();
const axios = require("axios");

let JWT_TOKEN = null; // simple demo storage

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

router.get("/chat", (req, res) => {
    if (!JWT_TOKEN) {
    return res.redirect("/");
  }

  res.render("chat", {
    messages: [],
    conversation_id: null
  });
});


router.post("/chat", async (req, res) => {
    if (!JWT_TOKEN) {
    return res.redirect("/");
  }

  
  const { message, conversation_id } = req.body;

  const chatResponse = await axios.post(
    "http://localhost:5000/api/chat",
    { message, conversation_id },
    { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
  );

  const convoId = chatResponse.data.conversation_id;

  const history = await axios.get(
    `http://localhost:5000/api/history/${convoId}`,
    { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
  );

  res.render("chat", {
    messages: history.data,
    conversation_id: convoId
  });
});

router.post("/logout", (req, res) => {
  JWT_TOKEN = null;
  res.redirect("/");
});


module.exports = router;
