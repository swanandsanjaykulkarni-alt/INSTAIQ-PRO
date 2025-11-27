const express = require("express");
const router = express.Router();
const InterviewHistory = require("../models/InterviewHistory");
const PDFDocument = require("pdfkit");

/* -------------------------- 🔹 Start Interview ----------------------------- */
router.post("/start", async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ message: "userId & type are required." });
    }

    // Create a new draft interview
    const newInterview = new InterviewHistory({
      userId,
      category: type,
      mode: "Text",
      answers: [],
      isCompleted: false
    });

    await newInterview.save();

    return res.status(201).json({
      message: "Interview started.",
      interviewId: newInterview._id
    });

  } catch (err) {
    console.error("START ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* -------------------------- 🔹 MOCK Evaluate Answer ----------------------------- */

// This mock endpoint lets you test full flow (no ChatGPT API needed)

router.post("/evaluate", async (req, res) => {
  try {
    const { question, userAnswer } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ message: "Question & answer required." });
    }

    const mockEvaluation = {
      Communication: 8,
      SubjectMatterExpertise: 7,
      Confidence: 8,
      BodyLanguage: 7,
      Presentation: 8,
      Voice: 7,
      Tone: 8,
      Pitch: 7,
      AnswerSatisfaction: 8,
      TotalScore: 7.7,
      Feedback: "Good explanation."
    };

    return res.json({ evaluation: mockEvaluation });

  } catch (err) {
    console.error("EVALUATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------- 🔹 Save Interview ----------------------------- */

router.post("/save", async (req, res) => {
  try {
    const { interviewId, branch, mode, answers, userId } = req.body;

    if (!mode || !Array.isArray(answers)) {
      return res.status(400).json({ message: "mode & answers are required." });
    }

    let interview;

    // CASE 1: front-end sent valid interviewId → update it
    if (interviewId) {
      interview = await InterviewHistory.findById(interviewId);
    }

    // CASE 2: if not found → find last incomplete interview of that user
    if (!interview && userId) {
      interview = await InterviewHistory.findOne({
        userId,
        isCompleted: false
      }).sort({ date: -1 });
    }

    // CASE 3: if still not found → create new interview
    if (!interview) {
      interview = new InterviewHistory({
        userId,
        category: "Technical",
        mode,
        branch,
        answers: [],
        isCompleted: false
      });
    }

    // Calculate average score
    const totalScores = answers.map(a => a.evaluation?.TotalScore || 0);
    const avg =
      totalScores.length > 0
        ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
        : 0;

    // Apply update
    interview.branch = branch || interview.branch;
    interview.mode = mode;
    interview.answers = answers;
    interview.totalAverage = Math.round(avg * 100) / 100;
    interview.isCompleted = true;
    interview.date = Date.now();

    await interview.save();

    return res.json({
      message: "Interview saved successfully.",
      interview
    });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/force-end", async (req, res) => {
  try {
    const { interviewId, reason } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "Interview ID required" });
    }

    const interview = await InterviewHistory.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.isCompleted = true;
    interview.forcedEnd = true;
    interview.cheatReason = reason || "Cheating - Tab switch detected";
    interview.totalAverage = 0; // Make score zero if cheating
    interview.date = Date.now();

    await interview.save();

    return res.json({ 
      message: "Interview forced to end (Cheating).", 
      interview 
    });

  } catch (err) {
    console.error("FORCE END ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* -------------------------- 🔹 Get User History --------------------------- */

router.get("/history/:userId", async (req, res) => {
  try {
    const interviews = await InterviewHistory.find({
      userId: req.params.userId,
      isCompleted: true
    })
      .sort({ date: -1 });

    return res.json({
      count: interviews.length,
      interviews
    });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/* -------------------------- 🔹 Download Detailed PDF Report ------------------------ */
router.get("/download/:id", async (req, res) => {
  try {
    const interview = await InterviewHistory.findById(req.params.id).populate("userId", "name email");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=interview-${interview._id}.pdf`);
    doc.pipe(res);

    // === HEADER SECTION ===
    doc.fontSize(18).text("INSTA IQ - Detailed Interview Report", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(12)
      .text(`Candidate: ${interview.userId?.name || "Unknown"}`)
      .text(`Email: ${interview.userId?.email || "Unknown"}`)
      .text(`Category: ${interview.category}`)
      .text(`Branch: ${interview.branch || "N/A"}`)
      .text(`Mode: ${interview.mode}`)
      .text(`Date: ${interview.date.toLocaleString()}`)
      .moveDown(0.5)
      .font("Helvetica-Bold")
      .text(`Overall Score: ${interview.totalAverage}/10`, { underline: true })
      .moveDown();

    // === PERFORMANCE INDICATORS AVERAGE ===
    doc.font("Helvetica-Bold").fontSize(14).text("Performance Indicators", { underline: true });
    doc.moveDown(0.5);
    const metrics = [
      "Communication",
      "SubjectMatterExpertise",
      "Confidence",
      "BodyLanguage",
      "Presentation",
      "Voice",
      "Tone",
      "Pitch",
      "AnswerSatisfaction",
    ];

    // calculate averages
    const averages = {};
    metrics.forEach(m => {
      let sum = 0, count = 0;
      interview.answers.forEach(a => {
        if (a.evaluation && a.evaluation[m] != null) {
          sum += a.evaluation[m];
          count++;
        }
      });
      averages[m] = count > 0 ? (sum / count).toFixed(1) : "N/A";
    });

    metrics.forEach(m => {
      doc.font("Helvetica").fontSize(11)
        .text(`${m}: ${averages[m]}`, { indent: 20 });
    });

    doc.moveDown(1);

    // === QUESTION-WISE FEEDBACK ===
    doc.font("Helvetica-Bold").fontSize(14).text("Question-wise Feedback", { underline: true });
    doc.moveDown(0.5);

    interview.answers.forEach((a, i) => {
      const ev = a.evaluation || {};

      doc.font("Helvetica-Bold").fontSize(12)
        .text(`Q${i + 1}: ${a.question}`)
        .font("Helvetica")
        .text(`Answer: ${a.userAnswer}`)
        .moveDown(0.3);

      // Display all indicators per question
      metrics.forEach(m => {
        if (ev[m] !== undefined) {
          doc.fontSize(10).text(`${m}: ${ev[m]}/10`, { indent: 20 });
        }
      });

      doc.moveDown(0.2)
        .fontSize(10)
        .text(`Total Score: ${ev.TotalScore ?? "N/A"}`)
        .font("Helvetica-Oblique")
        .text(`Feedback: ${ev.Feedback ?? "No feedback provided."}`)
        .moveDown(1);
    });

    doc.end();
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).json({ message: "Server error generating PDF", error: err.message });
  }
});

/* -------------------------- 🔹 Admin Dashboard Data -------------------------- */
router.get("/all", async (req, res) => {
  try {
    const interviews = await InterviewHistory.find()
      .populate("userId", "name email")
      .sort({ date: -1 });

    const totalInterviews = interviews.length;
    const avgScore =
      totalInterviews > 0
        ? interviews.reduce((sum, i) => sum + (i.totalAverage || 0), 0) /
          totalInterviews
        : 0;

    const topPerformers = interviews
      .filter(i => i.totalAverage >= 8)
      .slice(0, 5)
      .map(i => ({
        user: i.userId?.name || "Unknown",
        email: i.userId?.email || "N/A",
        score: i.totalAverage,
        category: i.category,
      }));

    res.json({
      totalInterviews,
      averageScore: avgScore.toFixed(2),
      topPerformers,
      recentInterviews: interviews.slice(0, 10),
    });
  } catch (err) {
    console.error("❌ Admin dashboard error:", err);
    res.status(500).json({ message: "Server error loading admin dashboard", error: err.message });
  }
});


module.exports = router;