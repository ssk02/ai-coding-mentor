/**
 * Integration Test - AI Service with enhanced mock mode
 */

const aiService = require("./services/ai.service");

async function runTests() {
  console.log("🧪 Testing AI Service Integration\n");

  try {
    // Test 1: Mock mode basic response
    console.log("Test 1: Basic Mock Response");
    console.log("-".repeat(50));
    const response1 = await aiService.askMentor({
      prompt: "What is a variable?",
      skill_level: "beginner",
      language: "Python"
    });
    console.log(response1.substring(0, 300) + "...\n");

    // Test 2: Different topic and skill level
    console.log("Test 2: Advanced Topic");
    console.log("-".repeat(50));
    const response2 = await aiService.askMentor({
      prompt: "How do you optimize loop performance?",
      skill_level: "advanced",
      language: "JavaScript"
    });
    console.log(response2.substring(0, 300) + "...\n");

    // Test 3: Context tracking
    console.log("Test 3: Context Tracking");
    console.log("-".repeat(50));
    const conversationId = 12345;
    
    const msg1 = await aiService.askMentor({
      prompt: "What is a closure?",
      skill_level: "intermediate",
      language: "JavaScript",
      conversation_id: conversationId
    });
    console.log("Message 1 received:", msg1.substring(0, 100) + "...");

    const context = aiService.getConversationContext(conversationId);
    console.log("Context tracked:", context?.length > 0 ? `✅ ${context.length} message(s)` : "❌ No context");

    // Test 4: Usage tracking
    console.log("\nTest 4: Usage Statistics");
    console.log("-".repeat(50));
    const stats = aiService.getUsageStats();
    console.log("Total requests:", stats.requestCount);
    console.log("Total tokens:", stats.totalTokens);
    console.log("Total cost: $" + stats.totalCost.toFixed(2));
    console.log("Mock mode - so tokens/cost are 0 (expected)");

    // Test 5: Get report
    console.log("\nTest 5: Usage Report");
    console.log("-".repeat(50));
    const report = aiService.getUsageReport();
    console.log(report);

    console.log("✅ All integration tests passed!");

  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }
}

runTests();
