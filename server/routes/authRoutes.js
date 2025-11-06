// server/routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library"); // ✅ Fixed import (CommonJS)
const User = require("../models/User");

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ===================== SIGNUP =====================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", user: { _id: newUser._id, email } });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ===================== LOGIN =====================
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = (req.body.password || "").trim();

    const user = await User.findOne({ email });
    if (!user || user.password !== password)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "devsecret", {
      expiresIn: "1d",
    });

    res.json({ message: "Login successful", token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ===================== FORGOT PASSWORD =====================
router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: `"Insta IQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Insta IQ",
      html: `<h3>Your OTP is: ${otp}</h3><p>Expires in 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent successfully to your email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error. Try again later." });
  }
});

// ===================== RESET PASSWORD =====================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.resetOTP !== otp || Date.now() > user.resetOTPExpires)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = newPassword;
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
});

// ===================== GOOGLE LOGIN =====================
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google-login", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, password: "google_oauth_user" });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Google user logged in successfully",
      user: { _id: user._id, name: user.name, email: user.email },
      token, // ✅ send token here
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Server error during Google login" });
  }
});

module.exports = router;
