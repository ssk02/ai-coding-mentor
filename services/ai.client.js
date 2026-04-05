/**
 * AI Client Facade - Provides unified interface for different AI providers
 * Delegates to appropriate provider (OpenAI, Gemini, etc.) based on AI_PROVIDER env var
 */

const providerRegistry = require("./ai.providers");

/**
 * Initialize the selected AI provider client
 */
function initializeClient() {
  try {
    const provider = providerRegistry.getProviderName();
    providerRegistry.initializeProvider();
    console.log(`✅ ${provider.toUpperCase()} client initialized`);
    return providerRegistry.getClient();
  } catch (err) {
    console.error("❌ Failed to initialize AI client:", err.message);
    throw err;
  }
}

/**
 * Get the client for the currently selected provider
 */
function getClient() {
  return providerRegistry.getClient();
}

/**
 * Check if client is properly initialized and ready
 */
function isReady() {
  return providerRegistry.isReady();
}

/**
 * Reset client (primarily for testing)
 */
function reset() {
  providerRegistry.reset();
}

/**
 * Get the current provider name
 */
function getProviderName() {
  return providerRegistry.getProviderName();
}

/**
 * Get default model for current provider
 */
function getDefaultModel() {
  return providerRegistry.getDefaultModel();
}

/**
 * Get fallback model for current provider
 */
function getFallbackModel() {
  return providerRegistry.getFallbackModel();
}

module.exports = {
  initializeClient,
  getClient,
  isReady,
  reset,
  getProviderName,
  getDefaultModel,
  getFallbackModel
};
