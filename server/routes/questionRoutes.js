const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// 🧩 1️⃣ Temporary test route for inserting Civil Engineering question
router.get("/seed-civil", async (req, res) => {
  try {
    const testQuestion = {
      category: "Technical",
      mode: "virtual",
      branch: "civil-engineering",
      question:
        "What is the difference between working stress method and limit state method?",
    };
    const q = new Question(testQuestion);
    await q.save();
    res.json({
      message: "✅ Civil Engineering test question successfully inserted!",
      question: q,
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to insert test question. Check MongoDB connection.",
      error: err.message,
    });
  }
});

// 🧩 2️⃣ Add a new question manually (admin route)
router.post("/add", async (req, res) => {
  try {
    const { category, branch, mode, question } = req.body;
    if (!category || !mode || !question) {
      return res
        .status(400)
        .json({ message: "category, mode and question are required" });
    }
    const q = new Question({ category, branch: branch || null, mode, question });
    await q.save();
    res.json({ message: "✅ Question added successfully", question: q });
  } catch (err) {
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

// 🧩 3️⃣ Fetch questions with flexible filtering
// Example: GET /api/questions?category=Technical&branch=mechanical-engineering&mode=virtual
router.get("/", async (req, res) => {
  try {
    const { category, branch, mode } = req.query;

    // 🧠 Log what frontend is actually sending
    console.log("Incoming query:", { category, branch, mode });

    const filter = {};

    if (category) filter.category = new RegExp(`^${category}$`, "i");
    if (branch && branch !== "all") filter.branch = new RegExp(`^${branch}$`, "i");
    if (mode) filter.mode = new RegExp(`^${mode}$`, "i");

    console.log("Applied filter:", filter);

    const questions = await Question.find(filter).sort({ createdAt: 1 });
    console.log(`📦 Found ${questions.length} questions.`);

    res.json({ count: questions.length, questions });
  } catch (err) {
    console.error("❌ Error fetching questions:", err);
    res.status(500).json({ message: "Server error during question fetch", error: err.message });
  }
});

module.exports = router;
