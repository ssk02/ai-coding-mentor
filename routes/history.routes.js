const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const pool = require("../config/db");

router.get("/:conversationId", auth, async (req, res) => {
  const { conversationId } = req.params;

  const [messages] = await pool.execute(
    "SELECT sender, message_text FROM messages WHERE conversation_id = ? ORDER BY created_at",
    [conversationId]
  );

  res.json(messages);
});

module.exports = router;
