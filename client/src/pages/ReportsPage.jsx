// client/src/pages/ReportsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute'; // Ensure this is imported if wrapping logic exists

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000";
const INDICATORS_LIST = [
    "ConceptualClarity",
    "ProblemDecompositionAbility",
    "ApplicationOfKnowledge",
    "LogicalAlgorithmicThinking",
    "DebuggingErrorHandlingMindset",
    "CommunicationOfTechnicalIdeas",
    "LearningAgility",
    "EngineeringJudgmentDecisionMaking",
   
];

// --- Helper Functions ---
const formatReportDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
};

// Component to render individual indicator scores
const IndicatorScoreCard = ({ indicator, score }) => (
    <div className="p-4 bg-gray-100 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-700">{indicator.replace(/([A-Z])/g, ' $1').trim()}</h3>
        <div className="text-3xl font-extrabold text-indigo-700">{score}</div>
    </div>
);

// Component to render question-by-question feedback
const QuestionFeedback = ({ answer, index }) => (
    <details className="bg-white border rounded-lg p-4 shadow-sm">
        <summary className="text-gray-800 font-semibold flex justify-between items-center cursor-pointer">
            <span>Q{index + 1}: {answer.question}</span>
            <span className="text-lg font-bold text-indigo-600">
                Score: {answer.evaluation?.TotalScore ?? "N/A"}/10
            </span>
        </summary>
        <div className="mt-2 pt-2 border-t text-gray-700 space-y-2">
            <p>
                <strong>Your Answer:</strong> 
                <span className="block p-2 bg-gray-50 border rounded mt-1 whitespace-pre-wrap">
                    {answer.userAnswer || "N/A"}
                </span>
            </p>
            <p className="text-indigo-700">
                <strong>Feedback:</strong> {answer.evaluation?.Feedback || "No feedback provided."}
            </p>
        </div>
    </details>
);

const ReportsPage = () => {
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [avgIndicatorScores, setAvgIndicatorScores] = useState({});

    // Fetch user info from localStorage
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name") || "Candidate";

    // This component will fetch the *latest* interview data
    const fetchReport = useCallback(async () => {
        if (!userId) {
            setError("User ID missing. Redirecting to login.");
            navigate('/login');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // NOTE: The original JS fetched the latest interview from history.
            // A more robust approach, often preferred, is to fetch by ID from the URL,
            // but we'll stick to fetching the latest from history as per the original script.
            
            // Fetch the latest interview from the user's history
            const response = await fetch(`${API_BASE_URL}/api/interview/history/${userId}`);
            
            if (!response.ok) throw new new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();

            if (!data.interviews || data.interviews.length === 0) {
                setError("No interviews found for this user.");
                setIsLoading(false);
                return;
            }

            const latestInterview = data.interviews[0];
            setReport(latestInterview);

            // Calculate indicator averages
            const calculatedIndicators = {};
           INDICATORS_LIST.forEach((indicator) => {
    let total = 0;
    let count = 0;

    latestInterview.answers.forEach((ans) => {
    const value = ans.evaluation?.[indicator];

    if (typeof value === "number") {
        total += value;
        count++;
    }
});


    calculatedIndicators[indicator] =
    count > 0 ? (total / count).toFixed(1) : "N/A";
});


            setAvgIndicatorScores(calculatedIndicators);

        } catch (err) {
            console.error("Error loading feedback:", err);
            setError("Failed to load interview data. Please check network connection.");
        } finally {
            setIsLoading(false);
        }
    }, [userId, navigate]);

    // Handle PDF Download
    const downloadReport = async () => {
        if (!report) return alert("Report data is not available for download.");
        
        try {
            const interviewId = report._id; 
            
            const response = await fetch(`${API_BASE_URL}/api/interview/download/${interviewId}`);
            if (!response.ok) throw new Error("Failed to download report");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `interview-report-${interviewId}.pdf`;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            alert("Error downloading report. Please try again.");
            console.error("❌ Download error:", err);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (isLoading) {
        return (
            <main className="max-w-7xl mx-auto p-4 pt-10">
                <div className="text-center p-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading detailed report...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="max-w-7xl mx-auto p-4 pt-10">
                <div className="text-center p-20 bg-red-100 border border-red-400 rounded-lg">
                    <h1 className="text-3xl text-red-600 font-bold">Error Loading Report</h1>
                    <p className="mt-2 text-red-800">{error}</p>
                </div>
            </main>
        );
    }
    
    // --- Render Logic ---
    return (
        <main className="max-w-6xl mx-auto p-4 pt-10">
            {/* The wrapper mimics the original HTML structure without the fixed header */}
            <div className="bg-white shadow-xl rounded-lg p-8 mt-10"> 
            
                {/* Report Header */}
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Detailed Interview Report</h1>
                        
                        <div className="mt-2 text-gray-600 text-sm">
                            <p>Candidate: <span className="font-semibold text-gray-800">{userName}</span></p>
                            <p>Type/Mode: 
                                <span className="font-semibold" id="reportContext">{report?.category || "N/A"}</span> 
                                / 
                                <span className="font-semibold" id="reportMode">{report?.mode || "N/A"}</span>
                            </p>
                            <p>Date: <span id="reportDate">{formatReportDate(report?.date)}</span></p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-3">
                        {/* Profile and History links will need updated React Router links */}
                        <button 
                            onClick={() => navigate('/profile')}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-150 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Profile
                        </button>
                        <button 
                            onClick={() => navigate('/interview-history')} // Assuming you'll add an /interview-history route
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-150 text-sm flex items-center">
                            ← History
                        </button>
                        <button 
                            id="downloadReportBtn" 
                            onClick={downloadReport}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 text-sm">
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Overall Score */}
                <section className="mb-8 p-6 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-indigo-800">Overall Average Score</h2>
                        <p className="text-indigo-600 text-sm">Based on all questions and indicators.</p>
                    </div>
                    <div className="text-5xl font-extrabold text-indigo-700">
                        <span>{report?.totalAverage?.toFixed(1) ?? "--"}</span> / 10
                    </div>
                </section>

                {/* Performance Indicators */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Performance Indicators (Average Scores)</h2>
                    <div id="indicatorsContainer" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {INDICATORS_LIST.map(indicator => (
                            <IndicatorScoreCard 
    key={indicator}
    indicator={indicator} 
    score={avgIndicatorScores[indicator] ?? "0.0"}
/>

                        ))}
                    </div>
                </section>

                {/* Question Feedback */}
                <section>
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Question-by-Question Feedback</h2>
                    <div id="questionsContainer" className="space-y-4">
                        {report?.answers?.length > 0 ? (
                            report.answers.map((ans, index) => (
                                <QuestionFeedback key={index} answer={ans} index={index} />
                            ))
                        ) : (
                            <p className="text-gray-500">No answers found for this interview.</p>
                        )}
                    </div>
                </section>

            </div>
        </main>
    );
};

// Apply custom CSS for the reports page style (collapsible, indicator-score)
const customStyles = `
    summary {
        cursor: pointer;
        padding: 0.5rem 0;
        outline: none;
        list-style: none; 
        display: flex;
        align-items: center;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before { content: '▶'; margin-right: 0.5rem; }
    details[open] > summary::before { content: '▼'; }
    
    .indicator-score {
        font-size: 2rem;
        font-weight: bold;
        line-height: 1;
    }
`;

// Inject custom styles into the DOM once the component mounts
const StyleInjector = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = customStyles;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);
    return null;
};

// Export the component wrapped with the style injector
const ReportsPageWithStyles = () => (
    <>
        <StyleInjector />
        <ReportsPage />
    </>
);

export default ReportsPageWithStyles;