// client/src/pages/ModeSelection.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ModeSelection = () => {
    const navigate = useNavigate();

    // Standard Tailwind classes
    const primaryColorClass = 'text-indigo-600';
    const bgColorClass = 'bg-indigo-600';
    const hoverBgClass = 'hover:bg-indigo-700';

    // Optional: Ensure the user has selected interview type/branch first
    useEffect(() => {
        const interviewId = localStorage.getItem('current_interview_id');
        if (!interviewId) {
            // If the interview hasn't been started, send them back to select a type.
            navigate('/interview-selection');
        }
    }, [navigate]);

    /**
     * Handles the click on the Start button for either mode.
     * @param {string} mode - The selected mode ('virtual' or 'chat').
     */
    const handleStartInterview = (mode) => {
        // CRITICAL STEP: Save the specific mode selection
        localStorage.setItem("selected_interview_mode", mode);

        // Redirect based on mode, using React Router's navigate
        if (mode === "chat") {
            // Redirect to the Chat Interview page
            navigate("/chat-interview");
        } else {
            // Redirect to the Virtual Interview page (for 'virtual' mode)
            navigate("/virtual-interview");
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-[120px]">

            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                Choose Interview Mode
            </h1>
            <p className="text-xl text-gray-600 mb-10">
                Select how you'd like to practice your interview.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* 1. Virtual Interview Card */}
                <div 
                    className="bg-white p-8 rounded-xl shadow-2xl border-t-8 border-indigo-600 flex flex-col justify-between mode-card"
                    data-mode="virtual"
                >
                    <div>
                        <div className={`text-6xl mb-4 ${primaryColorClass}`}>📹</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Virtual Interview</h3>
                        <p className="text-gray-500 mb-6">Practice with camera and voice recognition.</p>

                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-center">
                                <span className="text-green-500 text-xl mr-2">✓</span>
                                Real-time video feedback
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 text-xl mr-2">✓</span>
                                Voice recognition
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 text-xl mr-2">✓</span>
                                Body language analysis
                            </li>
                        </ul>
                    </div>

                    <button 
                        onClick={() => handleStartInterview('virtual')}
                        className={`start-btn mt-8 w-full py-3 text-white font-semibold rounded-lg transition duration-200 ${bgColorClass} ${hoverBgClass}`}
                    >
                        Start Virtual Interview
                    </button>
                </div>

                {/* 2. Chat Interview Card */}
                <div 
                    className="bg-white p-8 rounded-xl shadow-2xl border-t-8 border-gray-400 flex flex-col justify-between mode-card"
                    data-mode="chat"
                >
                    <div>
                        <div className="text-6xl mb-4 text-gray-700">💬</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Chat Interview</h3>
                        <p className="text-gray-500 mb-6">Practice with text-based conversation.</p>

                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-center">
                                <span className="text-green-500 text-xl mr-2">✓</span>
                                Text-based responses
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 text-xl mr-2">✓</span>
                                Instant feedback
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 text-xl mr-2">✓</span>
                                Communication analysis
                            </li>
                        </ul>
                    </div>

                    <button 
                        onClick={() => handleStartInterview('chat')}
                        className={`start-btn mt-8 w-full py-3 text-white font-semibold rounded-lg transition duration-200 bg-gray-600 hover:bg-gray-700`}
                    >
                        Start Chat Interview
                    </button>
                </div>
            </div>

        </main>
    );
};

export default ModeSelection;