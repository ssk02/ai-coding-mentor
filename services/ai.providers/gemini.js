/**
 * Google Gemini Provider Adapter
 * Encapsulates Gemini client initialization and API call logic
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

let clientInstance = null;
let modelInstances = new Map();
let isInitialized = false;

/**
 * Initialize Gemini client
 */
function initialize() {
  if (isInitialized) return clientInstance;

  // Skip initialization for mock mode
  if (process.env.AI_MODE === "mock") {
    isInitialized = true;
    console.log("ℹ️  Skipping Gemini client init (mock mode)");
    return null;
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY not set in .env");
    throw new Error("Google Generative AI API key not configured");
  }

  try {
    clientInstance = new GoogleGenerativeAI(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
    );
    isInitialized = true;
    console.log("✅ Gemini client initialized");
    return clientInstance;
  } catch (err) {
    console.error("❌ Failed to initialize Gemini client:", err.message);
    throw err;
  }
}

/**
 * Get Gemini client
 */
function getClient() {
  if (!isInitialized) {
    initialize();
  }
  return clientInstance;
}

/**
 * Get or initialize model instance
 */
function getModel() {
  return getModelForName(getDefaultModel());
}

/**
 * Get or initialize model instance for a specific model name
 */
function getModelForName(modelName, systemInstruction = "") {
  const client = getClient();
  if (!client) {
    throw new Error("Gemini client not initialized");
  }

  const resolvedModelName = normalizeGeminiModelName(modelName);
  const cacheKey = `${resolvedModelName}::${systemInstruction}`;

  if (!modelInstances.has(cacheKey)) {
    const modelConfig = { model: resolvedModelName };
    const builtInstruction = buildSystemInstruction(systemInstruction);

    if (builtInstruction) {
      modelConfig.systemInstruction = builtInstruction;
    }

    modelInstances.set(cacheKey, client.getGenerativeModel(modelConfig));
  }

  return modelInstances.get(cacheKey);
}

/**
 * Check if client is ready
 */
function isReady() {
  return isInitialized && clientInstance !== null;
}

/**
 * Reset client (for testing)
 */
function reset() {
  clientInstance = null;
  modelInstances = new Map();
  isInitialized = false;
}

/**
 * Get default model for Gemini
 */
function getDefaultModel() {
  return normalizeGeminiModelName(process.env.LLM_MODEL);
}

/**
 * Get fallback model for Gemini
 */
function getFallbackModel() {
  return "gemini-2.5-flash-lite";
}

/**
 * Convert OpenAI message format to Gemini format
 */
function convertMessagesToGemini(messages) {
  return messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));
}

/**
 * Build system instruction for Gemini
 */
function buildSystemInstruction(systemPrompt) {
  if (!systemPrompt) {
    return undefined;
  }

  return {
    role: "system",
    parts: [{ text: systemPrompt }]
  };
}

/**
 * Ensure the configured model name is a Gemini model.
 * Falls back to gemini-2.5-flash if a different provider's model is configured.
 */
function normalizeGeminiModelName(modelName) {
  if (!modelName) {
    return "gemini-2.5-flash";
  }

  const normalized = modelName.trim();
  if (/^models\/gemini/i.test(normalized) || /^gemini/i.test(normalized)) {
    return normalized.replace(/^models\//i, "");
  }

  console.warn(
    `Invalid Gemini model "${modelName}" configured. Falling back to gemini-2.5-flash.`
  );
  return "gemini-2.5-flash";
}

/**
 * Execute API call with Gemini
 */
async function executeCall(params) {
  // Extract params
  const { messages, max_tokens, temperature, system_prompt } = params;
  const model = getModelForName(
    params.model || getDefaultModel(),
    system_prompt || ""
  );

  // Convert messages format
  const geminiMessages = convertMessagesToGemini(messages);

  // Build request config
  const generationConfig = {
    maxOutputTokens: max_tokens || 1000,
    temperature: temperature || 0.7
  };

  try {
    let response;

    if (geminiMessages.length === 0) {
      // No conversation history, just send the content
      response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: system_prompt || "" }]
          }
        ],
        generationConfig
      });
    } else {
      // Use chat session for conversation history
      const chatSession = model.startChat({
        history: geminiMessages.slice(0, -1)
      });

      const userMessage = geminiMessages[geminiMessages.length - 1];
      response = await chatSession.sendMessage(userMessage.parts[0].text, {
        generationConfig
      });
    }

    return response;
  } catch (err) {
    console.error("❌ Gemini API error:", err.message);
    throw err;
  }
}

/**
 * Parse response from Gemini
 */
function parseResponse(response) {
  const text =
    response.response?.text?.() || response.response?.text || "";
  return {
    text: text,
    usage: response.response?.usageMetadata || null,
    model: response.response?.modelVersion || response.response?.model || null
  };
}

/**
 * Extract usage info from response
 */
function extractUsage(response) {
  const usageMetadata = response.response?.usageMetadata;
  return {
    prompt_tokens: usageMetadata?.promptTokenCount || 0,
    completion_tokens: usageMetadata?.candidatesTokenCount || 0
  };
}

module.exports = {
  initialize,
  getClient,
  isReady,
  reset,
  getDefaultModel,
  getFallbackModel,
  executeCall,
  parseResponse,
  extractUsage,
  convertMessagesToGemini,
  buildSystemInstruction
};
