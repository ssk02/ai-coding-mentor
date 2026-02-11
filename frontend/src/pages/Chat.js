import { useState, useEffect, useRef } from "react";
import API from "../services/api";

function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);

  // 🔹 Auto-scroll ref
  const chatEndRef = useRef(null);

  // 🔹 Auto-scroll effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [chat]);

  // 🔹 Load conversation list
  const fetchConversations = async () => {
    const res = await API.get("/history");
    setConversations(res.data);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 🔹 Send message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const res = await API.post("/chat", {
      message,
      conversation_id: activeConvo
    });

    setActiveConvo(res.data.conversation_id);

    setChat([
      ...chat,
      { sender: "user", text: message },
      { sender: "assistant", text: res.data.reply }
    ]);

    setMessage("");
  };

  // 🔹 Load conversation history
  const loadConversation = async (id) => {
    setActiveConvo(id);

    const res = await API.get(`/history/${id}`);

    setChat(
      res.data.map((m) => ({
        sender: m.sender,
        text: m.message_text
      }))
    );
  };

  // 🔹 Delete conversation
  const deleteConversation = async (id) => {
    await API.delete(`/history/${id}`);

    // Refresh sidebar
    fetchConversations();

    // Clear chat if active convo deleted
    if (activeConvo === id) {
      setChat([]);
      setActiveConvo(null);
    }
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* Sidebar */}
      <div
        style={{
          width: "25%",
          borderRight: "1px solid #ccc",
          padding: 10,
          overflowY: "auto"
        }}
      >
        <h3>Conversations</h3>

        {conversations.map((c) => (
          <div
            key={c.conversation_id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 6,
              background:
                activeConvo === c.conversation_id
                  ? "#e5e5ea"
                  : "transparent"
            }}
          >
            <span
              onClick={() =>
                loadConversation(c.conversation_id)
              }
              style={{ cursor: "pointer" }}
            >
              {c.title ||
                `Conversation ${c.conversation_id}`}
            </span>

            <button
              onClick={() =>
                deleteConversation(
                  c.conversation_id
                )
              }
              style={{
                background: "red",
                color: "white",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px"
              }}
            >
              X
            </button>
          </div>
        ))}

        <button
          onClick={logout}
          style={{ marginTop: 10 }}
        >
          Logout
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ width: "75%", padding: 10 }}>
        <h2>AI Coding Mentor</h2>

        {/* Scrollable Chat Box */}
        <div
          style={{
            height: "400px",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            background: "#f9f9f9"
          }}
        >
          {chat.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign:
                  m.sender === "user"
                    ? "right"
                    : "left",
                margin: "8px 0"
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background:
                    m.sender === "user"
                      ? "#007bff"
                      : "#e5e5ea",
                  color:
                    m.sender === "user"
                      ? "#fff"
                      : "#000",
                  maxWidth: "70%"
                }}
              >
                {m.text}
              </span>
            </div>
          ))}

          {/* Auto-scroll anchor */}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Area */}
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Ask something..."
          style={{ width: "80%", padding: 8 }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: 8,
            marginLeft: 5
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
