const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  evaluation: {
    Communication: Number,
    SubjectMatterExpertise: Number,
    Confidence: Number,
    BodyLanguage: Number,
    Presentation: Number,
    Voice: Number,
    Tone: Number,
    Pitch: Number,
    AnswerSatisfaction: Number,
    TotalScore: Number,
    Feedback: String,
  },
});

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true }, // HR, Technical, Personal
  branch: { type: String, default: null }, // for technical
  mode: { type: String, required: true }, // virtual / chat
  date: { type: Date, default: Date.now },
  totalAverage: { type: Number, default: 0 },
  answers: [answerSchema],
});

module.exports = mongoose.model("InterviewHistory", interviewSchema);
