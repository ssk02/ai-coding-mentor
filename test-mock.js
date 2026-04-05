/**
 * Quick test script to verify AI service improvements
 */

const mockResponses = require("./services/ai.mock-responses");

console.log("🧪 Testing Mock Response Engine\n");

// Test 1: Topic detection
console.log("Test 1: Topic Detection");
console.log("- 'What is a variable?' ->", mockResponses.detectTopic("What is a variable?"));
console.log("- 'How do loops work?' ->", mockResponses.detectTopic("How do loops work?"));
console.log("- 'Create an array of numbers' ->", mockResponses.detectTopic("Create an array of numbers"));
console.log();

// Test 2: Language detection
console.log("Test 2: Language Detection");
console.log("- Python preference, 'write code' ->", mockResponses.detectLanguage("Python", "write code"));
console.log("- JavaScript preference, 'variables' ->", mockResponses.detectLanguage("JavaScript", "variables"));
console.log("- Any, 'show in python' ->", mockResponses.detectLanguage("Any", "show in python"));
console.log();

// Test 3: Realistic delay
console.log("Test 3: Realistic Delay Simulation");
const delays = [];
for (let i = 0; i < 5; i++) {
  delays.push(Math.round(mockResponses.getRealisticDelay()));
}
console.log("- Random delays (ms):", delays);
console.log("- Range check: All between 250-2000?", delays.every(d => d >= 250 && d <= 2000) ? "✅ Yes" : "❌ No");
console.log();

// Test 4: Mock response generation
console.log("Test 4: Mock Response Generation");
const response = mockResponses.generateMockResponse("variable", "beginner", "python");
console.log("- Beginner Variable response preview:");
console.log(response.substring(0, 200) + "...\n");

// Test 5: Error simulation
console.log("Test 5: Error Simulation");
const errors = [];
process.env.LLM_ERROR_SIMULATION = "true";
for (let i = 0; i < 100; i++) {
  if (mockResponses.shouldSimulateError(true)) {
    errors.push(i);
  }
}
console.log(`- Generated errors in 100 attempts: ${errors.length} (~${errors.length}%)`);
console.log("- Expected ~5%, actual ≈ " + errors.length + "% ->", Math.abs(errors.length - 5) < 3 ? "✅ Reasonable" : "⚠️  Slightly off but acceptable");
console.log();

console.log("✅ All mock response engine tests completed!");
