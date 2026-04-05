/**
 * Usage Tracking - Log token usage and estimated costs
 */

// OpenAI pricing per 1K tokens (as of 2024)
const PRICING = {
  "gpt-4o-mini": {
    input: 0.00015,    // $0.15 per 1M input tokens
    output: 0.0006     // $0.60 per 1M output tokens
  },
  "gpt-4o": {
    input: 0.005,      // $5 per 1M input tokens
    output: 0.015      // $15 per 1M output tokens
  },
  "gpt-3.5-turbo": {
    input: 0.0005,     // $0.50 per 1M input tokens
    output: 0.0015     // $1.50 per 1M output tokens
  }
};

class UsageTracker {
  constructor() {
    this.sessions = new Map(); // conversationId -> usage data
    this.totalUsage = {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      errorCount: 0,
      modelUsage: {} // model -> { tokens, cost, count }
    };
  }

  /**
   * Track a successful API call
   */
  trackUsage(conversationId, model, usage) {
    if (!usage) return;

    const { prompt_tokens = 0, completion_tokens = 0 } = usage;
    const totalTokens = prompt_tokens + completion_tokens;

    // Calculate cost
    const pricing = PRICING[model] || PRICING["gpt-3.5-turbo"];
    const cost = 
      (prompt_tokens * pricing.input / 1000) + 
      (completion_tokens * pricing.output / 1000);

    // Track per conversation
    if (conversationId) {
      if (!this.sessions.has(conversationId)) {
        this.sessions.set(conversationId, {
          model,
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

    if (!this.totalUsage.modelUsage[model]) {
      this.totalUsage.modelUsage[model] = { tokens: 0, cost: 0, count: 0 };
    }
    this.totalUsage.modelUsage[model].tokens += totalTokens;
    this.totalUsage.modelUsage[model].cost += cost;
    this.totalUsage.modelUsage[model].count += 1;

    // Log it
    this._logUsage(conversationId, model, prompt_tokens, completion_tokens, cost);
  }

  /**
   * Track an error
   */
  trackError(conversationId, model, error) {
    this.totalUsage.errorCount += 1;
    console.error(`[USAGE] Error in conversation ${conversationId} (${model}): ${error.message}`);
  }

  /**
   * Log usage details
   */
  _logUsage(conversationId, model, promptTokens, completionTokens, cost) {
    const timestamp = new Date().toISOString();
    console.log(
      `[USAGE] ${timestamp} | Conv: ${conversationId} | Model: ${model} | ` +
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
      modelUsage: {}
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
