// scripts/virtual-interview.js

// API and State Configuration
const API_BASE_URL = "/api/questions";
let questions = [];
let currentQuestionIndex = 0;
let interviewTimeLeft = 40 * 60; // 40 minutes in seconds
let timerInterval;

// DOM Elements
const interviewContextSpan = document.getElementById("interviewContext");
const currentQuestionDisplay = document.getElementById(
    "currentQuestionDisplay",
);
const interviewTimerDisplay = document.getElementById("interviewTimer");
const userVideoFeed = document.getElementById("userVideoFeed");
const videoBackground = document.getElementById("video-background");
const voiceBackground = document.getElementById("voice-background");
const answerInput = document.getElementById("answerInput");

// BUTTONS AND CONTROLS
const startInterviewBtn = document.getElementById("startInterviewBtn");
const inInterviewControls = document.getElementById("inInterviewControls");
const speakToggleBtn = document.getElementById("speakToggleBtn");
const speakText = document.getElementById("speakText");
const skipBtn = document.getElementById("skipBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");

// --- HELPER FUNCTIONS ---
function toKebabCase(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^-a-z0-9]/g, "");
}

function updateTimerDisplay() {
    const minutes = Math.floor(interviewTimeLeft / 60);
    const seconds = interviewTimeLeft % 60;
    interviewTimerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// --- CORE INTERVIEW FLOW FUNCTIONS ---

function initializeInterview() {
    const mode = localStorage.getItem("selected_interview_mode");
    const type = localStorage.getItem("selected_interview_type");
    const domain = localStorage.getItem("selected_technical_domain");

    // Set the context in the header
    let contextText = `${type} / ${mode.includes("video") ? "Video" : "Voice"}`;
    if (domain) contextText += ` (${domain})`;
    interviewContextSpan.textContent = contextText;

    // 1. Setup Camera/Voice UI
    if (mode === "virtual-video") {
        videoBackground.style.display = "block";
        voiceBackground.classList.add("hidden");
    } else if (mode === "virtual-voice") {
        videoBackground.style.display = "none";
        voiceBackground.classList.remove("hidden");
    }

    // 2. Fetch Questions
    fetchQuestions(type, mode, domain);

    // Initial button state: disable in-interview controls
    inInterviewControls.classList.add("hidden");
}

// Function to fetch questions from the backend
async function fetchQuestions(type, mode, domain) {
    currentQuestionDisplay.textContent = "Loading questions from server...";
    startInterviewBtn.disabled = true;

    let branchSlug = domain ? toKebabCase(domain) : "";
    let apiMode = mode.startsWith("virtual") ? "virtual" : mode;

    let url = `${API_BASE_URL}?category=${encodeURIComponent(type)}&mode=${encodeURIComponent(apiMode)}`;
    if (type === "Technical" && branchSlug) {
        url += `&branch=${encodeURIComponent(branchSlug)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.questions && data.questions.length > 0) {
            questions = data.questions;
            currentQuestionDisplay.textContent = `Ready! ${questions.length} questions loaded. Press 'Start Interview' to begin.`;
            // CRITICAL FIX: Enable the start button only on success
            startInterviewBtn.disabled = false;
        } else {
            currentQuestionDisplay.textContent =
                "Error: No questions found for this category/branch. Check your seed data.";
        }
    } catch (error) {
        currentQuestionDisplay.textContent = `API Error: Could not connect to the backend. Is your server running?`;
        console.error("Error fetching questions:", error);
    }
}

// Function to start the interview session
function startInterviewSession() {
    startInterviewBtn.classList.add("hidden");
    inInterviewControls.classList.remove("hidden");
    answerInput.disabled = false;

    // Start Timer
    timerInterval = setInterval(() => {
        interviewTimeLeft--;
        updateTimerDisplay();
        if (interviewTimeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! The interview is now complete.");
            endInterview();
        }
    }, 1000);

    // Start Camera/Mic Access
    const mode = localStorage.getItem("selected_interview_mode");

    // Attempt to start media based on the selected mode
    const mediaConstraints =
        mode === "virtual-video"
            ? { video: true, audio: true }
            : { audio: true };

    navigator.mediaDevices
        .getUserMedia(mediaConstraints)
        .then((stream) => {
            if (mode === "virtual-video") {
                userVideoFeed.srcObject = stream;
            }
            speakToggleBtn.disabled = false;
        })
        .catch((err) => {
            currentQuestionDisplay.textContent =
                "WARNING: Could not access camera/mic. Check permissions.";
            console.error("Media access error: ", err);
            speakToggleBtn.disabled = true;
            speakText.textContent = "Mic Error";
        });

    // Display the first question
    displayNextQuestion();
}

// Function to display the next question
function displayNextQuestion() {
    if (currentQuestionIndex < questions.length) {
        const questionObj = questions[currentQuestionIndex];
        currentQuestionDisplay.textContent = `Q${currentQuestionIndex + 1}: ${questionObj.question}`;

        // Reset answer area and controls
        answerInput.value = "";
        nextBtn.disabled = false;
        skipBtn.disabled = false;
        speakToggleBtn.disabled = false;

        currentQuestionIndex++;
    } else {
        currentQuestionDisplay.textContent =
            "Interview Complete! Press 'End Interview' to see your report.";
        nextBtn.disabled = true;
        skipBtn.disabled = true;
        speakToggleBtn.disabled = true;
        clearInterval(timerInterval);
    }
}

// Function to handle answer submission
async function submitAnswer() {
    // 1. Disable controls while processing
    nextBtn.disabled = true;
    skipBtn.disabled = true;
    speakToggleBtn.disabled = true;
    answerInput.disabled = true;

    currentQuestionDisplay.textContent =
        "Submitting answer and generating analysis...";

    // 2. Mock API call to submit answer (Real POST request goes here)
    console.log("Submitting Answer:", {
        questionText: questions[currentQuestionIndex - 1].question,
        answer: answerInput.value,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Load next question
    displayNextQuestion();

    // 4. Re-enable controls
    answerInput.disabled = false;
}

// Function to skip the question (just loads the next one)
function skipQuestion() {
    console.log(`Question ${currentQuestionIndex} skipped.`);
    displayNextQuestion();
}

// Function to end the interview
function endInterview() {
    clearInterval(timerInterval);
    // TODO: Send final interview session data to backend for report generation
    alert("Interview terminated. Redirecting to Report Page.");
    // window.location.href = 'interview-report.html';
}

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    updateTimerDisplay(); // Set initial time
    initializeInterview();

    // Button Handlers
    startInterviewBtn.addEventListener("click", startInterviewSession);
    nextBtn.addEventListener("click", submitAnswer);
    skipBtn.addEventListener("click", skipQuestion);
    endBtn.addEventListener("click", endInterview);

    // Speak Button (Simulated Speech-to-Text Toggle)
    speakToggleBtn.addEventListener("click", () => {
        if (speakToggleBtn.dataset.speaking === "true") {
            // STOP SPEAKING
            speakToggleBtn.dataset.speaking = "false";
            speakToggleBtn.classList.remove("bg-red-600/90");
            speakToggleBtn.classList.add("bg-green-600/90");
            speakText.textContent = "Start Speaking";
            answerInput.readOnly = false;
        } else {
            // START SPEAKING
            speakToggleBtn.dataset.speaking = "true";
            speakToggleBtn.classList.remove("bg-green-600/90");
            speakToggleBtn.classList.add("bg-red-600/90");
            speakText.textContent = "Recording...";
            answerInput.readOnly = true;

            // Mock: transcription after 5 seconds
            setTimeout(() => {
                if (speakToggleBtn.dataset.speaking === "true") {
                    answerInput.value +=
                        " (Simulated transcription completed successfully.)";
                    speakToggleBtn.click(); // Stop speaking automatically
                }
            }, 5000);
        }
    });
});
