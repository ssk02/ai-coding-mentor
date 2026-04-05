const pool = require("../config/db");
const aiService = require("../services/ai.service");


// 🔹 Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .substring(0, 5000)  // max 5000 chars
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");  // remove control chars
};

// 🔹 Title generator function
const generateTitle = (message) => {
  if (!message) return "New Conversation";

  return message
    .substring(0, 40)     // limit length
    .replace(/\n/g, " ")  // remove line breaks
    .trim();
};


exports.ask = async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    const userId = req.user.user_id;

    // Validate input
    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      return res
        .status(400)
        .json({ error: "Message cannot be empty or too long (max 5000 chars)" });
    }

    if (typeof conversation_id !== "number" && conversation_id !== null && conversation_id !== undefined) {
      return res
        .status(400)
        .json({ error: "Invalid conversation_id format" });
    }

    // 1️⃣ Create new conversation if not provided
    let convoId = conversation_id;

    if (!convoId) {
      const title = generateTitle(cleanMessage);

      try {
        const [result] = await pool.execute(
          `INSERT INTO conversations (user_id, title)
           VALUES (?, ?)`,
          [userId, title]
        );
        convoId = result.insertId;
      } catch (dbErr) {
        console.error("Database error creating conversation:", dbErr);
        return res.status(500).json({ 
          error: "Failed to create conversation. Please try again." 
        });
      }
    }

    // 2️⃣ Save user message
    try {
      await pool.execute(
        `INSERT INTO messages
         (conversation_id, sender, message_text)
         VALUES (?, 'user', ?)`,
        [convoId, cleanMessage]
      );
    } catch (dbErr) {
      console.error("Database error saving user message:", dbErr);
      return res.status(500).json({ 
        error: "Failed to save your message. Please try again." 
      });
    }

    // 3️⃣ Fetch user preferences
    let user;
    try {
      const [[userData]] = await pool.execute(
        `SELECT skill_level, preferred_language
         FROM users
         WHERE user_id = ?`,
        [userId]
      );
      if (!userData) {
        return res.status(404).json({ 
          error: "User profile not found." 
        });
      }
      user = userData;
    } catch (dbErr) {
      console.error("Database error fetching user:", dbErr);
      return res.status(500).json({ 
        error: "Failed to fetch your profile. Please try again." 
      });
    }

    // 4️⃣ Ask AI (pass conversation_id for context awareness)
    let aiReply;
    try {
      aiReply = await aiService.askMentor({
        prompt: cleanMessage,
        skill_level: user.skill_level,
        language: user.preferred_language,
        conversation_id: convoId  // NEW: for context tracking
      });
    } catch (aiErr) {
      console.error("AI service error:", aiErr);
      return res.status(503).json({ 
        error: "AI service temporarily unavailable. Please try again." 
      });
    }

    // 5️⃣ Save AI reply
    try {
      await pool.execute(
        `INSERT INTO messages
         (conversation_id, sender, message_text)
         VALUES (?, 'assistant', ?)`,
        [convoId, aiReply]
      );
    } catch (dbErr) {
      console.error("Database error saving AI reply:", dbErr);
      // Still return the reply since it was generated, but log the error
      return res.status(500).json({ 
        error: "Response generated but failed to save. Conversation may be incomplete.",
        conversation_id: convoId,
        reply: aiReply
      });
    }

    // 6️⃣ Respond
    res.json({
      conversation_id: convoId,
      reply: aiReply
    });

  } catch (err) {
    console.error("Unexpected error in ask controller:", err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again."
    });
  }
};
