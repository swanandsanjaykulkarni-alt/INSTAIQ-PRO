const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  evaluation: {
    Communication: { type: Number, min: 0, max: 10 },
    SubjectMatterExpertise: { type: Number, min: 0, max: 10 },
    Confidence: { type: Number, min: 0, max: 10 },
    BodyLanguage: { type: Number, min: 0, max: 10 },
    Presentation: { type: Number, min: 0, max: 10 },
    Voice: { type: Number, min: 0, max: 10 },
    Tone: { type: Number, min: 0, max: 10 },
    Pitch: { type: Number, min: 0, max: 10 },
    AnswerSatisfaction: { type: Number, min: 0, max: 10 },
    TotalScore: { type: Number, min: 0, max: 10 },
    Feedback: String,
  },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    category: {
      type: String,
      //enum: ["HR", "Personal", "Technical"],
      required: true
    },

    branch: { type: String, default: null },

    mode: {
      type: String,
      //enum: ["virtual", "chat", "both"],
      required: true
    },

    date: { type: Date, default: Date.now },

    totalAverage: { type: Number, default: 0 },

    isCompleted: { type: Boolean, default: false },

    forcedEnd: { type: Boolean, default: false },
    cheatReason: { type: String, default: null },

    answers: [answerSchema],
  },
  { timestamps: true }
);

// Auto-calculate totalAverage
interviewSchema.pre("save", function (next) {
  let total = 0, count = 0;

  this.answers.forEach(ans => {
    if (ans.evaluation?.TotalScore !== undefined) {
      total += ans.evaluation.TotalScore;
      count++;
    }
  });

  this.totalAverage = count === 0 ? 0 : (total / count).toFixed(2);
  next();
});

module.exports = mongoose.model("InterviewHistory", interviewSchema);
