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
  console.log("Running in MOCK mode (AI_MODE=mock)");
} else {
  console.log("Running in LIVE mode - will use configured AI provider");
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
    if (MOCK_MODE) {
      return generateMockResponse(prompt, skill_level, language, conversation_id);
    }

    return await generateRealResponse(
      prompt,
      skill_level,
      language,
      conversation_id,
      contextTracker,
      usageTracker
    );
  } catch (err) {
    console.error("AI Service error:", err.message);
    usageTracker.trackError(
      conversation_id,
      process.env.LLM_MODEL || "unknown",
      err,
      MOCK_MODE ? "mock" : getLiveProviderName()
    );

    console.warn("Falling back to mock response due to API error");
    const fallbackResponse = generateMockResponse(
      prompt,
      skill_level,
      language,
      conversation_id
    );
    return `[API ERROR - MOCK FALLBACK]\n\n${fallbackResponse}`;
  }
};

/**
 * Generate mock response with enhanced features
 */
function generateMockResponse(prompt, skill_level, language, conversation_id) {
  const topic = mockResponses.detectTopic(prompt);
  const detectedLanguage = mockResponses.detectLanguage(language, prompt);

  if (
    mockResponses.shouldSimulateError(
      process.env.LLM_ERROR_SIMULATION === "true"
    )
  ) {
    throw new Error("[MOCK ERROR SIMULATION] Simulated API failure for testing");
  }

  const response = mockResponses.generateMockResponse(
    topic,
    skill_level,
    detectedLanguage
  );

  const contextTracker = getContextTracker();
  if (conversation_id) {
    contextTracker.addMessage(conversation_id, "assistant", response);
  }

  return response;
}

/**
 * Generate real response using AI API with retry logic
 * Supports multiple providers (OpenAI, Gemini, etc.) via provider abstraction
 */
async function generateRealResponse(
  prompt,
  skill_level,
  language,
  conversation_id,
  contextTracker,
  usageTracker
) {
  const aiClient = require("./ai.client");
  const { withRetry, withFallback } = require("./ai.retry");

  try {
    aiClient.initializeClient();
  } catch (err) {
    console.error("Failed to initialize AI client:", err.message);
    throw err;
  }

  const provider = aiClient.getProviderName();
  const selectedProvider = require(`./ai.providers/${provider}`);
  const client = aiClient.getClient();

  if (!client) {
    throw new Error("AI client not initialized");
  }

  const model = aiClient.getDefaultModel();
  const fallbackModel = aiClient.getFallbackModel();
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

  const messages = conversationContext
    ? [...conversationContext, { role: "user", content: prompt }]
    : [{ role: "user", content: prompt }];

  const apiParams = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 1000,
    temperature: 0.7,
    system_prompt: systemPrompt
  };

  const response = await withFallback(
    () => withRetry(() => selectedProvider.executeCall(apiParams)),
    () => {
      const fallbackParams = {
        ...apiParams,
        model: fallbackModel
      };
      return withRetry(() => selectedProvider.executeCall(fallbackParams));
    }
  );

  const parsedResponse = selectedProvider.parseResponse(response);
  const content = parsedResponse.text;
  const responseModel = parsedResponse.model || model;

  if (!content) {
    throw new Error(`Empty response from ${provider} API`);
  }

  const usage = selectedProvider.extractUsage(response);
  usageTracker.trackUsage(conversation_id, responseModel, usage, provider);

  if (conversation_id) {
    contextTracker.addMessage(conversation_id, "user", prompt);
    contextTracker.addMessage(conversation_id, "assistant", content);
  }

  return content;
}

function getLiveProviderName() {
  return (process.env.AI_PROVIDER || "openai").toLowerCase();
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
 * Get active AI runtime info for display/debugging
 */
exports.getRuntimeInfo = () => {
  const aiClient = require("./ai.client");

  return {
    mode: MOCK_MODE ? "mock" : "live",
    provider: getLiveProviderName(),
    model: aiClient.getDefaultModel()
  };
};

/**
 * Reset context for a conversation (start fresh)
 */
exports.resetConversation = (conversation_id) => {
  const contextTracker = getContextTracker();
  contextTracker.clearContext(conversation_id);
  console.log(`Cleared context for conversation ${conversation_id}`);
};

/**
 * Get conversation context (for debugging)
 */
exports.getConversationContext = (conversation_id) => {
  const contextTracker = getContextTracker();
  return contextTracker.getContext(conversation_id);
};
