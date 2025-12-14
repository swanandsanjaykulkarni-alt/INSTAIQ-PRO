// utils/chatgptEvaluation.js
require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Helper: Convert safely to number (0–10)
function safeScore(value) {
  const num = Number(value);
  if (isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > 10) return 10;
  return num;
}

async function evaluateAnswer(question, userAnswer) {
  if (!question || !userAnswer) {
    throw new Error("Question and userAnswer are required.");
  }

  
  const prompt = `
You are a strict professional technical interviewer.

Evaluate the answer NUMERICALLY.
Do not use neutral scoring.
Do not assign the same score to all categories.
Do not default to 5.

Use this rule:
- Weak or incorrect answer → 0–3
- Partially correct → 4–6
- Good explanation → 7–8
- Expert-level → 9–10

Consider the actual ANSWER quality.
If the answer is short, incorrect, shallow, unclear, copied-like, or meaningless → give LOW scores.

Return ONLY valid JSON in exactly this format:

{
  "Communication": number,
  "SubjectMatterExpertise": number,
  "Confidence": number,
  "BodyLanguage": number,
  "Presentation": number,
  "Voice": number,
  "Tone": number,
  "Pitch": number,
  "AnswerSatisfaction": number,
  "TotalScore": number,
  "Feedback": "short professional improvement advice"
}

Question: ${question}
Answer: ${userAnswer}

Important:
TotalScore must be between 0–10 and reflect the overall performance.
Never return equal scores across all attributes.
Never return N/A, NA, or text for numeric fields.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let result = response.choices[0].message.content.trim();
    let parsed;

    try {
      parsed = JSON.parse(result);
    } catch (err) {
      console.error("Invalid JSON from GPT:", result);
      throw new Error("Invalid JSON from ChatGPT");
    }

    // ✅ Sanitize fields before DB save
    return {
      Communication: safeScore(parsed.Communication),
      SubjectMatterExpertise: safeScore(parsed.SubjectMatterExpertise),
      Confidence: safeScore(parsed.Confidence),
      BodyLanguage: safeScore(parsed.BodyLanguage),
      Presentation: safeScore(parsed.Presentation),
      Voice: safeScore(parsed.Voice),
      Tone: safeScore(parsed.Tone),
      Pitch: safeScore(parsed.Pitch),
      AnswerSatisfaction: safeScore(parsed.AnswerSatisfaction),
      TotalScore: safeScore(parsed.TotalScore),   // ✅ force 0–10
      Feedback: parsed.Feedback || "No feedback generated."
    };

  } catch (err) {
    console.error("ChatGPT evaluation error:", err);

    // ✅ Safe fallback
    return {
      Communication: 0,
      SubjectMatterExpertise: 0,
      Confidence: 0,
      BodyLanguage: 0,
      Presentation: 0,
      Voice: 0,
      Tone: 0,
      Pitch: 0,
      AnswerSatisfaction: 0,
      TotalScore: 0,
      Feedback: "Evaluation failed."
    };
  }
}

module.exports = evaluateAnswer;
