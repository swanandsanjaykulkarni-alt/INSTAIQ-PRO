// =================================================================
// 1. CONFIGURATION: Load environment variables first
// =================================================================
require("dotenv").config();

// =================================================================
// 2. IMPORTS
// =================================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import Routes
const userRoutes = require("./routes/userRoutes");
const questionRoutes = require("./routes/questionRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes"); // ✅ FIXED import location

// =================================================================
// 3. INITIALIZATION & SETUP
// =================================================================
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// =================================================================
// 4. CORS MIDDLEWARE
// =================================================================
app.use(
  cors({
    origin: "*", // allows all origins — simplify for dev
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =================================================================
// 5. GENERAL MIDDLEWARE
// =================================================================
app.use(bodyParser.json());
app.use(express.json());

// =================================================================
// 6. DATABASE CONNECTION
// =================================================================
if (!MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI missing in .env!");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// =================================================================
// 7. ROUTES (Ensure order is correct)
// =================================================================
app.get("/", (req, res) => {
  res.send("🚀 AI Interview Simulator backend is running successfully!");
});

// Order matters — mount all routes here
app.use("/api/users", userRoutes);
app.use("/api/users", authRoutes); // ✅ Forgot password / OTP routes are defined here
app.use("/api/questions", questionRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/admin", adminRoutes);

// =================================================================
// 8. GLOBAL ERROR HANDLER (optional but useful)
// =================================================================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// =================================================================
// 9. START SERVER
// =================================================================
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
