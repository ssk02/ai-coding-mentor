/**
 * Conversation Context Tracker - Maintains conversation state for multi-turn awareness
 * Used by mock mode and real mode to provide context-aware responses
 */

class ConversationContextTracker {
  constructor(ttlMs = 30 * 60 * 1000) { // 30 minute TTL
    this.conversations = new Map(); // conversationId -> { messages: [], createdAt, lastActivityAt }
    this.ttlMs = ttlMs;
    
    // Cleanup expired conversations every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Add a message to conversation history
   */
  addMessage(conversationId, sender, text) {
    if (!conversationId) return; // No tracking for new conversations

    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        messages: [],
        createdAt: Date.now(),
        lastActivityAt: Date.now()
      });
    }

    const conv = this.conversations.get(conversationId);
    conv.messages.push({
      sender,
      text,
      timestamp: Date.now()
    });
    conv.lastActivityAt = Date.now();

    // Keep only last 20 messages to avoid memory bloat
    if (conv.messages.length > 20) {
      conv.messages = conv.messages.slice(-20);
    }
  }

  /**
   * Get conversation history for context
   */
  getContext(conversationId) {
    if (!conversationId || !this.conversations.has(conversationId)) {
      return null;
    }

    const conv = this.conversations.get(conversationId);
    if (this.isExpired(conv)) {
      this.conversations.delete(conversationId);
      return null;
    }

    return conv.messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));
  }

  /**
   * Get summary of recent conversation for prompt injection
   */
  getContextSummary(conversationId, limit = 3) {
    const context = this.getContext(conversationId);
    if (!context || context.length === 0) return "";

    // Get last N messages
    const recent = context.slice(-limit);
    return recent
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content.substring(0, 100)}...`)
      .join("\n");
  }

  /**
   * Check if conversation is expired
   */
  isExpired(conv) {
    return Date.now() - conv.lastActivityAt > this.ttlMs;
  }

  /**
   * Clean up expired conversations
   */
  cleanup() {
    for (const [convId, conv] of this.conversations.entries()) {
      if (this.isExpired(conv)) {
        this.conversations.delete(convId);
      }
    }
  }

  /**
   * Clear context for a conversation (start fresh)
   */
  clearContext(conversationId) {
    this.conversations.delete(conversationId);
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      activeConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values())
        .reduce((sum, conv) => sum + conv.messages.length, 0)
    };
  }

  /**
   * Destroy tracker (cleanup interval)
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.conversations.clear();
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ConversationContextTracker();
  }
  return instance;
}

module.exports = {
  getInstance,
  ConversationContextTracker
};
