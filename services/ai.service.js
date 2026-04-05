/**
 * AI Service - Main service for mentoring interactions
 * Features: mock mode, singleton client, retry logic, usage tracking, context awareness
 */

const mockResponses = require("./ai.mock-responses");
const { getInstance: getContextTracker } = require("./ai.context-tracker");
const { getInstance: getUsageTracker } = require("./ai.usage-tracker");

// Constants for mode detection
const MOCK_MODE = process.env.AI_MODE === "mock";

if (MOCK_MODE) {
  console.log("ℹ️  Running in MOCK mode (AI_MODE=mock)");
} else {
  console.log("ℹ️  Running in LIVE mode - will use OpenAI API");
}

/**
 * Main mentor interaction endpoint
 * @param {Object} options
 * @param {string} options.prompt - User's question
 * @param {string} options.skill_level - beginner, intermediate, advanced
 * @param {string} options.language - Programming language (Python, JavaScript, etc)
 * @param {number} options.conversation_id - For context tracking
 * @returns {Promise<string>} Mentor response
 */
exports.askMentor = async ({ prompt, skill_level, language, conversation_id }) => {
  const contextTracker = getContextTracker();
  const usageTracker = getUsageTracker();

  try {
    // Use mock mode if configured
    if (MOCK_MODE) {
      return generateMockResponse(prompt, skill_level, language, conversation_id);
    }

    // Real API call
    return await generateRealResponse(
      prompt,
      skill_level,
      language,
      conversation_id,
      contextTracker,
      usageTracker
    );
  } catch (err) {
    console.error("❌ AI Service error:", err.message);
    usageTracker.trackError(conversation_id, "gpt-4o-mini", err);

    // Graceful fallback to mock on error
    console.warn("⚠️  Falling back to mock response due to API error");
    const fallbackResponse = generateMockResponse(prompt, skill_level, language, conversation_id);
    return `[API ERROR - MOCK FALLBACK]\n\n${fallbackResponse}`;
  }
};

/**
 * Generate mock response with enhanced features
 */
function generateMockResponse(prompt, skill_level, language, conversation_id) {
  // Detect topic and language
  const topic = mockResponses.detectTopic(prompt);
  const detectedLanguage = mockResponses.detectLanguage(language, prompt);

  // Simulate realistic delay
  const delay = mockResponses.getRealisticDelay();

  // Simulate error (if enabled)
  if (mockResponses.shouldSimulateError(process.env.LLM_ERROR_SIMULATION === "true")) {
    throw new Error("[MOCK ERROR SIMULATION] Simulated API failure for testing");
  }

  // Generate response
  const response = mockResponses.generateMockResponse(topic, skill_level, detectedLanguage);

  // Track in context (for future conversation awareness)
  const contextTracker = getContextTracker();
  if (conversation_id) {
    contextTracker.addMessage(conversation_id, "assistant", response);
  }

  return response;
}

/**
 * Generate real response using OpenAI API with retry logic
 */
async function generateRealResponse(
  prompt,
  skill_level,
  language,
  conversation_id,
  contextTracker,
  usageTracker
) {
  // Lazy-load live mode dependencies
  const { getClient, initializeClient: initClient } = require("./ai.client");
  const { withRetry, withFallback } = require("./ai.retry");

  // Initialize client on first use
  try {
    initClient();
  } catch (err) {
    console.error("❌ Failed to initialize OpenAI client:", err.message);
    throw err;
  }

  const client = getClient();
  if (!client) {
    throw new Error("OpenAI client not initialized");
  }

  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  // Build conversation context
  const conversationContext = contextTracker.getContext(conversation_id);
  const contextSummary = contextTracker.getContextSummary(conversation_id);

  const systemPrompt = `You are a senior software engineer and coding mentor.
User skill level: ${skill_level}
Preferred programming language: ${language}

${contextSummary ? `Recent conversation context:\n${contextSummary}\n` : ""}

Rules:
- Explain concepts step by step
- Use simple language
- Give a small example in ${language}
- End with a short practice task
- Keep responses concise (under 500 words)`;

  // Build messages including conversation history
  const messages = conversationContext
    ? [...conversationContext, { role: "user", content: prompt }]
    : [{ role: "user", content: prompt }];

  // Execute with retry logic, including fallback
  const response = await withFallback(
    () =>
      withRetry(() =>
        client.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      ),
    // Fallback: try cheaper model if primary fails
    () =>
      withRetry(() =>
        client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      )
  );

  // Extract and track response
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI API");
  }

  // Track usage
  usageTracker.trackUsage(conversation_id, model, response.usage);

  // Store in context for future messages
  if (conversation_id) {
    contextTracker.addMessage(conversation_id, "user", prompt);
    contextTracker.addMessage(conversation_id, "assistant", content);
  }

  return content;
}

/**
 * Get usage statistics
 */
exports.getUsageStats = () => {
  const usageTracker = getUsageTracker();
  return usageTracker.getGlobalStats();
};

/**
 * Get usage report
 */
exports.getUsageReport = () => {
  const usageTracker = getUsageTracker();
  return usageTracker.getReport();
};

/**
 * Reset context for a conversation (start fresh)
 */
exports.resetConversation = (conversation_id) => {
  const contextTracker = getContextTracker();
  contextTracker.clearContext(conversation_id);
  console.log(`✅ Cleared context for conversation ${conversation_id}`);
};

/**
 * Get conversation context (for debugging)
 */
exports.getConversationContext = (conversation_id) => {
  const contextTracker = getContextTracker();
  return contextTracker.getContext(conversation_id);
};
