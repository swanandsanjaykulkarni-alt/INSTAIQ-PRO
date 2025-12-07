// client/src/pages/ChatInterview.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";


// --- CONFIGURATION & API ENDPOINTS ---
const API_BASE_URL = "http://localhost:3000";
const QUESTIONS_API_URL = `${API_BASE_URL}/api/questions`;
const INTERVIEW_API_URL = `${API_BASE_URL}/api/interview`;

// --- HELPER FUNCTION ---
// Converts string (e.g., "Software Engineering") to URL slug (e.g., "software-engineering")

const enterFullscreen = () => {
  const elem = document.documentElement;

  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
};
const toKebabCase = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^-a-z0-9]/g, "");
};

// --- CHAT MESSAGE STRUCTURE ---
const ChatMessage = ({ sender, message, type = "normal" }) => {
    const isAI = sender === "ai";
    const baseClass = "p-3 rounded-xl max-w-[80%] my-1";
    
    // Tailwind classes based on sender
    const senderClasses = isAI 
        ? "bg-indigo-100 text-gray-800 self-start" 
        : "bg-green-100 text-gray-900 self-end";
    
    const feedbackClasses = type === "feedback" ? "border-t-2 border-indigo-400 mt-2" : "";

    return (
        <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
            <div className={`${baseClass} ${senderClasses} ${feedbackClasses}`}>
                <span className="font-semibold">{isAI ? "AI: " : "You: "}</span>
                {message}
            </div>
        </div>
    );
};

const ChatInterview = () => {
    const navigate = useNavigate();
    
    // --- State Management ---
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Index of the question to be displayed/answered
    const [interviewTimeLeft, setInterviewTimeLeft] = useState(40 * 60); // 40 minutes
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [answerInput, setAnswerInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    
    // Refs for mutable values that don't trigger re-renders
    const timerRef = useRef();
    const sessionAnswersRef = useRef([]);
    const chatContainerRef = useRef(null);

    // --- Session Context (from localStorage) ---
    const interviewId = localStorage.getItem("current_interview_id");
    const currentUserId = localStorage.getItem("user_id");
    const selectedType = localStorage.getItem("current_interview_type") || "Technical";
    
    const selectedDomain = localStorage.getItem("selected_technical_domain") || null;
    const selectedMode = localStorage.getItem("selected_interview_mode") || "chat";
    
    const contextText = `${selectedType}${selectedDomain ? ` / ${selectedDomain}` : ''} / ${selectedMode}`;

    //tab changing function
 useEffect(() => {
    const handleCheat = async () => {
        console.log("User switched tab — ending interview");

        // Mark as cheated
        localStorage.setItem("cheated", "true");

        // Optional: Notify backend
        try {
            await fetch("http://localhost:5000/api/interviews/force-end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId: interviewId,
                    reason: "User switched tab"
                })
            });
        } catch (err) {
            console.error("Error notifying server about cheating:", err);
        }

        // Redirect to cheated page
        navigate("/cheated", { replace: true });
    };

    const handleVisibility = () => {
        if (document.hidden) handleCheat();
    };

    const handleBlur = () => {
        handleCheat();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("blur", handleBlur);
    };
}, [interviewId, navigate]);


    // --- Functions ---

    // 🕒 Timer Logic (Hooked into useEffect)
    const updateTimer = useCallback(() => {
        setInterviewTimeLeft(prev => {
            if (prev <= 1) {
                // Time's up
                clearInterval(timerRef.current);
                endInterview(true);
                return 0;
            }
            return prev - 1;
        });
    }, []);

    // 💬 Appends message and scrolls to bottom
    const appendChatMessage = useCallback((sender, message, type = "normal") => {
        setChatHistory(prev => [...prev, { sender, message, type }]);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);


    // 🧠 Fetch Questions
    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        const normalizedType = selectedType.charAt(0).toUpperCase() + selectedType.slice(1).toLowerCase();
        const normalizedMode = selectedMode.toLowerCase(); 
        const branchSlug = selectedType === "Technical" ? toKebabCase(selectedDomain) : "";

        let url = `${QUESTIONS_API_URL}?category=${encodeURIComponent(normalizedType)}&mode=${encodeURIComponent(normalizedMode)}`;
        
        if (normalizedType === "Technical" && branchSlug) {
            url += `&branch=${encodeURIComponent(branchSlug)}`;
        }

        appendChatMessage("ai", "Fetching questions from server...");

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const data = await response.json();
            
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
                appendChatMessage("ai", `✅ ${data.questions.length} questions loaded. Press "Start Interview" to begin.`);
            } else {
                appendChatMessage("ai", `⚠️ No questions found for this selection.`);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            appendChatMessage("ai", `FATAL ERROR: Could not fetch questions.`);
        } finally {
            setIsLoading(false);
        }
    }, [selectedType, selectedMode, selectedDomain, appendChatMessage]);

    // 🚀 Start Interview (Runs when the button is clicked)
    const startInterview = () => {
          enterFullscreen(); 
        if (questions.length === 0) return alert("Cannot start, no questions loaded.");

        setIsInterviewActive(true);
        setAnswerInput('');
        sessionAnswersRef.current = [];

        // Start the timer
        timerRef.current = setInterval(updateTimer, 1000);

        // Display the first question
        const firstQuestion = questions[0];
        appendChatMessage("ai", `Q1: ${firstQuestion.question}`);
        setCurrentQuestionIndex(1); // Set index to the next slot (Q2)
    };

   // 📝 Submit Answer
const submitAnswer = async () => {
    const userAnswer = answerInput.trim();
    if (!userAnswer) return alert("Please type your answer before proceeding.");

    const answeredQIndex = currentQuestionIndex - 1;
    if (answeredQIndex < 0 || answeredQIndex >= questions.length) return;

    const q = questions[answeredQIndex];
    appendChatMessage("user", userAnswer);

    // Call evaluation API
    try {
        appendChatMessage("ai", "Evaluating your answer...");
        const evalRes = await fetch(`${INTERVIEW_API_URL}/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q.question, userAnswer }),
        });

        if (!evalRes.ok) throw new Error(`Evaluation failed: ${evalRes.status}`);
        const data = await evalRes.json();

        appendChatMessage("ai", data.evaluation.Feedback, "feedback");

        // Save evaluated answer
        sessionAnswersRef.current.push({
            question: q.question,
            userAnswer,
            evaluation: data.evaluation
        });

    } catch (err) {
        console.error("Evaluation error:", err);
        sessionAnswersRef.current.push({
            question: q.question,
            userAnswer,
            evaluation: null
        });
        appendChatMessage("ai", "⚠️ Evaluation failed for this answer.", "feedback");
    }

    // Move to next question
    if (currentQuestionIndex < questions.length) {
        const nextQuestion = questions[currentQuestionIndex];
        appendChatMessage("ai", `Q${currentQuestionIndex + 1}: ${nextQuestion.question}`);
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswerInput('');
    } else {
        appendChatMessage("ai", "✅ Interview complete! Click End Interview to save results.");
        clearInterval(timerRef.current);
        setAnswerInput('');
    }
};


    // ⏭️ Skip Question
    const skipQuestion = () => {
        const skippedQIndex = currentQuestionIndex - 1;
        if (skippedQIndex < 0 || skippedQIndex >= questions.length) return; // Should not happen in active state

        const q = questions[skippedQIndex];
        appendChatMessage("ai", `⏩ Skipped: ${q.question}`);
        
        // Record the skipped question
        sessionAnswersRef.current.push({
            question: q.question,
            userAnswer: "[SKIPPED]",
        });
        
        // Move to next question or end
        if (currentQuestionIndex < questions.length) {
            const nextQuestion = questions[currentQuestionIndex];
            appendChatMessage("ai", `Q${currentQuestionIndex + 1}: ${nextQuestion.question}`);
            setCurrentQuestionIndex(prev => prev + 1);
            setAnswerInput('');
        } else {
            appendChatMessage("ai", "✅ Interview complete! Click End Interview to save results.");
            clearInterval(timerRef.current);
        }
    };

    // 🏁 End Interview (Submit all answers together)
    const endInterview = useCallback(async (timeExpired = false) => {
        clearInterval(timerRef.current);
        setIsInterviewActive(false);
        
        appendChatMessage("ai", "📄 Submitting your interview responses...");

        try {
            const branchToSend = selectedType === "Technical" && selectedDomain
                ? toKebabCase(selectedDomain)
                : null;

            const payload = {
                userId: currentUserId,
                category: selectedType,
                branch: branchToSend,
                mode: selectedMode,
                answers: sessionAnswersRef.current, // Use the reference value
            };

            const res = await fetch(`${INTERVIEW_API_URL}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server failed to save. Status: ${res.status}. Response: ${errorText}`);
            }

            const data = await res.json();
            localStorage.setItem("last_interview_id", data.interview._id);

            // Redirect to feedback page
            navigate(`/reports?id=${data.interview._id}`);

        } catch (err) {
            console.error("Save error:", err);
            appendChatMessage("ai", `❌ Failed to save interview. Error: ${err.message}`);
            // Re-enable end button for user to try again if needed
            setIsInterviewActive(false); 
        }
    }, [selectedType, selectedDomain, selectedMode, currentUserId, appendChatMessage, navigate]);

    // --- useEffect Hook for Initialization ---
    useEffect(() => {
        // Initial data fetch
        if (!interviewId || !currentUserId) {
            alert("Session data missing. Redirecting to start.");
            navigate('/interview-selection');
            return;
        }
        fetchQuestions();
        
        // Cleanup function for the timer
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [interviewId, currentUserId, navigate, fetchQuestions]);

    useEffect(() => {
  const handleFullscreenExit = () => {
    if (!document.fullscreenElement) {
      localStorage.setItem("cheated", "true");
      navigate("/cheated", { replace: true });
    }
  };

  document.addEventListener("fullscreenchange", handleFullscreenExit);

  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenExit);
  };
}, [navigate]);

useEffect(() => {
  const handleKeyControl = (e) => {
    if (
      e.key === "Escape" ||
      e.key === "F11" ||
      (e.altKey && e.key === "Tab")
    ) {
      e.preventDefault();
      localStorage.setItem("cheated", "true");
      navigate("/cheated");
    }
  };

  window.addEventListener("keydown", handleKeyControl);

  return () => window.removeEventListener("keydown", handleKeyControl);
}, [navigate]);


    // Timer format conversion
    const min = Math.floor(interviewTimeLeft / 60);
    const sec = interviewTimeLeft % 60;
    const formattedTime = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

    // Conditional button states
    const isNextDisabled = !isInterviewActive || answerInput.trim() === '' || currentQuestionIndex > questions.length;
    const isSkipDisabled = !isInterviewActive || currentQuestionIndex > questions.length;
    const isEndDisabled = !isInterviewActive && !questions.length; // Allow ending even if not active, if questions were loaded
    
    // Determine the current question text to display
    let currentQuestionText = "Loading...";
    if (!isLoading && chatHistory.length === 0) {
        currentQuestionText = `✅ ${questions.length} questions loaded. Press "Start Interview" to begin.`;
    } else if (isInterviewActive && currentQuestionIndex <= questions.length) {
        currentQuestionText = `Question ${currentQuestionIndex} of ${questions.length}`;
    } else if (currentQuestionIndex > questions.length) {
        currentQuestionText = "All questions answered. Click 'End Interview'.";
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">

                {/* Header */}
                <header className="p-4 bg-gray-800 text-white shadow-lg flex justify-between items-center flex-shrink-0">
                    <div className="text-xl font-bold tracking-wider">AI Chat Interview</div>
                    <div className="flex items-center space-x-4">
                        <div className="text-lg font-semibold" id="interviewContext">{contextText}</div>
                        <div className={`py-1 px-3 rounded-md text-lg font-mono font-bold ${interviewTimeLeft < 60 ? 'bg-red-600' : 'bg-green-600'}`} id="interviewTimer">{formattedTime}</div>
                    </div>
                </header>

                {/* Question Display */}
                <div className="p-3 bg-indigo-50 border-b border-indigo-200 flex-shrink-0">
                    <p id="currentQuestionDisplay" className="text-lg font-medium text-gray-800">
                        {currentQuestionText}
                    </p>
                    {/* Placeholder for real-time feedback (not used in this final logic, but kept for future) */}
                    <p id="evaluationFeedback" className="mt-1 text-sm font-semibold text-green-700"></p> 
                </div>

                {/* Chat History */}
                <main ref={chatContainerRef} id="chatHistoryContainer" className="flex-grow p-6 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                    {chatHistory.map((msg, index) => (
                        <ChatMessage key={index} sender={msg.sender} message={msg.message} type={msg.type} />
                    ))}
                    {isLoading && <ChatMessage sender="ai" message="Loading resources... please wait." />}
                </main>

                {/* Footer and Controls */}
                <footer className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
  {!isInterviewActive && questions.length > 0 && (
    <Tippy content="Click to start your AI-powered chat interview" placement="top">
      <button 
        id="startInterviewBtn" 
        onClick={startInterview}
        className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold rounded-lg shadow-md transition duration-300 ${isLoading ? 'disabled:bg-gray-400' : ''}`}
        disabled={isLoading || questions.length === 0}
      >
        Start Chat Interview
      </button>
    </Tippy>
  )}

  {(isInterviewActive || currentQuestionIndex > questions.length) && (
    <div id="inInterviewControls" className="flex flex-col space-y-3">
      <textarea 
        id="answerInput" 
        rows="3" 
        placeholder="Type your detailed answer here..." 
        value={answerInput}
        onChange={(e) => setAnswerInput(e.target.value)}
        disabled={currentQuestionIndex > questions.length}
        className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
      ></textarea>
      
      <div className="flex justify-between items-center">
        <Tippy content="Skip this question and move to the next one" placement="top">
          <button 
            id="skipBtn" 
            onClick={skipQuestion}
            className="px-5 py-2 text-white font-semibold bg-yellow-600 hover:bg-yellow-700 rounded-lg transition disabled:bg-gray-500" 
            disabled={isSkipDisabled}
          >
            Skip Question
          </button>
        </Tippy>

        <div className="space-x-4 flex">
          <Tippy content="Submit your answer and load the next question" placement="top">
            <button 
              id="nextBtn" 
              onClick={submitAnswer}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition disabled:bg-gray-500" 
              disabled={isNextDisabled}
            >
              Submit & Next
            </button>
          </Tippy>

          <Tippy content="Finish your interview and view the detailed report" placement="top">
            <button 
              id="endBtn" 
              onClick={() => endInterview(false)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition"
              disabled={isEndDisabled}
            >
              End Interview
            </button>
          </Tippy>
        </div>
      </div>
    </div>
  )}
</footer>

            </div>
        </div>
    );
};

export default ChatInterview;