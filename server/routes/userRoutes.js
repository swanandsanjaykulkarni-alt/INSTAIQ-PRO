// /routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Assuming this path is correct

// Register Route
// This correctly handles POST requests to /api/users/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Simple validation check
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // NOTE: In a real app, you MUST hash the password here (e.g., using bcrypt).
        const newUser = new User({ name, email, password });
        await newUser.save();

        // Successful JSON response
        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        // Essential: Respond with JSON even on failure
        console.error("Registration Error:", error.message);
        res.status(500).json({ message: "Server Error during registration", error: error.message });
    }
});

// Login Route
// This correctly handles POST requests to /api/users/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); // Use 401 for unauthorized
        }

        // NOTE: In a real app, you MUST compare hashed passwords.
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Successful JSON response
        res.json({
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        // Essential: Respond with JSON even on failure
        console.error("Login Error:", error.message);
        res.status(500).json({ message: "Server Error during login", error: error.message });
    }
});

module.exports = router;