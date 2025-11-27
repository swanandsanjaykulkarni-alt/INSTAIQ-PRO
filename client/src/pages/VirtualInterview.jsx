import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Tippy from "@tippyjs/react";
import 'tippy.js/dist/tippy.css';


// --- CONFIGURATION & API ENDPOINTS ---
const API_BASE_URL = "http://localhost:3000";
const QUESTIONS_API_URL = `${API_BASE_URL}/api/questions`;
const INTERVIEW_API_URL = `${API_BASE_URL}/api/interview`;
const QUESTION_TIME_LIMIT = 120; // 2 minutes in seconds

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
    const [interviewTimeLeft, setInterviewTimeLeft] = useState(30 * 60); // 30 minutes total
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [answerInput, setAnswerInput] = useState('');
    const [feedback, setFeedback] = useState({ score: null, message: '' });
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [questionTimeLeft, setQuestionTimeLeft] = useState(0); 

    // --- Refs for mutable DOM elements and internal state ---
    const timerRef = useRef(); // Overall interview timer
    const questionTimerRef = useRef(); // Question-specific timer
    const sessionAnswersRef = useRef([]);
    const userVideoRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null); // 🆕 For speech recognition instance

    // --- Session Context (from localStorage) ---
    const interviewId = localStorage.getItem("current_interview_id");
    const currentUserId = localStorage.getItem("user_id");
    const selectedMode = localStorage.getItem("selected_interview_mode") || "video";
    const selectedType = localStorage.getItem("current_interview_type") || "Technical";
    const selectedDomain = localStorage.getItem("selected_technical_domain") || null;

    // --- Core Interview Flow Logic ---

    // 📝 Submit Answer (Needs to be defined early for use in updateQuestionTimer)
    const submitAnswer = useCallback(async (isAutoSubmit = false) => {
      // Stop mic if active
if (recognitionRef.current) {
  recognitionRef.current.stop();
  recognitionRef.current = null;
}
setIsSpeaking(false);

        if (recognitionRef.current) recognitionRef.current.stop(); // stop mic on submit

        const answeredQIndex = currentQuestionNumber - 1; 
        
        // 1. CLEAR QUESTION TIMER
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        setQuestionTimeLeft(0);
        
        const userAnswer = answerInput.trim();
        const questionObj = questions[answeredQIndex];

        // Check for necessary data before proceeding
        if (answeredQIndex < 0 || answeredQIndex >= questions.length) return;

        if (!userAnswer && !isAutoSubmit) {
            alert("Please provide an answer before moving to the next question.");
            // Re-start the timer since the user was blocked from submitting
            setQuestionTimeLeft(QUESTION_TIME_LIMIT); 
            questionTimerRef.current = setInterval(updateQuestionTimer, 1000); 
            return;
        }

        // 2. Disable controls while processing
        setIsInterviewActive(false); 
        setFeedback(prev => ({ ...prev, message: isAutoSubmit ? "Time's up! Generating analysis..." : "Submitting answer and generating analysis..." }));

        // 3. API call to submit answer and get evaluation
        try {
            const finalAnswer = isAutoSubmit && !userAnswer ? "[TIMED OUT - EMPTY ANSWER]" : userAnswer;

            const payload = {
                interviewId: interviewId, 
                question: questionObj.question,
                userAnswer: finalAnswer, 
            };
            const response = await fetch(`${INTERVIEW_API_URL}/evaluate`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Evaluation failed on the backend.");
            const data = await response.json();
            const evaluation = data.evaluation;
            
            // 4. Store the result
            sessionAnswersRef.current.push({ question: questionObj.question, userAnswer: finalAnswer, evaluation: evaluation });

            // 5. Update UI with immediate feedback
            setFeedback({ score: evaluation.TotalScore, message: `Q${currentQuestionNumber} Score: ${evaluation.TotalScore}/10. Feedback: ${evaluation.Feedback}` });

            // 6. ADVANCE the question number
            setCurrentQuestionNumber(prev => prev + 1);
            
        } catch (error) {
            setFeedback(prev => ({ ...prev, message: `Submission Error: ${error.message}. Please try again.` }));
            setIsInterviewActive(true); // Re-enable controls on error
        }
    }, [currentQuestionNumber, answerInput, questions, interviewId]); // Dependencies added

    // 🕒 Question Timer Logic (Must be defined after submitAnswer)
    const updateQuestionTimer = useCallback(() => {
        setQuestionTimeLeft(prev => {
            if (prev <= 1) {
                if (questionTimerRef.current) clearInterval(questionTimerRef.current);
                setFeedback(p => ({ ...p, message: "Time's up! Auto-submitting answer..." }));
                
                // Call submitAnswer directly (it handles state updates and advancement)
                if (recognitionRef.current) {
  recognitionRef.current.stop();
  recognitionRef.current = null;
  setIsSpeaking(false);
}

                submitAnswer(true); 
                return 0;
            }
            return prev - 1;
        });
    }, [submitAnswer]); // submitAnswer must be in the dependency array

    // 🕒 Timer Logic - Overall Interview (UNCHANGED)
    const endInterview = useCallback(async (timeExpired = false) => {
      // Stop mic if active
if (recognitionRef.current) {
  recognitionRef.current.stop();
  recognitionRef.current = null;
}
setIsSpeaking(false);

        if (recognitionRef.current) recognitionRef.current.stop();

        if (timerRef.current) clearInterval(timerRef.current);
        if (questionTimerRef.current) clearInterval(questionTimerRef.current); // Clear question timer on end
        
        setIsInterviewActive(false);
        setFeedback(prev => ({ ...prev, message: timeExpired ? "Time Expired. Finalizing report..." : "Ending interview. Finalizing report..." }));
        
        try {
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
    
    // 📢 Display Current Question (MODIFIED to start the question timer)
    const displayQuestion = useCallback((qNum) => {
        // Clear previous question timer if running
        if (questionTimerRef.current) clearInterval(questionTimerRef.current); 

        // Clear previous answers/feedback
        setAnswerInput('');
        setFeedback(prev => ({ ...prev, score: null, message: '' }));
        
        const qIndex = qNum - 1;

        if (qIndex >= 0 && qIndex < questions.length) {
            const questionObj = questions[qIndex];
            setFeedback(prev => ({ ...prev, message: `Q${qNum}: ${questionObj.question}` }));
            setIsInterviewActive(true); // Re-enable controls

            // NEW: Start Question Timer (2 minutes = 120 seconds)
            setQuestionTimeLeft(QUESTION_TIME_LIMIT); 
            questionTimerRef.current = setInterval(updateQuestionTimer, 1000); 

        } else if (qNum > questions.length) {
            // End of questions
            setFeedback(prev => ({ ...prev, message: "Interview Complete! Press 'End Interview' to see your report." }));
            setIsInterviewActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [questions.length, updateQuestionTimer]);

    // 🧠 Fetch Questions (UNCHANGED)
    const fetchQuestions = useCallback(async () => {
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
         await userVideoRef.current.play(); 
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


    // 🚀 Start Interview Session (UNCHANGED)
    const startInterviewSession = () => {
        if (questions.length === 0) return alert("Cannot start, no questions loaded.");

        // Initialize session state
        setIsInterviewActive(true);
        sessionAnswersRef.current = [];
        
        // Start Overall Timer
        timerRef.current = setInterval(updateTimer, 1000);

        // Request Media
        requestMediaAccess();

        // Start with Question 1 (Triggers displayQuestion via useEffect)
        setCurrentQuestionNumber(1); 
    };

    // ⏭️ Skip Question (MODIFIED: Clears question timer)
    const skipQuestion = () => {
        // Clear Question Timer
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        setQuestionTimeLeft(0);
        
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

    // 🗣️ Speak Toggle Logic (MODIFIED for better simulation)
   // 🎤 SPEAKING FUNCTION (Continuous Listening until manually stopped)

   // 🎤 Improved Mic Toggle with Start/Stop Control
// 🎤 Speech Recognition Toggle with Auto-Stop on Submit/Timeout
const toggleSpeaking = () => {
  if (!isInterviewActive || currentQuestionNumber > questions.length) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }

  // --- If mic is ON, turn it OFF ---
  if (isSpeaking) {
    setIsSpeaking(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setFeedback((prev) => ({
      ...prev,
      message: "🎤 Mic turned off. You can continue typing your answer.",
    }));
    return;
  }

  // --- Otherwise, turn mic ON ---
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognitionRef.current = recognition;

  setIsSpeaking(true);
  setFeedback((prev) => ({
    ...prev,
    message: "🎙️ Listening... Speak your answer clearly.",
  }));

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    setAnswerInput(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    setIsSpeaking(false);
    setFeedback((prev) => ({
      ...prev,
      message: "⚠️ Mic error. Try again.",
    }));
  };

  recognition.onend = () => {
    // restart only if user hasn't manually stopped and interview still active
    if (isSpeaking && isInterviewActive) recognition.start();
  };

  recognition.start();
};


    
    // --- Initial Load & Cleanup useEffect (MODIFIED) ---
    useEffect(() => {
    if (!interviewId || !currentUserId) {
        alert("Session data missing. Redirecting to selection.");
        navigate('/interview-selection');
        return;
    }
    fetchQuestions();

    requestMediaAccess();

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (questionTimerRef.current) clearInterval(questionTimerRef.current); // Cleanup question timer
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };
}, [interviewId, currentUserId, navigate, fetchQuestions]);


    // --- Question Advancement useEffect (Calls displayQuestion whenever the number changes) ---
    useEffect(() => {
  if (currentQuestionNumber > 0 && questions.length > 0) {
    displayQuestion(currentQuestionNumber);
  }

  // ✅ Clean up any old question timers before next question starts
  return () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
  };
}, [currentQuestionNumber]);

// --- Detect Tab Change and Redirect to Cheated Page ---
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      navigate("/cheated");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [navigate]);



    // Conditional button states
    const isStartDisabled = isLoading || questions.length === 0;
    const isNextDisabled = !isInterviewActive || answerInput.trim() === '' || currentQuestionNumber > questions.length;
    const isSkipDisabled = !isInterviewActive || currentQuestionNumber > questions.length;
    // FIX: Only disable END button if questions are still loading OR if no questions were ever loaded.
    const isEndDisabled = isLoading && questions.length === 0; 

    // Timer format variables
    const min = Math.floor(interviewTimeLeft / 60);
    const sec = interviewTimeLeft % 60;
    const formattedTime = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

    const qMin = Math.floor(questionTimeLeft / 60);
    const qSec = questionTimeLeft % 60;
    const formattedQuestionTime = `${qMin.toString().padStart(2, "0")}:${qSec.toString().padStart(2, "0")}`;
    
    // --- Render Logic ---
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
                <div
  id="questionBox"
  className="fixed top-6 left-[55%] transform -translate-x-1/2 
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

                    {/* Timer Container */}
                    <div className="ml-4 flex flex-col items-end space-y-1"> 
                        {/* Current Question Time Left */}
                        {currentQuestionNumber > 0 && currentQuestionNumber <= questions.length && (
                            <span className={`px-4 py-1 rounded-lg border font-bold text-white text-sm shadow-md ${
                                questionTimeLeft <= 10 ? 'bg-red-600/90 border-red-300/40 animate-pulse' : 'bg-yellow-600/70 border-yellow-300/40'
                            }`}>
                                Q Time: {formattedQuestionTime}
                            </span>
                        )}
                        
                        {/* Total Interview Time Left */}
                        <span className="px-4 py-1 bg-black/40 rounded-xl border border-indigo-300/40 font-bold text-white text-base shadow-lg">
                            ⏱ Total: {formattedTime} 
                        </span>
                    </div>
                </div>



                {/* Start Button (Centered) */}
                <main className="flex-grow flex flex-col items-center justify-center">
                    {!isInterviewActive && !isStartDisabled && questions.length > 0 && (
                        <Tippy content="Begin your virtual interview session" placement="top">
  <button 
    id="startInterviewBtn" 
    onClick={startInterviewSession}
    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold rounded-full shadow-xl transition duration-300 disabled:bg-gray-500" 
    disabled={isStartDisabled}
  >
    Start Interview
  </button>
</Tippy>

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
  // ✅ Allow typing during question, only disable when interview ends
  disabled={currentQuestionNumber > questions.length}
  className="w-full p-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 resize-none outline-none shadow-inner bg-white/80"
/>




                {/* Controls Section */}
<div className="flex flex-wrap justify-between items-center gap-4">
  
  {/* 🎙️ Speak Button */}
  <Tippy content="Click to start or stop voice recording" placement="top" delay={[100, 50]}>
    <button
      id="speakToggleBtn"
      onClick={toggleSpeaking}
      className={`flex items-center px-5 py-2 text-white font-semibold rounded-full transition duration-150 ${
  isSpeaking
    ? "bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
    : "bg-green-600 hover:bg-green-700"
}`}

      disabled={!streamRef.current || currentQuestionNumber > questions.length || !isInterviewActive}
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
  </Tippy>

  {/* Navigation Buttons */}
  <div className="flex flex-wrap gap-3 justify-center">
    
    <Tippy content="Skip this question and move to the next one" placement="top">
      <button
        id="skipBtn"
        onClick={skipQuestion}
        className="px-5 py-2 text-white font-semibold bg-yellow-600 hover:bg-yellow-700 rounded-full transition duration-150 disabled:bg-gray-500"
        disabled={isSkipDisabled}
      >
        Skip
      </button>
    </Tippy>

    <Tippy content="Submit your current answer and get feedback" placement="top">
      <button
        id="nextBtn"
        onClick={() => submitAnswer(false)}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md transition duration-150 disabled:bg-gray-500"
        disabled={isNextDisabled}
      >
        Next
      </button>
    </Tippy>

    <Tippy content="End the interview and generate your report" placement="top">
      <button
        id="endBtn"
        onClick={() => endInterview(false)}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-md transition duration-150"
        disabled={isEndDisabled}
      >
        End
      </button>
    </Tippy>

  </div>
</div>

            </footer>


            </div>
        </div>
    );
};

export default VirtualInterview;