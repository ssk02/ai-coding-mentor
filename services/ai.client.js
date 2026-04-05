/**
 * Singleton OpenAI Client - Reuse single client instance across all requests
 * Improves efficiency and reduces object allocation
 */

const OpenAI = require("openai");

let clientInstance = null;
let isInitialized = false;

function initializeClient() {
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
    console.log("✅ OpenAI client initialized (singleton)");
    return clientInstance;
  } catch (err) {
    console.error("❌ Failed to initialize OpenAI client:", err.message);
    throw err;
  }
}

function getClient() {
  if (!isInitialized) {
    initializeClient();
  }
  return clientInstance;
}

/**
 * Check if client is properly initialized
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

module.exports = {
  initializeClient,
  getClient,
  isReady,
  reset
};
