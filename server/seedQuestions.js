/*
Run this once to populate your DB with HR, Personal, and Technical questions.
Usage: node seedQuestions.js
Make sure your MONGO_URI is set in environment variables.
*/

require('dotenv').config();
const mongoose = require("mongoose");
const Question = require("./models/Question");

const data = {
  hr: [
    "Tell me about yourself.",
    "Walk me through your resume.",
    "What are your strengths?",
    "What is your biggest weakness?",
    "Why should we hire you?",
    "Why do you want to join our company?",
    "Where do you see yourself in 5 years?",
    "Tell me about a time you faced a challenge and how you overcame it.",
    "Describe a project you're most proud of.",
    "What have you done to improve yourself during college?",
    "Tell me about your final year project.",
    "How do you handle criticism?",
    "Have you ever worked in a team? What role did you play?",
  ],
  personal: [
    "Tell me about yourself.",
    "Walk me through your resume.",
    "What are your strengths?",
    "What is your biggest weakness?",
    "Why should we hire you?",
    "Why do you want to join our company?",
    "Where do you see yourself in 5 years?",
    "Tell me about a time you faced a challenge and how you overcame it.",
    "Describe a project you're most proud of.",
    "What have you done to improve yourself during college?",
    "Tell me about your final year project.",
    "How do you handle criticism?",
    "Have you ever worked in a team? What role did you play?",
  ],
  technical: {
    "mechanical-engineering": [
      "Explain the first and second laws of thermodynamics.",
      "What is the difference between stress and strain?",
      "Describe the working principle of a heat engine.",
      "What are the different types of manufacturing processes?",
      "Explain the concept of fatigue in materials.",
      "How do you calculate the efficiency of a machine?",
      "What is the difference between brittle and ductile materials?",
      "Describe the working of a four-stroke engine.",
      "What are the different types of gears and their applications?",
      "Explain the concept of fluid mechanics and its applications.",
      "What is the difference between welding and brazing?",
      "How do you design a shaft for torsional loading?",
      "What are the principles of quality control in manufacturing?",
    ],
    "civil-engineering": [
      "Explain the different types of foundations and their applications.",
      "What is the difference between reinforced and prestressed concrete?",
      "Describe the process of structural analysis.",
      "What are the different types of loads acting on structures?",
      "Explain the concept of soil mechanics.",
      "How do you design a beam for flexural strength?",
      "What is the importance of water-cement ratio in concrete?",
      "Describe the different methods of surveying.",
      "What are the principles of highway design?",
      "Explain the concept of earthquake-resistant design.",
      "What is the difference between arch and beam bridges?",
      "How do you calculate the bearing capacity of soil?",
      "What are the environmental considerations in construction?",
    ],
    "electrical-engineering": [
      "Explain Ohm's law and its applications.",
      "What is the difference between AC and DC circuits?",
      "Describe the working principle of a transformer.",
      "What are the different types of electrical machines?",
      "Explain the concept of power factor and its importance.",
      "How do you analyze three-phase circuits?",
      "What is the difference between analog and digital signals?",
      "Describe the working of a synchronous motor.",
      "What are the protection schemes used in power systems?",
      "Explain the concept of electromagnetic induction.",
      "How do you design electrical installations?",
      "What is the importance of grounding in electrical systems?",
      "Describe the different types of power generation methods.",
    ],
    "computer-engineering": [
      "Explain the difference between hardware and software.",
      "What are the different types of computer architectures?",
      "Describe the working of a microprocessor.",
      "What is the difference between RAM and ROM?",
      "Explain the concept of operating systems.",
      "How do computer networks function?",
      "What are the different programming paradigms?",
      "Describe the process of software development lifecycle.",
      "What is the importance of data structures and algorithms?",
      "Explain the concept of database management systems.",
      "How do you ensure cybersecurity in computer systems?",
      "What are the principles of computer graphics?",
      "Describe the working of artificial intelligence systems.",
    ],
    "software-engineering": [
      "Explain the difference between object-oriented and functional programming.",
      "What are data structures and why are they important?",
      "Describe the time complexity of common sorting algorithms.",
      "How do you ensure code quality and maintainability?",
      "What are design patterns and when would you use them?",
      "Explain the concept of recursion with an example.",
      "What is the difference between stack and heap memory?",
      "How do you approach debugging complex issues?",
      "Describe the software development lifecycle you prefer.",
      "What is version control and why is it important?",
      "Explain the concept of Big O notation.",
      "How do you handle exceptions in your code?",
      "What are the principles of clean code?",
    ],
  },
};

async function seed() {
  const MODES = ["virtual", "chat"]; // ✅ Support both interview modes

  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI not found. Set it in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding...");

    // Clear existing questions
    await Question.deleteMany({});
    console.log("🧹 Cleared existing questions.");

    for (const MODE of MODES) {
      console.log(`\n🌐 Seeding questions for mode: ${MODE.toUpperCase()}...`);

      // Insert HR questions
      const hrDocs = data.hr.map((q) => ({
        category: "HR",
        mode: MODE,
        question: q,
      }));
      await Question.insertMany(hrDocs);

      // Insert Personal questions
      const personalDocs = data.personal.map((q) => ({
        category: "Personal",
        mode: MODE,
        question: q,
      }));
      await Question.insertMany(personalDocs);

      // Insert Technical questions
      for (const [branch, questions] of Object.entries(data.technical)) {
        const techDocs = questions.map((q) => ({
          category: "Technical",
          branch,
          mode: MODE,
          question: q,
        }));
        await Question.insertMany(techDocs);
      }
    }

    console.log("\n✅ Database seeding completed successfully for both modes!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding the database:", err);
    process.exit(1);
  }
}

seed();
