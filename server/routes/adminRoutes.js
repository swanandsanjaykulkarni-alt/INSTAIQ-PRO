const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Interview = require("../models/InterviewHistory"); // if you renamed it


const router = express.Router();

// ======================
// 🔹 Admin Login (Plain password version)
// ======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare directly (no hashing)
    if (admin.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: { _id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ======================
// 🔹 Fetch All Users (Dashboard Data)
// ======================
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email createdAt");
    res.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ======================
// 🔹 Fetch All Interviews
// ======================
router.get("/interviews", async (req, res) => {
  try {
    const interviews = await Interview.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error("Fetch Interviews Error:", error);
    res.status(500).json({ message: "Error fetching interviews" });
  }
});

module.exports = router;
