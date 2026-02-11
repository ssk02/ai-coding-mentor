const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const pool = require("../config/db");


// 🔹 1️⃣ Get all conversations (sorted by last activity)
router.get("/", auth, async (req, res) => {
  const userId = req.user.user_id;

  const [conversations] = await pool.execute(
    `
    SELECT
      c.conversation_id,
      c.title,
      MAX(m.created_at) AS last_activity
    FROM conversations c
    LEFT JOIN messages m
      ON c.conversation_id = m.conversation_id
    WHERE c.user_id = ?
    GROUP BY c.conversation_id
    ORDER BY last_activity DESC
    `,
    [userId]
  );

  res.json(conversations);
});


// 🔹 2️⃣ Get messages of one conversation (with timestamps)
router.get("/:conversationId", auth, async (req, res) => {
  const { conversationId } = req.params;

  const [messages] = await pool.execute(
    `
    SELECT
      sender,
      message_text,
      created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at
    `,
    [conversationId]
  );

  res.json(messages);
});


// 🔹 3️⃣ Delete conversation
router.delete("/:conversationId", auth, async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.user_id;

  // Ensure ownership
  const [[convo]] = await pool.execute(
    `
    SELECT conversation_id
    FROM conversations
    WHERE conversation_id = ?
    AND user_id = ?
    `,
    [conversationId, userId]
  );

  if (!convo) {
    return res.status(403).json({
      message: "Unauthorized"
    });
  }

  // Delete messages first
  await pool.execute(
    `
    DELETE FROM messages
    WHERE conversation_id = ?
    `,
    [conversationId]
  );

  // Delete conversation
  await pool.execute(
    `
    DELETE FROM conversations
    WHERE conversation_id = ?
    `,
    [conversationId]
  );

  res.json({
    message: "Conversation deleted"
  });
});


module.exports = router;