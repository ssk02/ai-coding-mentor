/**
 * Mock Response Engine - Provides realistic mock AI responses for development/testing
 * Features: skill-level adaptation, language-specific code, context awareness, realistic delays
 */

const mockTopics = {
  // Variables & Data Types
  "variable": {
    beginner: {
      explanation: "A variable is a named container that stores data in your program. Think of it like a labeled box that holds information you want to use later.",
      examples: {
        python: `name = "Alice"
age = 25
print(f"Hello {name}, you are {age} years old")`,
        javascript: `let name = "Alice";
let age = 25;
console.log(\`Hello \${name}, you are \${age} years old\`);`,
        java: `String name = "Alice";
int age = 25;
System.out.println("Hello " + name + ", you are " + age + " years old");`
      },
      practice: "Create two variables: one for your name and one for your age. Print them together in a sentence."
    },
    intermediate: {
      explanation: "Variables in memory have scope and lifetime. Stack-allocated variables are fast but limited, heap-allocated provide flexibility. Variable binding determines when types are checked.",
      examples: {
        python: `# Dynamic typing with duck typing
x = 5          # int
x = "string"   # now string - type changes at runtime
def process(var):
    return var * 2  # works with int, str, list
`,
        javascript: `// Variable hoisting and temporal dead zone
console.log(x);  // ReferenceError: cannot access x before initialization
let x = 5;
var y = 10;      // hoisted to top, undefined before assignment
`
      },
      practice: "Explain the difference between const, let, and var in JavaScript. When would you use each?"
    },
    advanced: {
      explanation: "Variable semantics involve reference vs value binding, mutability guarantees, and memory model implications. Consider lifetime analysis (RAII), borrowing rules (Rust), or garbage collection overhead.",
      examples: {
        python: `# Variable capture in closures - reference vs value
funcs = []
for i in range(3):
    funcs.append(lambda x: x + i)  # All capture 'i' by reference
# This is a common gotcha in Python
`,
        javascript: `// Memory reference and garbage collection
const obj = { value: 10 };
let ref = obj;
ref.value = 20;
console.log(obj.value);  // 20 - same reference
obj = null;  // Now eligible for GC if no other refs exist
`
      },
      practice: "Discuss memory management trade-offs: reference counting vs mark-and-sweep garbage collection."
    }
  },

  // Arrays & Collections
  "array": {
    beginner: {
      explanation: "An array is a collection that stores multiple values in a single variable. Each value has a position (index) starting from 0.",
      examples: {
        python: `fruits = ["apple", "banana", "orange"]
print(fruits[0])     # "apple"
print(len(fruits))   # 3
fruits.append("grape")`,
        javascript: `let fruits = ["apple", "banana", "orange"];
console.log(fruits[0]);  // "apple"
console.log(fruits.length);  // 3
fruits.push("grape");`
      },
      practice: "Create an array of 5 numbers. Print each one. Then add a new number to the end."
    },
    intermediate: {
      explanation: "Arrays have different time complexities: O(1) access, O(n) insertion/deletion in middle. Dynamic arrays resize when capacity is exceeded. Consider space-time tradeoffs.",
      examples: {
        python: `# List comprehensions and slicing
squares = [x**2 for x in range(5)]  # [0, 1, 4, 9, 16]
subset = squares[1:3]                # [1, 4] - O(n) copy
reversed_list = squares[::-1]        # Reverse
`
      },
      practice: "Use list comprehension to create an array of even numbers from 0-20. Then filter for numbers > 10."
    },
    advanced: {
      explanation: "Memory layout matters: contiguous allocation (cache locality), dynamic resizing (amortized O(1)), vs linked structures (O(n) access). Consider specialized data structures: vectors, deques, skiplists.",
      examples: {
        python: `import array
# Array module for typed arrays (more efficient than lists)
arr = array.array('i', [1, 2, 3])  # 'i' = signed integer
# vs list: trade flexibility for memory efficiency
`
      },
      practice: "Compare performance: list vs array vs numpy array for 1M integers. When would you choose each?"
    }
  },

  // Loops
  "loop": {
    beginner: {
      explanation: "A loop repeats a block of code multiple times. Use 'for' loops when you know how many times to repeat, and 'while' loops when you repeat based on a condition.",
      examples: {
        python: `# For loop
for i in range(5):
    print(i)

# While loop
count = 0
while count < 5:
    print(count)
    count += 1`,
        javascript: `// For loop
for (let i = 0; i < 5; i++) {
    console.log(i);
}
// While loop
let count = 0;
while (count < 5) {
    console.log(count);
    count++;
}`
      },
      practice: "Write a loop that prints 'Hello' 10 times. Then write one that counts from 10 down to 1."
    },
    intermediate: {
      explanation: "Loop optimization: avoid repeated function calls in condition, consider iterator patterns, beware of off-by-one errors. Understand break/continue behavior.",
      examples: {
        python: `# Using enumerate instead of range(len())
for index, value in enumerate(items):
    print(f"{index}: {value}")

# List comprehension vs loop - usually faster
result = [x*2 for x in range(100000) if x % 2 == 0]`
      },
      practice: "Write a function that finds the first index where value > 10 in a list. Use break to exit early."
    },
    advanced: {
      explanation: "Loop unrolling, vectorization (SIMD), and JIT compilation determine actual performance. Understand memory access patterns and cache behavior.",
      examples: {
        python: `import numpy as np
# Vectorized operations beat Python loops for numeric data
arr = np.arange(1000000)
result = arr * 2 + 1  # Compiled in C, much faster than loop`
      },
      practice: "Benchmark: pure Python loop vs list comprehension vs numpy for sum of 1M integers. Explain the results."
    }
  },

  // Functions
  "function": {
    beginner: {
      explanation: "A function is a reusable block of code that performs a specific task. It takes input (parameters) and returns output (return value).",
      examples: {
        python: `def greet(name):
    message = f"Hello, {name}!"
    return message

result = greet("Alice")
print(result)  # "Hello, Alice!"`,
        javascript: `function greet(name) {
    const message = \`Hello, \${name}!\`;
    return message;
}
const result = greet("Alice");
console.log(result);  // "Hello, Alice!"`
      },
      practice: "Write a function that takes two numbers and returns their sum. Call it with different values."
    },
    intermediate: {
      explanation: "Functions have scope boundaries. Understand default parameters, *args, **kwargs, and closures. Stack frames are created on each call.",
      examples: {
        python: `def process(*args, **kwargs):
    for arg in args:
        print(arg)
    for key, value in kwargs.items():
        print(f"{key}={value}")

def make_adder(x):
    def add(y):
        return x + y  # Closure - 'x' is captured
    return add

add5 = make_adder(5)
print(add5(3))  # 8`
      },
      practice: "Write a function with default parameters. Write another that uses *args. When would you use each?"
    },
    advanced: {
      explanation: "Function calls have overhead: parameter passing, stack frame allocation, return address. Tail call optimization (TCO), inlining, and memoization are key optimizations.",
      examples: {
        python: `# Tail recursion - Python doesn't optimize, but concept important
def factorial_tail(n, acc=1):
    if n <= 1:
        return acc
    return factorial_tail(n-1, n*acc)  # Tail call

# Memoization for expensive functions
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2: return n
    return fibonacci(n-1) + fibonacci(n-2)`
      },
      practice: "Implement memoization for a fibonacci function. Measure speedup for fib(30) with vs without caching."
    }
  },

  // Default responses for unknown topics
  "default": {
    beginner: {
      explanation: "That's an interesting question! Let's break it down step by step. First, understand the core concept: this is about fundamentals that every developer needs to know.",
      examples: {
        python: `# Here's a simple Python example
result = "Your code here"
print(result)`,
        javascript: `// Here's a JavaScript example
const result = "Your code here";
console.log(result);`
      },
      practice: "Try implementing this concept with a simple example. What questions do you have?"
    },
    intermediate: {
      explanation: "This is a deeper topic. Consider the trade-offs: performance vs readability, flexibility vs simplicity. There's no one-size-fits-all answer.",
      examples: {
        python: `# Intermediate example
class Example:
    def __init__(self, value):
        self.value = value`,
        javascript: `// Intermediate example
class Example {
    constructor(value) {
        this.value = value;
    }
}`
      },
      practice: "Explore this concept in your own project. What patterns emerge?"
    },
    advanced: {
      explanation: "At this level, consider architectural patterns, performance implications, and trade-offs with other approaches. This requires deep knowledge of language internals.",
      examples: {
        python: `# Advanced patterns and optimizations
# Consider using decorators, metaclasses, or functional patterns`,
        javascript: `// Advanced patterns: closures, prototypes, proxies
// Consider functional composition and advanced ES6+ features`
      },
      practice: "Compare multiple implementation approaches and benchmark them. Document your findings."
    }
  }
};

/**
 * Get appropriate code language from user preference and prompt
 */
function detectLanguage(userLanguagePreference, prompt) {
  const prompt_lower = prompt.toLowerCase();
  
  // Check if prompt mentions specific language
  if (prompt_lower.includes("python")) return "python";
  if (prompt_lower.includes("javascript") || prompt_lower.includes("js")) return "javascript";
  if (prompt_lower.includes("java")) return "java";
  
  // Fall back to user preference, default to Python
  const validLanguages = ["python", "javascript", "java"];
  return validLanguages.includes(userLanguagePreference.toLowerCase()) 
    ? userLanguagePreference.toLowerCase() 
    : "python";
}

/**
 * Detect topic from prompt
 */
function detectTopic(prompt) {
  const prompt_lower = prompt.toLowerCase();
  const keywords = {
    "variable": ["variable", "var", "const", "let", "binding"],
    "array": ["array", "list", "collection", "vector", "iterable"],
    "loop": ["loop", "for", "while", "iterate", "iteration"],
    "function": ["function", "method", "procedure", "subroutine", "callable"]
  };

  for (const [topic, keywords_list] of Object.entries(keywords)) {
    if (keywords_list.some(kw => prompt_lower.includes(kw))) {
      return topic;
    }
  }
  
  return "default";
}

/**
 * Generate mock response based on topic and skill level
 */
function generateMockResponse(topic, skillLevel, language) {
  const topics = mockTopics[topic] || mockTopics["default"];
  const skillData = topics[skillLevel] || topics["beginner"];
  
  const code = skillData.examples[language] || skillData.examples["python"];
  
  return `[MOCK] ${skillData.explanation}

📝 Example (${language.toUpperCase()}):
\`\`\`${language}
${code}
\`\`\`

🎯 Practice Task:
${skillData.practice}

---
*This is a mock response for development/testing. In live mode, you'll get responses from the configured AI provider.*`;
}

/**
 * Generate realistic delay (250-2000ms)
 */
function getRealisticDelay() {
  return Math.random() * 1750 + 250;
}

/**
 * Simulate random errors (5% chance) for testing error paths
 */
function shouldSimulateError(enableErrorSimulation = false) {
  if (!enableErrorSimulation) return false;
  return Math.random() < 0.05; // 5% chance
}

module.exports = {
  generateMockResponse,
  detectTopic,
  detectLanguage,
  getRealisticDelay,
  shouldSimulateError
};
