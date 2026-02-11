import { useState } from "react";
import API from "../services/api";

function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    const res = await API.post("/chat", { message });

    setChat([
      ...chat,
      { sender: "user", text: message },
      { sender: "assistant", text: res.data.reply }
    ]);

    setMessage("");
  };

  return (
    <div>
      <h2>AI Coding Mentor</h2>

      <div>
        {chat.map((m, i) => (
          <p key={i}>
            <b>{m.sender}:</b> {m.text}
          </p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
