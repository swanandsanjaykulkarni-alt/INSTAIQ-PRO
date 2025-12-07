// utils/chatgptEvaluation.js
require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Evaluates a user's answer using ChatGPT
 * @param {string} question - The interview question
 * @param {string} userAnswer - The user's answer
 * @returns {object} - Parsed evaluation with scores & feedback
 */
async function evaluateAnswer(question, userAnswer) {
  if (!question || !userAnswer) {
    throw new Error("Question and userAnswer are required.");
  }

  // Construct prompt for structured evaluation
  const prompt = `
You are an AI interviewer. Evaluate the candidate's answer to a technical/interview question.
Return a JSON object with the following keys:
- Communication (0-10)
- SubjectMatterExpertise (0-10)
- Confidence (0-10)
- BodyLanguage (0-10)
- Presentation (0-10)
- Voice (0-10)
- Tone (0-10)
- Pitch (0-10)
- AnswerSatisfaction (0-10)
- TotalScore (0-10)
- Feedback (short text advice)

Question: ${question}
Answer: ${userAnswer}

Respond ONLY with valid JSON.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert interviewer who evaluates answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0
    });

    const content = response.choices[0].message.content.trim();

    // Attempt to parse JSON
    let evaluation = {};
    try {
      evaluation = JSON.parse(content);
    } catch (err) {
      console.error("Failed to parse GPT response as JSON. Returning raw text.", err);
      evaluation = {
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
        Feedback: content
      };
    }

    return evaluation;

  } catch (err) {
    console.error("ChatGPT evaluation error:", err);
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
