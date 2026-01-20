const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const chatController = require("../controllers/chat.controller");

router.post("/", auth, chatController.ask);

module.exports = router;
