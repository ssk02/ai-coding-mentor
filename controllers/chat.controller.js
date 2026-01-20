const pool = require("../config/db");
const aiService = require("../services/ai.service");

exports.ask = async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    const userId = req.user.user_id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // 1️⃣ Create new conversation if not provided
    let convoId = conversation_id;

    if (!convoId) {
      const [result] = await pool.execute(
        "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
        [userId, message.substring(0, 50)]
      );
      convoId = result.insertId;
    }

    // 2️⃣ Save user message
    await pool.execute(
      "INSERT INTO messages (conversation_id, sender, message_text) VALUES (?, 'user', ?)",
      [convoId, message]
    );

    // 3️⃣ Fetch user preferences
    const [[user]] = await pool.execute(
      "SELECT skill_level, preferred_language FROM users WHERE user_id = ?",
      [userId]
    );

    // 4️⃣ Ask AI
    const aiReply = await aiService.askMentor({
      prompt: message,
      skill_level: user.skill_level,
      language: user.preferred_language
    });

    // 5️⃣ Save AI reply
    await pool.execute(
      "INSERT INTO messages (conversation_id, sender, message_text) VALUES (?, 'assistant', ?)",
      [convoId, aiReply]
    );

    // 6️⃣ Respond
    res.json({
      conversation_id: convoId,
      reply: aiReply
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Conversation error" });
  }
};
