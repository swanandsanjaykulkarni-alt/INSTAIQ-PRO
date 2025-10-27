// =================================================================
// 1. CONFIGURATION: Load environment variables first (requires 'dotenv' package)
// =================================================================
require('dotenv').config();

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

// =================================================================
// 3. INITIALIZATION & SETUP
// =================================================================
const app = express();
// Default to 3000 if PORT is not set in the .env file
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// =================================================================
// 4. CORS MIDDLEWARE (Crucial Fix for network error from 127.0.0.1:5500)
// =================================================================
const allowedOrigins = [
    'http://127.0.0.1:5500',  // Your VS Code Live Server (frontend)
    'http://localhost:5500',   // Alias for your frontend
    'http://localhost:3000'    // Backend's own port
];

const corsOptions = {
    // Only allow specific origins defined above
    origin: function (origin, callback) {
        // Allows requests with no origin (e.g., Postman, mobile apps) 
        // OR if the origin is in our allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy error: Origin ${origin} not allowed`));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Needed if you use cookies or sessions
};

// Apply the CORS middleware
//app.use(cors(corsOptions));
app.use(cors({
    origin: "*", // Allows all domains for now
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// =================================================================
// 5. GENERAL MIDDLEWARE
// =================================================================
app.use(bodyParser.json());

// Serving static files (Uncomment this if you have a 'public' folder for your frontend)
// app.use(express.static("public"));

// =================================================================
// 6. MONGODB CONNECTION
// =================================================================
if (!MONGO_URI) {
    console.error("❌ FATAL ERROR: MONGO_URI is not defined in the .env file!");
    process.exit(1); // Exit the application if the URI is missing
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Exit if database connection fails
});

// =================================================================
// 7. ROUTES
// =================================================================
// Default route
app.get("/", (req, res) => {
  res.send("AI Interview Simulator backend is running ✅");
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/admin", adminRoutes);


// =================================================================
// 8. START SERVER
// =================================================================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));