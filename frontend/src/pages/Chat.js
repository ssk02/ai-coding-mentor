import { useEffect, useRef, useState } from "react";
import API from "../services/api";

const starterPrompts = [
  "Explain closures with a JavaScript example.",
  "Help me debug a React state update issue.",
  "Teach me arrays and loops like I am a beginner."
];

const toConversationSummary = (conversation) => ({
  conversation_id: conversation.conversation_id,
  title:
    conversation.title?.trim() || `Conversation ${conversation.conversation_id}`,
  updated_at: conversation.updated_at || null
});

const toChatMessage = (item) => ({
  id:
    item.message_id ||
    item.id ||
    `${item.sender}-${item.created_at || Math.random().toString(36).slice(2)}`,
  sender: item.sender,
  text: item.message_text ?? item.text ?? "",
  created_at: item.created_at || null,
  isError: Boolean(item.isError)
});

const formatTimestamp = (value) => {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [runtimeInfo, setRuntimeInfo] = useState(null);
  const [activeConvo, setActiveConvo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isFetchingConvos, setIsFetchingConvos] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const activeLoadRequestRef = useRef(0);
  const activeSendRequestRef = useRef(0);

  const activeConversation = conversations.find(
    (conversation) => conversation.conversation_id === activeConvo
  );

  const activeTitle =
    activeConversation?.title ||
    (activeConvo ? `Conversation ${activeConvo}` : "Fresh Mentoring Session");

  const providerLabel = runtimeInfo?.runtime?.provider
    ? runtimeInfo.runtime.provider.toUpperCase()
    : null;

  const modelLabel = runtimeInfo?.runtime?.model || null;

  const usageStats = runtimeInfo?.usage || null;

  const formatCompactNumber = (value) => {
    if (typeof value !== "number") return "--";
    return new Intl.NumberFormat([], {
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: value >= 1000 ? 1 : 0
    }).format(value);
  };

  const formatRuntimeSummary = () => {
    if (!runtimeInfo?.runtime) {
      return "Provider details unavailable";
    }

    const modeLabel = runtimeInfo.runtime.mode?.toUpperCase() || "UNKNOWN";
    const providerSummary = providerLabel || "UNKNOWN";
    const modelSummary = modelLabel || "Default model";
    return `${modeLabel} via ${providerSummary} • ${modelSummary}`;
  };

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      setIsFetchingConvos(true);

      try {
        const [historyResponse, metaResponse] = await Promise.all([
          API.get("/history"),
          API.get("/chat/meta").catch(() => null)
        ]);
        if (!isMounted) return;

        if (metaResponse?.data) {
          setRuntimeInfo(metaResponse.data);
        }

        const nextConversations = (historyResponse.data || []).map(
          toConversationSummary
        );
        setConversations(nextConversations);
        setError(null);

        if (nextConversations.length > 0) {
          await loadConversation(nextConversations[0].conversation_id, {
            closeSidebar: false
          });
        } else {
          setActiveConvo(null);
          setChat([]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch conversations:", err);
        setError("Failed to load conversations. Please refresh the page.");
      } finally {
        if (isMounted) {
          setIsFetchingConvos(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      activeLoadRequestRef.current += 1;
      activeSendRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isTyping]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 920) {
        setIsSidebarOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      180
    )}px`;
  }, [message]);

  const refreshConversations = async (preferredConversationId = activeConvo) => {
    const response = await API.get("/history");
    const nextConversations = (response.data || []).map(toConversationSummary);
    setConversations(nextConversations);

    const hasPreferredConversation = nextConversations.some(
      (conversation) => conversation.conversation_id === preferredConversationId
    );

    return {
      conversations: nextConversations,
      nextActiveConversationId: hasPreferredConversation
        ? preferredConversationId
        : nextConversations[0]?.conversation_id || null
    };
  };

  const refreshRuntimeInfo = async () => {
    try {
      const response = await API.get("/chat/meta");
      setRuntimeInfo(response.data);
    } catch (err) {
      console.error("Failed to fetch AI runtime info:", err);
    }
  };

  const getTypingDelay = (character) => {
    if (character === " ") return 15;
    if (/[.,!?]/.test(character)) return 80;
    return 25;
  };

  const typeAssistantReply = async (fullText, requestId) => {
    setIsTyping(true);

    const tempAssistantId = `assistant-${requestId}`;
    setChat((prev) => [...prev, { id: tempAssistantId, sender: "assistant", text: "" }]);

    for (let index = 0; index < fullText.length; index += 1) {
      if (activeSendRequestRef.current !== requestId) {
        setIsTyping(false);
        return;
      }

      const nextText = fullText.slice(0, index + 1);
      const delay = getTypingDelay(fullText[index]);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (activeSendRequestRef.current !== requestId) {
        setIsTyping(false);
        return;
      }

      setChat((prev) =>
        prev.map((entry) =>
          entry.id === tempAssistantId
            ? { ...entry, text: nextText }
            : entry
        )
      );
    }

    setIsTyping(false);
  };

  const loadConversation = async (
    conversationId,
    { closeSidebar = true, preserveError = false } = {}
  ) => {
    activeSendRequestRef.current += 1;
    setIsSending(false);
    setIsTyping(false);

    const requestId = Date.now() + Math.random();
    activeLoadRequestRef.current = requestId;
    setIsLoadingConversation(true);
    setActiveConvo(conversationId);

    if (!preserveError) {
      setError(null);
    }

    try {
      const response = await API.get(`/history/${conversationId}`);

      if (activeLoadRequestRef.current !== requestId) return;

      setChat((response.data || []).map(toChatMessage));

      if (closeSidebar && window.innerWidth <= 920) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      if (activeLoadRequestRef.current !== requestId) return;

      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation. Please try again.");
      setChat([]);
    } finally {
      if (activeLoadRequestRef.current === requestId) {
        setIsLoadingConversation(false);
      }
    }
  };

  const startNewConversation = () => {
    activeLoadRequestRef.current += 1;
    activeSendRequestRef.current += 1;
    setChat([]);
    setActiveConvo(null);
    setError(null);
    setMessage("");
    setIsSending(false);
    setIsTyping(false);
    setIsLoadingConversation(false);
    setPendingDeleteId(null);
    textareaRef.current?.focus();

    if (window.innerWidth <= 920) {
      setIsSidebarOpen(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    const selectedConversation = conversations.find(
      (conversation) => conversation.conversation_id === conversationId
    );
    const label = selectedConversation?.title || `Conversation ${conversationId}`;

    if (!window.confirm(`Delete "${label}"? This action cannot be undone.`)) {
      return;
    }

    setPendingDeleteId(conversationId);
    setError(null);

    try {
      await API.delete(`/history/${conversationId}`);

      const remainingConversations = conversations.filter(
        (conversation) => conversation.conversation_id !== conversationId
      );
      setConversations(remainingConversations);

      if (conversationId === activeConvo) {
        const nextConversationId = remainingConversations[0]?.conversation_id || null;

        if (nextConversationId) {
          await loadConversation(nextConversationId);
        } else {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError("Unable to delete conversation. Please try again.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const sendMessage = async (prefilledMessage) => {
    const nextMessage = (prefilledMessage ?? message).trim();

    if (!nextMessage || isSending) return;

    const requestId = Date.now() + Math.random();
    activeSendRequestRef.current = requestId;

    const optimisticMessage = {
      id: `user-${requestId}`,
      sender: "user",
      text: nextMessage,
      created_at: new Date().toISOString()
    };

    setMessage("");
    setIsSending(true);
    setError(null);
    setChat((prev) => [...prev, optimisticMessage]);

    try {
      const response = await API.post("/chat", {
        message: nextMessage,
        conversation_id: activeConvo
      });

      if (activeSendRequestRef.current !== requestId) return;

      const responseConversationId = response.data.conversation_id;
      setActiveConvo(responseConversationId);

      await typeAssistantReply(response.data.reply, requestId);

      if (activeSendRequestRef.current !== requestId) return;

      const { nextActiveConversationId } = await refreshConversations(
        responseConversationId
      );

      if (nextActiveConversationId) {
        await loadConversation(nextActiveConversationId, {
          closeSidebar: false,
          preserveError: true
        });
      }

      refreshRuntimeInfo();
    } catch (err) {
      if (activeSendRequestRef.current !== requestId) return;

      console.error("Chat error:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Sorry, I could not generate a reply. Please try again.";

      setChat((prev) => [
        ...prev,
        {
          id: `assistant-error-${requestId}`,
          sender: "assistant",
          text: errorMessage,
          isError: true,
          created_at: new Date().toISOString()
        }
      ]);
      setError(errorMessage);
      try {
        await refreshConversations(activeConvo);
      } catch (refreshError) {
        console.error("Failed to refresh conversations:", refreshError);
      }

      refreshRuntimeInfo();
    } finally {
      if (activeSendRequestRef.current === requestId) {
        setIsSending(false);
        setIsTyping(false);
        textareaRef.current?.focus();
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleTextareaKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSending) {
        sendMessage();
      }
    }
  };

  const renderMessageContent = (text) => {
    const segments = text.split(/```/);

    return segments.map((segment, index) => {
      const key = `${index}-${segment.slice(0, 12)}`;

      if (index % 2 === 1) {
        return (
          <pre key={key} className="chat-code-block">
            <code>{segment.replace(/^\w+\n/, "")}</code>
          </pre>
        );
      }

      return (
        <p key={key} className="chat-message-text">
          {segment}
        </p>
      );
    });
  };

  return (
    <div className="app-shell app-shell-chat">
      {isSidebarOpen && (
        <button
          type="button"
          className="chat-overlay"
          aria-label="Close conversation menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        id="conversation-sidebar"
        className={`chat-sidebar ${isSidebarOpen ? "open" : ""}`}
        aria-label="Conversation history"
      >
        <div className="chat-sidebar-top">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="chat-sidebar-title">AI Coding Mentor</h1>
          </div>

          <button type="button" className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="chat-sidebar-card">
          <div>
            <p className="sidebar-kicker">Today&apos;s focus</p>
            <h2>Ship questions faster with a cleaner learning flow.</h2>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={startNewConversation}
            disabled={isSending}
          >
            New Conversation
          </button>
        </div>

        <div className="chat-sidebar-section">
          <div className="chat-sidebar-section-header">
            <span>Conversations</span>
            <span className="sidebar-pill">{conversations.length}</span>
          </div>

          {isFetchingConvos && (
            <div className="conversation-empty-state muted" aria-live="polite">
              Loading your conversation history...
            </div>
          )}

          {!isFetchingConvos && conversations.length === 0 && (
            <div className="conversation-empty-state">
              No saved conversations yet. Start one from the button above.
            </div>
          )}

          <div className="chat-conversation-list">
            {conversations.map((conversation) => {
              const isActive = activeConvo === conversation.conversation_id;
              const isDeleting = pendingDeleteId === conversation.conversation_id;

              return (
                <div
                  key={conversation.conversation_id}
                  className={`conversation-item ${isActive ? "active" : ""}`}
                >
                  <button
                    type="button"
                    className="conversation-open"
                    onClick={() => loadConversation(conversation.conversation_id)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="conversation-copy">
                      <span className="conversation-title">
                        {conversation.title}
                      </span>
                      <span className="conversation-meta">
                        Updated {formatTimestamp(conversation.updated_at)}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="conversation-delete"
                    aria-label={`Delete ${conversation.title}`}
                    disabled={isDeleting}
                    onClick={() => deleteConversation(conversation.conversation_id)}
                  >
                    {isDeleting ? "..." : "x"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-main-header">
          <div className="chat-header-leading">
            <button
              type="button"
              className="chat-menu-btn"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-expanded={isSidebarOpen}
              aria-controls="conversation-sidebar"
            >
              Menu
            </button>

            <div>
              <p className="eyebrow">Active thread</p>
              <h2>{activeTitle}</h2>
              <p className="chat-runtime-meta">{formatRuntimeSummary()}</p>
            </div>
          </div>

          <div className="chat-header-stats">
            <div className="header-stat">
              <span className="header-stat-value">{chat.length}</span>
              <span className="header-stat-label">Messages</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{conversations.length}</span>
              <span className="header-stat-label">Threads</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">
                {formatCompactNumber(usageStats?.requestCount)}
              </span>
              <span className="header-stat-label">AI Calls</span>
            </div>
            <div className="header-stat header-stat-wide">
              <span className="header-stat-value header-stat-value-compact">
                {formatCompactNumber(usageStats?.totalTokens)}
              </span>
              <span className="header-stat-label">Tokens Used</span>
            </div>
            <div className={`header-status ${isTyping ? "typing" : ""}`}>
              {isLoadingConversation
                ? "Loading thread"
                : isTyping
                ? "Mentor is typing"
                : isSending
                ? "Sending"
                : "Ready"}
            </div>
          </div>
        </header>

        {error && (
          <div className="chat-alert" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="chat-alert-close"
              onClick={() => setError(null)}
              aria-label="Dismiss error message"
            >
              x
            </button>
          </div>
        )}

        <section className="chat-board" aria-busy={isLoadingConversation}>
          {isLoadingConversation && (
            <div className="chat-panel-state" aria-live="polite">
              Loading this conversation...
            </div>
          )}

          {!isLoadingConversation && chat.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-panel">
                <p className="eyebrow">Start here</p>
                <h3>Ask for an explanation, a debugging hand, or a study plan.</h3>
                <p>
                  The mentor keeps context inside the active conversation, so
                  each thread can stay focused on one problem at a time.
                </p>

                <div className="starter-grid">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="starter-card"
                      onClick={() => sendMessage(prompt)}
                      disabled={isSending}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : !isLoadingConversation ? (
            <div className="chat-stream">
              {chat.map((entry) => {
                const isUser = entry.sender === "user";

                return (
                  <article
                    key={entry.id}
                    className={`chat-message-row ${isUser ? "user" : "assistant"}`}
                  >
                    <div
                      className={`chat-avatar ${isUser ? "user" : "assistant"}`}
                      aria-hidden="true"
                    >
                      {isUser ? "You" : "AI"}
                    </div>

                    <div
                      className={`chat-bubble ${
                        isUser ? "user" : "assistant"
                      } ${entry.isError ? "error" : ""}`}
                    >
                      <div className="chat-bubble-meta">
                        <span className="chat-bubble-label">
                          {isUser ? "You" : entry.isError ? "Mentor error" : "Mentor"}
                        </span>
                        <span className="chat-bubble-time">
                          {formatTimestamp(entry.created_at)}
                        </span>
                      </div>
                      {renderMessageContent(entry.text)}
                    </div>
                  </article>
                );
              })}

              {isTyping && (
                <div className="typing-indicator" aria-live="polite">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span>Composing a response...</span>
                </div>
              )}
            </div>
          ) : null}

          <div ref={chatEndRef} />
        </section>

        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <div className="chat-composer-shell">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                isSending
                  ? "Sending your question..."
                  : "Ask about a bug, concept, or next step. Shift+Enter adds a line."
              }
              disabled={isSending}
              rows={1}
              className="chat-textarea"
              aria-label="Message composer"
            />

            <button
              type="submit"
              className="send-button"
              disabled={isSending || !message.trim()}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>

          <div className="chat-composer-footer">
            <span>Enter to send</span>
            <span>Shift + Enter for a new line</span>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Chat;
