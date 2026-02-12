const OpenAI = require("openai");

exports.askMentor = async ({ prompt, skill_level, language }) => {

  // 🔁 MOCK MODE — NO API KEY NEEDED
  if (process.env.AI_MODE === "mock") {
    return `
👨‍🏫 Mock AI Coding Mentor Response

Topic: ${prompt}
Skill level: ${skill_level}
Language: ${language}

Explanation:
An array is a data structure that stores multiple values of the same type in a single variable.

Example (${language}):
int[] numbers = {1, 2, 3, 4, 5};

Why use arrays?
- Store multiple values
- Easy iteration
- Better memory organization

Practice Task:
Write a program to find the sum of elements in an array.
`;
  }

  // 🔥 REAL AI MODE — Client created ONLY here
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const systemPrompt = `
You are a senior software engineer and coding mentor.
User skill level: ${skill_level}
Preferred programming language: ${language}

Rules:
- Explain concepts step by step
- Use simple language
- Give a small example
- End with a short practice task
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content;
};
