// client/src/pages/VirtualInterview.jsx (FIXED VERSION)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION & API ENDPOINTS ---
const API_BASE_URL = "http://localhost:3000";
const QUESTIONS_API_URL = `${API_BASE_URL}/api/questions`;
const INTERVIEW_API_URL = `${API_BASE_URL}/api/interview`;

// --- HELPER FUNCTION ---
const toKebabCase = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^-a-z0-9]/g, "");
};

const VirtualInterview = () => {
    const navigate = useNavigate();

    // --- State Management ---
    const [questions, setQuestions] = useState([]);
    const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0); // 0 before start, 1 for Q1, etc.
    const [interviewTimeLeft, setInterviewTimeLeft] = useState(40 * 60);
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [answerInput, setAnswerInput] = useState('');
    const [feedback, setFeedback] = useState({ score: null, message: '' });
    const [isSpeaking, setIsSpeaking] = useState(false);

    // --- Refs for mutable DOM elements and internal state ---
    const timerRef = useRef();
    const sessionAnswersRef = useRef([]);
    const userVideoRef = useRef(null);
    const streamRef = useRef(null);

    // --- Session Context (from localStorage) ---
    const interviewId = localStorage.getItem("current_interview_id");
    const currentUserId = localStorage.getItem("user_id");
    const selectedMode = localStorage.getItem("selected_interview_mode") || "video";
    const selectedType = localStorage.getItem("current_interview_type") || "Technical";
    const selectedDomain = localStorage.getItem("selected_technical_domain") || null;

    const contextText = `${selectedType} / Video Interview ${selectedDomain ? ` (${selectedDomain})` : ''}`;

    // --- Core Interview Flow Logic (FIXED) ---

    // 🕒 Timer Logic
    const endInterview = useCallback(async (timeExpired = false) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsInterviewActive(false);
        setFeedback(prev => ({ ...prev, message: timeExpired ? "Time Expired. Finalizing report..." : "Ending interview. Finalizing report..." }));
        
        // Final Save API Call (omitted for brevity, assume success and redirect)
        // ... (API call from original code)

        try {
            // ... (API save logic)
            const payload = {
                userId: currentUserId,
                category: selectedType,
                branch: selectedType === "Technical" ? toKebabCase(selectedDomain) : null,
                mode: selectedMode,
                answers: sessionAnswersRef.current,
            };

            const res = await fetch(`${INTERVIEW_API_URL}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Server failed to save the interview results.");

            const data = await res.json();
            localStorage.setItem("last_interview_id", data.interview._id);
            navigate(`/reports?id=${data.interview._id}`);

        } catch (error) {
            console.error("❌ Error saving interview:", error);
            setFeedback(prev => ({ ...prev, message: `Failed to save interview. Error: ${error.message}` }));
        }

    }, [currentUserId, selectedType, selectedDomain, selectedMode, navigate]);

    const updateTimer = useCallback(() => {
        setInterviewTimeLeft(prev => {
            if (prev <= 1) {
                endInterview(true);
                return 0;
            }
            return prev - 1;
        });
    }, [endInterview]);
    
    // 📢 Display Current Question
    const displayQuestion = useCallback((qNum) => {
        // Clear previous answers/feedback
        setAnswerInput('');
        setFeedback(prev => ({ ...prev, score: null, message: '' }));
        
        const qIndex = qNum - 1;

        if (qIndex >= 0 && qIndex < questions.length) {
            const questionObj = questions[qIndex];
            setFeedback(prev => ({ ...prev, message: `Q${qNum}: ${questionObj.question}` }));
            setIsInterviewActive(true); // Re-enable controls
        } else if (qNum > questions.length) {
            // End of questions
            setFeedback(prev => ({ ...prev, message: "Interview Complete! Press 'End Interview' to see your report." }));
            setIsInterviewActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [questions.length]);

    // 🧠 Fetch Questions (UNCHANGED)
    const fetchQuestions = useCallback(async () => {
        // ... (fetch logic remains the same)
        setIsLoading(true);
        const normalizedType = selectedType.charAt(0).toUpperCase() + selectedType.slice(1).toLowerCase();
        const normalizedMode = selectedMode.toLowerCase();
        const branchSlug = selectedType === "Technical" ? toKebabCase(selectedDomain) : "";
        let url = `${QUESTIONS_API_URL}?category=${encodeURIComponent(normalizedType)}&mode=${encodeURIComponent(normalizedMode)}`;
        if (normalizedType === "Technical" && branchSlug) {
            url += `&branch=${encodeURIComponent(branchSlug)}`;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
                setFeedback(prev => ({ ...prev, message: `✅ ${data.questions.length} questions loaded. Press "Start Interview" to begin.` }));
            } else {
                setQuestions([]);
                setFeedback(prev => ({ ...prev, message: `⚠️ No questions found for this selection.` }));
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setFeedback(prev => ({ ...prev, message: `FATAL ERROR: API connection failed.` }));
        } finally {
            setIsLoading(false);
        }
    }, [selectedType, selectedMode, selectedDomain]);

    // 📹 Request Media Access (UNCHANGED)
    const requestMediaAccess = useCallback(async () => {
    const mediaConstraints = { video: true, audio: true };
      try {
         const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
         streamRef.current = stream;
        if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
        await userVideoRef.current.play(); // <-- ensure video plays
        }
       setIsSpeaking(false);
      } catch (err) {
      console.error("Media access error: ", err);
      setFeedback(prev => ({
      ...prev,
      message: (prev.message || "") + " (⚠️ Camera/Mic access blocked.)"
    }));
    setIsSpeaking(false);
  }
}, []);
 
   useEffect(() => {
  if (userVideoRef.current && streamRef.current) {
    userVideoRef.current.srcObject = streamRef.current;
  }
}, [streamRef.current]);



    // 🚀 Start Interview Session (FIXED: Sets question number to 1)
    const startInterviewSession = () => {
        if (questions.length === 0) return alert("Cannot start, no questions loaded.");

        // Initialize session state
        setIsInterviewActive(true);
        sessionAnswersRef.current = [];
        
        // Start Timer
        timerRef.current = setInterval(updateTimer, 1000);

        // Request Media
        requestMediaAccess();

        // Start with Question 1
        setCurrentQuestionNumber(1); 
    };
    
    // 📝 Submit Answer (FIXED: Uses currentQuestionNumber, then increments it)
    const submitAnswer = async () => {
        const userAnswer = answerInput.trim();
        const answeredQIndex = currentQuestionNumber - 1; 

        if (answeredQIndex < 0 || answeredQIndex >= questions.length) return;
        const questionObj = questions[answeredQIndex];

        if (!userAnswer) {
            alert("Please provide an answer before moving to the next question.");
            return;
        }

        // 1. Disable controls while processing
        setIsInterviewActive(false); 
        setFeedback(prev => ({ ...prev, message: "Submitting answer and generating analysis..." }));

        // 2. API call to submit answer and get evaluation
        try {
            // ... (API call logic)
            const payload = {
                interviewId: interviewId, 
                question: questionObj.question,
                userAnswer: userAnswer, 
            };
            const response = await fetch(`${INTERVIEW_API_URL}/evaluate`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Evaluation failed on the backend.");
            const data = await response.json();
            const evaluation = data.evaluation;
            
            // 3. Store the result
            sessionAnswersRef.current.push({ question: questionObj.question, userAnswer: userAnswer, evaluation: evaluation });

            // 4. Update UI with immediate feedback
            setFeedback({ score: evaluation.TotalScore, message: `Q${currentQuestionNumber} Score: ${evaluation.TotalScore}/10. Feedback: ${evaluation.Feedback}` });

            // 5. ADVANCE the question number
            setCurrentQuestionNumber(prev => prev + 1);
            
        } catch (error) {
            setFeedback(prev => ({ ...prev, message: `Submission Error: ${error.message}. Please try again.` }));
        }
    };

    // ⏭️ Skip Question (FIXED: Uses currentQuestionNumber, then increments it)
    const skipQuestion = () => {
        const skippedQIndex = currentQuestionNumber - 1; 

        if (skippedQIndex < 0 || skippedQIndex >= questions.length) {
            setCurrentQuestionNumber(prev => prev + 1);
            return;
        }
        
        const questionObj = questions[skippedQIndex];

        // Record the skipped question
        sessionAnswersRef.current.push({
            question: questionObj.question,
            userAnswer: "[SKIPPED]",
            evaluation: { TotalScore: 0, Feedback: "Question was skipped by the user." },
        });
        
        // ADVANCE THE QUESTION NUMBER
        setCurrentQuestionNumber(prev => prev + 1); 
    };

    // 🗣️ Speak Toggle Logic (UNCHANGED)
    const toggleSpeaking = () => {
        if (isSpeaking) {
            setIsSpeaking(false);
            if (answerInput.length > 0) {
                setAnswerInput(prev => prev + " (Simulated transcription completed successfully.)");
            }
        } else {
            setIsSpeaking(true);
            setTimeout(() => {
                // If the user hasn't manually stopped, auto-stop after 5 seconds
                setIsSpeaking(false); 
            }, 5000);
        }
    };
    
    // --- Initial Load & Cleanup useEffect ---
    useEffect(() => {
    if (!interviewId || !currentUserId) {
        alert("Session data missing. Redirecting to selection.");
        navigate('/interview-selection');
        return;
    }
    fetchQuestions();

    // ⬇️ Move camera start logic here for debugging
    requestMediaAccess();

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };
}, [interviewId, currentUserId, navigate, fetchQuestions]);


    // --- Question Advancement useEffect (Calls displayQuestion whenever the number changes) ---
    useEffect(() => {
        if (currentQuestionNumber > 0) {
            displayQuestion(currentQuestionNumber);
        }
    }, [currentQuestionNumber, displayQuestion]);

    // Conditional button states
    const isStartDisabled = isLoading || questions.length === 0;
    const isNextDisabled = !isInterviewActive || answerInput.trim() === '' || currentQuestionNumber > questions.length;
    const isSkipDisabled = !isInterviewActive || currentQuestionNumber > questions.length;
    const isEndDisabled = isLoading && questions.length === 0; // Only allow ending if data is loaded or there are answers to submit

    // Timer format and question display (UNCHANGED)
    const min = Math.floor(interviewTimeLeft / 60);
    const sec = interviewTimeLeft % 60;
    const formattedTime = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    
    // ... (The render logic below remains largely the same)

    return (
        <div className="w-screen h-screen bg-gray-900 flex flex-col" style={{ overflow: 'hidden' }}>

            {/* Video Background */}
            <div id="video-background" className="w-full h-full absolute inset-0 bg-black z-0">
                <video 
                    ref={userVideoRef}
                    id="userVideoFeed" 
                    autoPlay 
                    playsInline 
                    muted
                    className="absolute top-0 left-0 w-full h-full object-cover" 
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
            </div>

            {/* Main Overlay Content */}
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">

                {/* Header/Question Bar */}
                 {/* --- Transparent Question Box (Fixed at Top) --- */}
                
                 {/* --- Transparent Question Box with Timer --- */}
<div
  id="questionBox"
  className="fixed top-6 left-1/2 transform -translate-x-1/2 
             w-11/12 max-w-4xl flex justify-between items-center
             bg-indigo-900/40 backdrop-blur-xl border border-indigo-400/30
             rounded-2xl px-6 py-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]
             text-white font-semibold text-lg tracking-wide z-20"
>
  {/* Question Text */}
  <span className="flex-1 text-center drop-shadow-lg">
    {feedback.message
      ? feedback.message
      : currentQuestionNumber === 0
      ? "Press 'Start Interview' to begin."
      : "Waiting for next question..."}
  </span>

  {/* Timer */}
  <span className="ml-4 px-4 py-2 bg-black/40 rounded-xl border border-indigo-300/40 font-bold text-white text-base shadow-lg">
    ⏱ {`${Math.floor(interviewTimeLeft / 60)
      .toString()
      .padStart(2, "0")}:${(interviewTimeLeft % 60)
      .toString()
      .padStart(2, "0")}`}
  </span>
</div>



                {/* Start Button (Centered) */}
                <main className="flex-grow flex flex-col items-center justify-center">
                    {!isInterviewActive && !isStartDisabled && questions.length > 0 && (
                        <button 
                            id="startInterviewBtn" 
                            onClick={startInterviewSession}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold rounded-full shadow-xl transition duration-300 disabled:bg-gray-500" 
                            disabled={isStartDisabled}
                        >
                            Start Interview
                        </button>
                    )}
                </main>

                {/* Footer Controls */}
               <footer
  id="inInterviewControls"
  className={`absolute bottom-0 left-0 right-0 bg-gray-900/70 backdrop-blur-md p-6 rounded-t-xl shadow-lg w-full flex flex-col space-y-5 ${
    isInterviewActive || currentQuestionNumber > questions.length ? "" : "hidden"
  }`}
>
 

  {/* Answer Input Box */}
  <textarea
    id="answerInput"
    rows="3"
    placeholder="Type your answer here, or press 'Start Speaking'..."
    value={answerInput}
    onChange={(e) => setAnswerInput(e.target.value)}
    readOnly={isSpeaking}
    disabled={currentQuestionNumber > questions.length}
    className="w-full p-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 resize-none outline-none shadow-inner bg-white/80"
  />

  {/* Controls Section */}
  <div className="flex flex-wrap justify-between items-center gap-4">
    {/* Speak Button */}
    <button
      id="speakToggleBtn"
      onClick={toggleSpeaking}
      className={`flex items-center px-5 py-2 text-white font-semibold rounded-full transition duration-150 ${
        isSpeaking
          ? "bg-red-600 hover:bg-red-700"
          : "bg-green-600 hover:bg-green-700"
      } disabled:bg-gray-500`}
      disabled={!streamRef.current || currentQuestionNumber > questions.length}
    >
      <svg
        className="w-5 h-5 mr-2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M15.5 8.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-4a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v4zM4.5 8.5a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5v-4a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v4zM10 12a5 5 0 005-5v-1a.5.5 0 011 0v1a6 6 0 01-12 0v-1a.5.5 0 011 0v1a5 5 0 005 5z"
          clipRule="evenodd"
        />
      </svg>
      <span id="speakText">
        {isSpeaking ? "Recording..." : "Start Speaking"}
      </span>
    </button>

    {/* Navigation Buttons */}
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        id="skipBtn"
        onClick={skipQuestion}
        className="px-5 py-2 text-white font-semibold bg-yellow-600 hover:bg-yellow-700 rounded-full transition duration-150 disabled:bg-gray-500"
        disabled={isSkipDisabled}
      >
        Skip
      </button>
      <button
        id="nextBtn"
        onClick={submitAnswer}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md transition duration-150 disabled:bg-gray-500"
        disabled={isNextDisabled}
      >
        Next
      </button>
      <button
        id="endBtn"
        onClick={() => endInterview(false)}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-md transition duration-150"
        disabled={isEndDisabled}
      >
        End
      </button>
    </div>
  </div>
</footer>


            </div>
        </div>
    );
};

export default VirtualInterview;