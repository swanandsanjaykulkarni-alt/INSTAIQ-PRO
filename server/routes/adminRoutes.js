// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const InterviewHistory = require("../models/InterviewHistory");

// --- Admin Login ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check admin credentials from env
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      return res.json({ success: true, token });
    } else {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Admin Dashboard Overview ---
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInterviews = await InterviewHistory.countDocuments();
    const averageScore = await InterviewHistory.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$totalAverage" } } },
    ]);

    const recentInterviews = await InterviewHistory.find()
      .populate("userId", "name email")
      .sort({ date: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalInterviews,
      averageScore:
        averageScore.length > 0 ? averageScore[0].avgScore.toFixed(1) : 0,
      recentInterviews,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

// --- All Users List ---
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
