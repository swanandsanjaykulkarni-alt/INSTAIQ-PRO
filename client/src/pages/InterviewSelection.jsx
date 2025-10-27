// client/src/pages/InterviewSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000"; 

const InterviewSelection = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('User');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Standard Tailwind classes
    const primaryColorClass = 'text-indigo-600';

    // 1. Display Username on Load (Conversion of DOMContentLoaded logic)
    useEffect(() => {
        const storedName = localStorage.getItem("user_name");
        if (storedName) {
            // Capitalize the first letter for display
            const formattedName = storedName.charAt(0).toUpperCase() + storedName.slice(1);
            setUserName(formattedName);
        }
        // Note: The security check is handled by <ProtectedRoute> wrapping this component.
    }, []);

    /**
     * Sends a request to the backend to start a new interview session.
     * @param {string} type - The type of interview (HR, Technical, or Personal).
     */
    const startInterview = async (type) => {
        setIsLoading(true);
        setError(null);
        
        const userId = localStorage.getItem("user_id");
        
        if (!userId) {
            // Should be caught by ProtectedRoute, but good for redundancy
            navigate('/login'); 
            return;
        }

        // Clear any old interview-related data as per your original JS
        localStorage.removeItem("selected_technical_domain");
        localStorage.removeItem("selected_interview_mode");
        localStorage.removeItem("current_interview_id");
        localStorage.removeItem("current_interview_type");


        try {
            // 1. Make the API call to your backend
            const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, type }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to start interview. Status: ${response.status}`);
            }

            const data = await response.json();
            const interviewId = data.interviewId; 

            // 2. Save the new interview ID and type
            localStorage.setItem("current_interview_id", interviewId);
            localStorage.setItem("current_interview_type", type);
            
            console.log(`Interview started successfully. ID: ${interviewId}. Determining next page...`);
            
            // 3. Conditional Redirection Logic (Conversion of window.location.href)
            let nextPage = '';
            
            if (type === 'Technical') {
                // Technical interviews go to branch selection first
                nextPage = '/branch-selection'; // Must be a React route
            } else if (type === 'HR' || type === 'Personal') {
                // HR and Personal interviews go directly to mode selection
                nextPage = '/mode-selection'; // Must be a React route
            } else {
                console.error(`Unknown interview type: ${type}. Redirecting to home.`);
                nextPage = '/';
            }

            // 4. Redirect the user using React Router's navigate
            navigate(nextPage);

        } catch (err) {
            console.error("Error starting interview:", err);
            setError(`Failed to start interview: ${err.message}. Check server status.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Data for rendering the cards
    const interviewTypes = [
        { type: 'HR', icon: '🤝', title: 'HR Interview', description: 'Behavioral & soft skills questions.' },
        { type: 'Technical', icon: '💻', title: 'Technical Interview', description: 'Domain expertise and problem-solving.' },
        { type: 'Personal', icon: '👤', title: 'Personal Interview', description: 'Background, motivation, and fit questions.' },
    ];


    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Top Bar with Welcome Message and Profile Link */}
            <div className="flex justify-between items-center mb-10 pt-10">
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, <span className={primaryColorClass}>{userName}!</span>
                </h1>
                
                {/* Profile Link (Placeholder for now) */}
                <a href="#" className={`flex items-center text-gray-600 hover:${primaryColorClass} transition duration-150`}>
                    <span className="text-xl mr-2">👤</span>
                    <span className="font-medium">Profile</span>
                </a>
            </div>

            {/* Loading and Error Indicators */}
            {isLoading && (
                <div className="text-center text-lg text-indigo-600 my-4">
                    Starting interview session... Please wait.
                </div>
            )}
            {error && (
                <div className="text-center text-red-600 bg-red-100 p-3 rounded-md my-4">
                    {error}
                </div>
            )}
            
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                Choose Interview Type
            </h2>

            {/* Grid of Interview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {interviewTypes.map((item) => (
                    // React uses onClick, not a traditional <a> tag with href="#"
                    <div 
                        key={item.type}
                        onClick={() => !isLoading && startInterview(item.type)}
                        className="interview-card cursor-pointer"
                    >
                        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-[1.02] border-t-4 border-indigo-600">
                            <div className={`text-5xl mb-4 ${primaryColorClass}`}>{item.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                            <p className="mt-2 text-gray-500">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default InterviewSelection;