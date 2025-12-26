// utils/chatgptEvaluation.js
require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Helper: safely force number between 0–10
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
You are a strict, unbiased professional technical interviewer evaluating a CHAT-BASED interview answer.

Evaluate the candidate ONLY based on the WRITTEN ANSWER quality.
There is NO camera, NO voice, and NO body language.

Use the following INDICATORS and evaluate them independently:

1. ConceptualClarity – Understanding of core concepts and fundamentals
2. ProblemDecompositionAbility – Ability to break the problem into logical parts
3. ApplicationOfKnowledge – Applying theory to practical or real-world context
4. LogicalAlgorithmicThinking – Structured, logical, step-by-step reasoning
5. DebuggingErrorHandlingMindset – Awareness of edge cases, errors, validations
6. CommunicationOfTechnicalIdeas – Clear explanation using correct technical terms
7. LearningAgility – Willingness to adapt, improve, or learn better approaches
8. EngineeringJudgmentDecisionMaking – Choosing appropriate, efficient solutions

SCORING RULES (STRICT):
- Very weak / incorrect / meaningless → 0–2
- Basic understanding, shallow → 3–4
- Partially correct, lacks depth → 5–6
- Clear, correct, well explained → 7–8
- Excellent, detailed, professional → 9–10

MANDATORY RULES:
- Never assign the same score to all indicators
- Never default to 5
- Never use NA, N/A, null, or text for numeric fields
- Scores MUST reflect the ACTUAL quality of the answer
- Short, vague, copied-like, or off-topic answers MUST receive low scores

Return ONLY valid JSON in EXACTLY this format:

{
  "ConceptualClarity": number,
  "ProblemDecompositionAbility": number,
  "ApplicationOfKnowledge": number,
  "LogicalAlgorithmicThinking": number,
  "DebuggingErrorHandlingMindset": number,
  "CommunicationOfTechnicalIdeas": number,
  "LearningAgility": number,
  "EngineeringJudgmentDecisionMaking": number,
  "TotalScore": number,
  "Feedback": "short, clear, professional improvement advice"
}

TotalScore rules:
- Must be between 0 and 10
- Must represent OVERALL performance
- Must NOT be a sum or average
- Judge like a real interviewer

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

    const raw = response.choices[0].message.content.trim();
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Invalid JSON from ChatGPT:", raw);
      throw new Error("Invalid JSON from ChatGPT");
    }

    // ✅ Sanitize & normalize before DB save
    return {
      ConceptualClarity: safeScore(parsed.ConceptualClarity),
      ProblemDecompositionAbility: safeScore(parsed.ProblemDecompositionAbility),
      ApplicationOfKnowledge: safeScore(parsed.ApplicationOfKnowledge),
      LogicalAlgorithmicThinking: safeScore(parsed.LogicalAlgorithmicThinking),
      DebuggingErrorHandlingMindset: safeScore(parsed.DebuggingErrorHandlingMindset),
      CommunicationOfTechnicalIdeas: safeScore(parsed.CommunicationOfTechnicalIdeas),
      LearningAgility: safeScore(parsed.LearningAgility),
      EngineeringJudgmentDecisionMaking: safeScore(parsed.EngineeringJudgmentDecisionMaking),
      TotalScore: safeScore(parsed.TotalScore),
      Feedback: parsed.Feedback || "No feedback generated.",
    };

  } catch (err) {
    console.error("🔥 ChatGPT evaluation error:", err);

    // ✅ Safe fallback (never breaks DB)
    return {
      ConceptualClarity: 0,
      ProblemDecompositionAbility: 0,
      ApplicationOfKnowledge: 0,
      LogicalAlgorithmicThinking: 0,
      DebuggingErrorHandlingMindset: 0,
      CommunicationOfTechnicalIdeas: 0,
      LearningAgility: 0,
      EngineeringJudgmentDecisionMaking: 0,
      TotalScore: 0,
      Feedback: "Evaluation failed.",
    };
  }
}

module.exports = evaluateAnswer;
