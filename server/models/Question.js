const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
category: { type: String, required: true },   // "HR", "Personal", "Technical"
branch: { type: String, default: null },      // e.g. "mechanical-engineering" (only for Technical)
mode: { type: String, required: true },       // "virtual" or "chat" (you may store "both" if question applies to both)
question: { type: String, required: true },
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
