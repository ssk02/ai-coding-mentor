import { useEffect, useRef, useState } from "react";
import API from "../services/api";

function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  const fetchConversations = async () => {
    const res = await API.get("/history");
    setConversations(res.data);
  };

  const getTypingDelay = (char) => {
    if (char === " ") return 15;
    if (/[.,!?]/.test(char)) return 80;
    return 25;
  };

  const typeAssistantReply = async (fullText) => {
    setChat((prev) => [
      ...prev,
      { sender: "assistant", text: "" }
    ]);

    for (let i = 0; i < fullText.length; i += 1) {
      const nextText = fullText.slice(0, i + 1);
      const delay = getTypingDelay(fullText[i]);

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );

      setChat((prev) => {
        if (prev.length === 0) return prev;

        const next = [...prev];
        const lastIndex = next.length - 1;

        if (
          next[lastIndex].sender === "assistant"
        ) {
          next[lastIndex] = {
            ...next[lastIndex],
            text: nextText
          };
        }

        return next;
      });
    }
  };

  const loadConversation = async (id) => {
    setActiveConvo(id);
    const res = await API.get(`/history/${id}`);
    setChat(
      res.data.map((m) => ({
        sender: m.sender,
        text: m.message_text
      }))
    );
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userText = message.trim();
    setMessage("");
    setIsLoading(true);
    setChat((prev) => [
      ...prev,
      { sender: "user", text: userText }
    ]);

    try {
      const res = await API.post("/chat", {
        message: userText,
        conversation_id: activeConvo
      });

      setActiveConvo(res.data.conversation_id);
      await typeAssistantReply(res.data.reply);

      fetchConversations();
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Sorry, I could not generate a reply."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="chat-layout">
      {isSidebarOpen && (
        <div
          className="chat-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className={`chat-sidebar ${
          isSidebarOpen ? "open" : ""
        }`}
        style={{
          minWidth: 260
        }}
      >
        <h3 className="chat-sidebar-title">
          Conversations
        </h3>

        <div className="chat-conversation-list">
          {conversations.map((c) => (
            <div
              key={c.conversation_id}
              onClick={() => loadConversation(c.conversation_id)}
              style={{
                padding: 10,
                marginBottom: 8,
                borderRadius: 6,
                cursor: "pointer",
                background:
                  activeConvo === c.conversation_id ? "#374151" : "transparent"
              }}
            >
              {c.title || `Conversation ${c.conversation_id}`}
            </div>
          ))}
        </div>

        <button
          onClick={logout}
          style={{
            marginTop: 12,
            padding: 10,
            background: "#ef4444",
            border: "none",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <div className="chat-main">
        <div className="chat-main-header">
          <button
            className="chat-menu-btn"
            onClick={() =>
              setIsSidebarOpen((prev) => !prev)
            }
          >
            Menu
          </button>
          <h2>AI Coding Mentor</h2>
        </div>

        <div className="chat-box">
          {chat.map((m, i) => {
            const isUser = m.sender === "user";

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isUser
                    ? "flex-end"
                    : "flex-start",
                  marginBottom: 10
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: isUser
                      ? "row-reverse"
                      : "row",
                    alignItems: "flex-end",
                    gap: 8,
                    maxWidth: "80%"
                  }}
                >
                  <img
                    src={
                      isUser
                        ? "https://api.dicebear.com/7.x/initials/svg?seed=User"
                        : "https://api.dicebear.com/7.x/bottts/svg?seed=Mentor"
                    }
                    alt={
                      isUser
                        ? "User avatar"
                        : "AI avatar"
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0
                    }}
                  />

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: isUser
                        ? "#2563eb"
                        : "#e5e7eb",
                      color: isUser ? "#fff" : "#000",
                      maxWidth: "70%",
                      wordBreak: "break-word"
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-bar">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Ask something..."
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc"
            }}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading}
            style={{
              padding: "12px 18px",
              background: isLoading ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
