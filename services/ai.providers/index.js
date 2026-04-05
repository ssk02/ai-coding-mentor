/**
 * AI Provider Registry & Factory
 * Dynamically load and manage different AI providers (OpenAI, Gemini, etc.)
 */

const openaiAdapter = require("./openai");
const geminiAdapter = require("./gemini");

const PROVIDERS = {
  openai: openaiAdapter,
  gemini: geminiAdapter
};

/**
 * Get provider from environment variable
 * Validates and returns the appropriate adapter
 */
function getProvider() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  if (!PROVIDERS[provider]) {
    throw new Error(
      `Unsupported AI provider: "${provider}". Supported providers: ${Object.keys(
        PROVIDERS
      ).join(", ")}`
    );
  }

  return PROVIDERS[provider];
}

/**
 * Get provider name
 */
function getProviderName() {
  return (process.env.AI_PROVIDER || "openai").toLowerCase();
}

/**
 * Initialize the selected provider
 */
function initializeProvider() {
  const provider = getProvider();
  return provider.initialize();
}

/**
 * Get client for the selected provider
 */
function getClient() {
  const provider = getProvider();
  return provider.getClient();
}

/**
 * Check if provider is ready
 */
function isReady() {
  const provider = getProvider();
  return provider.isReady();
}

/**
 * Reset provider (for testing)
 */
function reset() {
  const provider = getProvider();
  if (provider.reset) {
    provider.reset();
  }
}

/**
 * Get default model for the current provider
 */
function getDefaultModel() {
  const provider = getProvider();
  return provider.getDefaultModel();
}

/**
 * Get fallback model for the current provider
 */
function getFallbackModel() {
  const provider = getProvider();
  return provider.getFallbackModel();
}

module.exports = {
  getProvider,
  getProviderName,
  initializeProvider,
  getClient,
  isReady,
  reset,
  getDefaultModel,
  getFallbackModel
};
