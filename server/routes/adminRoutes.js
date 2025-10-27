const express = require("express");
const router = express.Router();
const User = require("../models/User");
const InterviewHistory = require("../models/InterviewHistory");

// ✅ Admin Dashboard Overview
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInterviews = await InterviewHistory.countDocuments();
    const recentInterviews = await InterviewHistory.find()
      .populate("userId", "name email")
      .sort({ date: -1 })
      .limit(5);

    const averageScore = await InterviewHistory.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$totalAverage" } } },
    ]);

    res.json({
      totalUsers,
      totalInterviews,
      averageScore:
        averageScore.length > 0 ? averageScore[0].avgScore.toFixed(1) : 0,
      recentInterviews,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Server error loading dashboard" });
  }
});

// ✅ FIX: Add route for /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email createdAt").sort({
      createdAt: -1,
    });
    res.json({ count: users.length, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
