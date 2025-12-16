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
You are a strict, unbiased professional interviewer evaluating a CHAT-BASED interview answer.

Evaluate the candidate ONLY based on the WRITTEN ANSWER quality.
There is NO camera and NO voice input.

Scoring rules (must follow strictly):
- Very weak / incorrect / meaningless → 0–2
- Basic understanding, shallow → 3–4
- Partially correct, lacks depth → 5–6
- Clear, correct, well explained → 7–8
- Excellent, detailed, professional → 9–10

IMPORTANT RULES (MANDATORY):
- Never assign the same score to all attributes.
- Never default to 5.
- Never use "NA", "N/A", null, or text for numeric fields.
- All numeric values MUST be numbers between 0 and 10.
- Scores must reflect the ACTUAL quality of the answer.
- Short, vague, copied-like, or off-topic answers MUST receive low scores.

Return ONLY valid JSON in exactly this structure:

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
  "Feedback": "short, clear, professional improvement advice"
}

Special instructions for CHAT interview:
- BodyLanguage = 0
- Voice = 0
- Pitch = 0

TotalScore:
- Must be between 0 and 10
- Must represent overall performance quality
- Must NOT be a sum of individual scores

Question:
${question}

Answer:
${userAnswer}
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
