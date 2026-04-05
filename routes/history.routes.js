const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const pool = require("../config/db");

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [conversations] = await pool.execute(
      `
      SELECT
        c.conversation_id,
        COALESCE(NULLIF(c.title, ''), CONCAT('Conversation ', c.conversation_id)) AS title,
        COALESCE(MAX(m.created_at), c.created_at) AS updated_at
      FROM conversations c
      LEFT JOIN messages m
        ON c.conversation_id = m.conversation_id
      WHERE c.user_id = ?
      GROUP BY c.conversation_id, c.title, c.created_at
      ORDER BY updated_at DESC, c.conversation_id DESC
      `,
      [userId]
    );

    res.json(conversations || []);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({
      error: "Failed to fetch conversations. Please try again."
    });
  }
});

router.get("/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.user_id;

    if (isNaN(conversationId) || Number(conversationId) <= 0) {
      return res.status(400).json({
        error: "Invalid conversation ID"
      });
    }

    const [[conversation]] = await pool.execute(
      `
      SELECT conversation_id
      FROM conversations
      WHERE conversation_id = ?
        AND user_id = ?
      `,
      [conversationId, userId]
    );

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    const [messages] = await pool.execute(
      `
      SELECT
        message_id,
        sender,
        message_text,
        created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC, message_id ASC
      `,
      [conversationId]
    );

    res.json(messages || []);
  } catch (err) {
    console.error("Error fetching conversation messages:", err);
    res.status(500).json({
      error: "Failed to fetch conversation. Please try again."
    });
  }
});

router.delete("/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.user_id;

    if (isNaN(conversationId) || Number(conversationId) <= 0) {
      return res.status(400).json({
        error: "Invalid conversation ID"
      });
    }

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
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    await pool.execute(
      `
      DELETE FROM messages
      WHERE conversation_id = ?
      `,
      [conversationId]
    );

    await pool.execute(
      `
      DELETE FROM conversations
      WHERE conversation_id = ?
      `,
      [conversationId]
    );

    res.json({
      message: "Conversation deleted",
      conversation_id: Number(conversationId)
    });
  } catch (err) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({
      error: "Failed to delete conversation. Please try again."
    });
  }
});

module.exports = router;
