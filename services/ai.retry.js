/**
 * Retry Logic - Exponential backoff with provider-aware configuration
 */

const aiClient = require("./ai.client");

/**
 * Get retry config based on current provider
 */
function getRetryConfig() {
  const provider = aiClient.getProviderName();

  const configs = {
    openai: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      retryableErrors: [
        "rate_limit_error",
        "timeout",
        "service_unavailable",
        "ERR_RATE_LIMIT",
        "429"
      ]
    },
    gemini: {
      maxAttempts: 4, // More retries for Gemini due to lower rate limits
      initialDelayMs: 200, // Higher initial delay
      maxDelayMs: 8000, // Longer max delay
      retryableErrors: [
        "RESOURCE_EXHAUSTED",
        "UNAVAILABLE",
        "DEADLINE_EXCEEDED",
        "429",
        "503",
        "timeout"
      ]
    }
  };

  return (
    configs[provider] || configs.openai
  );
}

/**
 * Execute function with exponential backoff retry
 * Uses provider-specific retry configuration
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options (overrides provider defaults)
 * @returns {Promise} Result of fn
 */
async function withRetry(fn, options = {}) {
  const config = getRetryConfig();
  const {
    maxAttempts = config.maxAttempts,
    initialDelayMs = config.initialDelayMs,
    maxDelayMs = config.maxDelayMs,
    retryableErrors = config.retryableErrors
  } = { ...config, ...options };

  let lastError = null;
  let delayMs = initialDelayMs;
  const provider = aiClient.getProviderName();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isRetryable =
        retryableErrors.some((errType) =>
          err.code?.includes(errType)
        ) ||
        retryableErrors.some((errType) =>
          err.message?.toLowerCase().includes(errType.toLowerCase())
        ) ||
        (err.status >= 500 && err.status < 600); // Server errors

      if (attempt === maxAttempts || !isRetryable) {
        throw err; // Give up
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * delayMs * 0.1;
      const nextDelay = Math.min(delayMs * 1.5 + jitter, maxDelayMs);

      console.warn(
        `⚠️  [${provider.toUpperCase()}] API attempt ${attempt} failed (${
          err.code || err.message
        }). ` +
          `Retrying in ${Math.round(nextDelay)}ms... (attempt ${
            attempt + 1
          }/${maxAttempts})`
      );

      await new Promise((resolve) => setTimeout(resolve, nextDelay));
      delayMs = nextDelay;
    }
  }

  throw lastError;
}

/**
 * Retry with fallback - try primary function, fall back to secondary if all attempts fail
 */
async function withFallback(primaryFn, fallbackFn, options = {}) {
  try {
    return await withRetry(primaryFn, options);
  } catch (err) {
    const provider = aiClient.getProviderName();
    console.warn(
      `⚠️  [${provider.toUpperCase()}] Primary function exhausted retries, trying fallback: ${err.message}`
    );
    return await withRetry(fallbackFn, options);
  }
}

module.exports = {
  withRetry,
  withFallback,
  getRetryConfig
};
