/**
 * Retry Logic - Exponential backoff with configurable attempts
 */

/**
 * Execute function with exponential backoff retry
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Max retry attempts (default: 3)
 * @param {number} options.initialDelayMs - Initial delay in ms (default: 100)
 * @param {number} options.maxDelayMs - Max delay in ms (default: 5000)
 * @param {Array} options.retryableErrors - Error codes to retry on (default: ['rate_limit_error', 'timeout'])
 * @returns {Promise} Result of fn
 */
async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    retryableErrors = ["rate_limit_error", "timeout", "service_unavailable"]
  } = options;

  let lastError = null;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      
      const isRetryable = 
        retryableErrors.some(errType => err.code?.includes(errType)) ||
        retryableErrors.some(errType => err.message?.toLowerCase().includes(errType)) ||
        (err.status >= 500 && err.status < 600); // Server errors

      if (attempt === maxAttempts || !isRetryable) {
        throw err; // Give up
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * delayMs * 0.1;
      const nextDelay = Math.min(delayMs * 1.5 + jitter, maxDelayMs);
      
      console.warn(
        `⚠️  API attempt ${attempt} failed (${err.code || err.message}). ` +
        `Retrying in ${Math.round(nextDelay)}ms... (attempt ${attempt + 1}/${maxAttempts})`
      );

      await new Promise(resolve => setTimeout(resolve, nextDelay));
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
    console.warn(`⚠️  Primary function exhausted retries, trying fallback: ${err.message}`);
    return await withRetry(fallbackFn, options);
  }
}

module.exports = {
  withRetry,
  withFallback
};
