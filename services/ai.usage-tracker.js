/**
 * Usage Tracking - Log token usage and estimated costs across providers
 */

const providerUtils = require("./ai.providers/utils");

class UsageTracker {
  constructor() {
    this.sessions = new Map(); // conversationId -> usage data
    this.totalUsage = {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      errorCount: 0,
      modelUsage: {}, // model -> { tokens, cost, count }
      providerUsage: {} // provider -> { tokens, cost, count, models[] }
    };
  }

  /**
   * Track a successful API call
   * @param {string} conversationId - Conversation ID
   * @param {string} model - Model name
   * @param {object} usage - Token usage { prompt_tokens, completion_tokens }
   * @param {string} provider - Provider name (openai, gemini, etc.)
   */
  trackUsage(conversationId, model, usage, provider = "openai") {
    if (!usage) return;

    const { prompt_tokens = 0, completion_tokens = 0 } = usage;
    const totalTokens = prompt_tokens + completion_tokens;

    // Calculate cost using provider utils
    const cost = providerUtils.calculateCost(
      provider,
      model,
      prompt_tokens,
      completion_tokens
    );

    // Track per conversation
    if (conversationId) {
      if (!this.sessions.has(conversationId)) {
        this.sessions.set(conversationId, {
          model,
          provider,
          totalTokens: 0,
          totalCost: 0,
          requestCount: 0,
          createdAt: Date.now()
        });
      }
      const conv = this.sessions.get(conversationId);
      conv.totalTokens += totalTokens;
      conv.totalCost += cost;
      conv.requestCount += 1;
    }

    // Track global stats
    this.totalUsage.totalTokens += totalTokens;
    this.totalUsage.totalCost += cost;
    this.totalUsage.requestCount += 1;

    // Track per model
    if (!this.totalUsage.modelUsage[model]) {
      this.totalUsage.modelUsage[model] = { tokens: 0, cost: 0, count: 0 };
    }
    this.totalUsage.modelUsage[model].tokens += totalTokens;
    this.totalUsage.modelUsage[model].cost += cost;
    this.totalUsage.modelUsage[model].count += 1;

    // Track per provider
    if (!this.totalUsage.providerUsage[provider]) {
      this.totalUsage.providerUsage[provider] = {
        tokens: 0,
        cost: 0,
        count: 0,
        models: []
      };
    }
    this.totalUsage.providerUsage[provider].tokens += totalTokens;
    this.totalUsage.providerUsage[provider].cost += cost;
    this.totalUsage.providerUsage[provider].count += 1;

    if (!this.totalUsage.providerUsage[provider].models.includes(model)) {
      this.totalUsage.providerUsage[provider].models.push(model);
    }

    // Log it
    this._logUsage(
      conversationId,
      model,
      provider,
      prompt_tokens,
      completion_tokens,
      cost
    );
  }

  /**
   * Track an error
   */
  trackError(conversationId, model, error, provider = "openai") {
    this.totalUsage.errorCount += 1;
    console.error(
      `[USAGE] Error in conversation ${conversationId} (${provider}/${model}): ${error.message}`
    );
  }

  /**
   * Log usage details
   */
  _logUsage(
    conversationId,
    model,
    provider,
    promptTokens,
    completionTokens,
    cost
  ) {
    const timestamp = new Date().toISOString();
    const providerName = providerUtils.formatProviderName(provider);
    console.log(
      `[USAGE] ${timestamp} | Conv: ${conversationId} | Provider: ${providerName} | Model: ${model} | ` +
      `Tokens: ${promptTokens}+${completionTokens}=${promptTokens + completionTokens} | ` +
      `Cost: $${cost.toFixed(5)}`
    );
  }

  /**
   * Get stats for a conversation
   */
  getConversationStats(conversationId) {
    if (!this.sessions.has(conversationId)) {
      return null;
    }
    return this.sessions.get(conversationId);
  }

  /**
   * Get global stats
   */
  getGlobalStats() {
    return {
      ...this.totalUsage,
      averageTokensPerRequest: this.totalUsage.requestCount > 0
        ? Math.round(this.totalUsage.totalTokens / this.totalUsage.requestCount)
        : 0,
      averageCostPerRequest: this.totalUsage.requestCount > 0
        ? (this.totalUsage.totalCost / this.totalUsage.requestCount).toFixed(5)
        : "0"
    };
  }

  /**
   * Get formatted report
   */
  getReport() {
    const stats = this.getGlobalStats();
    return `
📊 Usage Report
================
Total Requests: ${stats.requestCount}
Total Tokens: ${stats.totalTokens.toLocaleString()}
Total Cost: $${stats.totalCost.toFixed(2)}
Avg Tokens/Request: ${stats.averageTokensPerRequest}
Avg Cost/Request: $${stats.averageCostPerRequest}
Errors: ${stats.errorCount}

Model Breakdown:
${Object.entries(stats.modelUsage)
  .map(([model, data]) => 
    `  ${model}: ${data.count} requests, ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(2)}`
  )
  .join("\n")}
    `;
  }

  /**
   * Reset stats (for testing)
   */
  reset() {
    this.sessions.clear();
    this.totalUsage = {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      errorCount: 0,
      modelUsage: {},
      providerUsage: {}
    };
  }
}

// Singleton
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new UsageTracker();
  }
  return instance;
}

module.exports = {
  getInstance,
  UsageTracker
};
