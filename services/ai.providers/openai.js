/**
 * OpenAI Provider Adapter
 * Encapsulates OpenAI client initialization and API call logic
 */

const OpenAI = require("openai");

let clientInstance = null;
let isInitialized = false;

/**
 * Initialize OpenAI client
 */
function initialize() {
  if (isInitialized) return clientInstance;

  // Skip initialization for mock mode
  if (process.env.AI_MODE === "mock") {
    isInitialized = true;
    console.log("ℹ️  Skipping OpenAI client init (mock mode)");
    return null;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set in .env");
    throw new Error("OpenAI API key not configured");
  }

  try {
    clientInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    isInitialized = true;
    console.log("✅ OpenAI client initialized");
    return clientInstance;
  } catch (err) {
    console.error("❌ Failed to initialize OpenAI client:", err.message);
    throw err;
  }
}

/**
 * Get OpenAI client
 */
function getClient() {
  if (!isInitialized) {
    initialize();
  }
  return clientInstance;
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
  isInitialized = false;
}

/**
 * Get default model for OpenAI
 */
function getDefaultModel() {
  return process.env.LLM_MODEL || "gpt-4o-mini";
}

/**
 * Get fallback model for OpenAI
 */
function getFallbackModel() {
  return "gpt-3.5-turbo";
}

/**
 * Execute API call with OpenAI
 */
async function executeCall(params) {
  const client = getClient();
  if (!client) {
    throw new Error("OpenAI client not initialized");
  }

  const response = await client.chat.completions.create(params);
  return response;
}

/**
 * Parse response from OpenAI
 */
function parseResponse(response) {
  return {
    text: response.choices[0]?.message?.content || "",
    usage: response.usage,
    model: response.model
  };
}

/**
 * Extract usage info from response
 */
function extractUsage(response) {
  return {
    prompt_tokens: response.usage?.prompt_tokens || 0,
    completion_tokens: response.usage?.completion_tokens || 0
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
  extractUsage
};
