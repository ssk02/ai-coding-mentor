/**
 * Shared Utilities for AI Providers
 * Helper functions for pricing, message conversion, and provider detection
 */

/**
 * Provider-specific pricing configuration
 */
const PRICING = {
  openai: {
    "gpt-4o-mini": {
      input: 0.00015, // $0.15 per 1M input tokens
      output: 0.0006 // $0.60 per 1M output tokens
    },
    "gpt-4o": {
      input: 0.005, // $5 per 1M input tokens
      output: 0.015 // $15 per 1M output tokens
    },
    "gpt-3.5-turbo": {
      input: 0.0005, // $0.50 per 1M input tokens
      output: 0.0015 // $1.50 per 1M output tokens
    }
  },
  gemini: {
    "gemini-2.5-flash": {
      input: 0.0003, // $0.30 per 1M input tokens (paid tier)
      output: 0.0025 // $2.50 per 1M output tokens (paid tier)
    },
    "gemini-2.5-flash-lite": {
      input: 0.0001, // $0.10 per 1M input tokens (paid tier)
      output: 0.0004 // $0.40 per 1M output tokens (paid tier)
    },
    "gemini-2.5-pro": {
      input: 0.00125, // $1.25 per 1M input tokens <= 200k prompt (paid tier)
      output: 0.01 // $10.00 per 1M output tokens <= 200k prompt (paid tier)
    }
  }
};

/**
 * Get pricing for a specific provider and model
 */
function getPricing(provider, model) {
  const providerPricing = PRICING[provider] || PRICING.openai;
  return (
    providerPricing[model] ||
    providerPricing[Object.keys(providerPricing)[0]]
  );
}

/**
 * Calculate cost based on tokens and pricing
 */
function calculateCost(provider, model, promptTokens, completionTokens) {
  const pricing = getPricing(provider, model);
  if (!pricing) return 0;

  const inputCost = (promptTokens * pricing.input) / 1000;
  const outputCost = (completionTokens * pricing.output) / 1000;
  return inputCost + outputCost;
}

/**
 * Provider-specific rate limit configs
 */
const RATE_LIMITS = {
  openai: {
    requestsPerMinute: 3500,
    tokensPerMinute: 200000
  },
  gemini: {
    requestsPerMinute: 10, // Free tier limit
    tokensPerMinute: 1000000
  }
};

/**
 * Get rate limit for provider
 */
function getRateLimit(provider) {
  return RATE_LIMITS[provider] || RATE_LIMITS.openai;
}

/**
 * Get maximum batch size based on rate limits
 */
function getMaxConcurrentRequests(provider) {
  const limit = getRateLimit(provider);
  // Conservative: allow 10% of per-minute limit
  return Math.max(1, Math.floor(limit.requestsPerMinute / 10));
}

/**
 * Format provider name for display
 */
function formatProviderName(provider) {
  const names = {
    openai: "OpenAI",
    gemini: "Google Gemini"
  };
  return names[provider] || provider.toUpperCase();
}

/**
 * Validate provider configuration
 */
function validateProviderConfig(provider) {
  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is required");
      }
      break;
    case "gemini":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error(
          "GOOGLE_GENERATIVE_AI_API_KEY environment variable is required"
        );
      }
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

module.exports = {
  PRICING,
  RATE_LIMITS,
  getPricing,
  calculateCost,
  getRateLimit,
  getMaxConcurrentRequests,
  formatProviderName,
  validateProviderConfig
};
