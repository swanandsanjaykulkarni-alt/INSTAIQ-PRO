// client/src/pages/InterviewHistoryPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000";

const InterviewHistoryPage = () => {
    const navigate = useNavigate();
    const [allInterviews, setAllInterviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMode, setFilterMode] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const userId = localStorage.getItem("user_id");

    const fetchHistory = useCallback(async () => {
        if (!userId) {
            alert("User not authenticated. Redirecting to login.");
            navigate('/login');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/interview/history/${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch interview history');
            }
            
            const data = await response.json();
            
            // Sort by latest date first
            const sortedHistory = data.interviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            setAllInterviews(sortedHistory);

        } catch (err) {
            console.error("Error loading interview history:", err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // --- Stats and Filtered Data Logic ---
    const { filteredInterviews, totalInterviews, averageScore, bestCategory, modeRatio } = useMemo(() => {
        let interviews = allInterviews;

        // 1. Apply Filters
        if (filterCategory !== 'all') {
            interviews = interviews.filter(i => i.category === filterCategory);
        }
        if (filterMode !== 'all') {
            interviews = interviews.filter(i => i.mode === filterMode);
        }

        // 2. Apply Search
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            interviews = interviews.filter(i => 
                i.category.toLowerCase().includes(lowerSearchTerm) ||
                i.mode.toLowerCase().includes(lowerSearchTerm) ||
                i.branch?.toLowerCase().includes(lowerSearchTerm) ||
                new Date(i.date).toLocaleString().toLowerCase().includes(lowerSearchTerm)
            );
        }

        // 3. Calculate Stats on ALL interviews (as per original JS)
        const total = allInterviews.length;
        
        let avgScore = 0;
        if (total > 0) {
            avgScore = allInterviews.reduce((sum, i) => sum + (i.totalAverage || 0), 0) / total;
        }
        
        // Find best category
        const categoryScores = {};
        allInterviews.forEach((i) => {
            if (!categoryScores[i.category]) categoryScores[i.category] = [];
            if (i.totalAverage) categoryScores[i.category].push(i.totalAverage);
        });

        let bestCat = "N/A";
        let bestAvg = 0;
        for (const [cat, scores] of Object.entries(categoryScores)) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestCat = cat;
            }
        }

        // Chat vs Virtual ratio
        const chatCount = allInterviews.filter((i) => i.mode === "chat").length;
        const virtualCount = allInterviews.filter((i) => i.mode === "virtual").length;
        const modeRatioText = `${chatCount} Chat / ${virtualCount} Virtual`;

        return {
            filteredInterviews: interviews,
            totalInterviews: total,
            averageScore: avgScore,
            bestCategory: bestCat,
            modeRatio: modeRatioText,
        };

    }, [allInterviews, filterCategory, filterMode, searchTerm]);
    
    // --- Handlers ---
    const handleViewReport = (interviewId) => {
        navigate(`/reports?id=${interviewId}`);
    };

    const handleDownloadPdf = async (interviewId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/interview/download/${interviewId}`);
            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `interview-report-${interviewId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            alert("Failed to download report.");
            console.error(err);
        }
    };
    
    const handleGoBack = () => {
        navigate('/interview-selection'); // Assuming this leads to the main selection dashboard
    };

    // --- Render Logic ---
    
    if (isLoading) {
        return (
            <main className="max-w-6xl mx-auto p-4 pt-10">
                <div className="bg-white shadow-xl rounded-lg p-8 mt-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading interview history...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="max-w-6xl mx-auto p-4 pt-10">
                <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mt-10">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            </main>
        );
    }


    return (
        <main className="max-w-6xl mx-auto p-4 pt-10">
            <div className="bg-white shadow-xl rounded-lg p-8 mt-10">
                
                {/* Header */}
                <header className="flex justify-between items-center border-b pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Interview History</h1>
                        <p className="text-gray-600 mt-1 text-sm">Track your previous interviews, scores, and detailed reports.</p>
                    </div>
                    <button 
                        onClick={handleGoBack}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        ← Back to Selection
                    </button>
                </header>

                {/* Summary Cards */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-indigo-50 p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-indigo-600">Total Interviews</h3>
                        <p className="text-3xl font-bold text-indigo-800">{totalInterviews}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-green-600">Average Score</h3>
                        <p className="text-3xl font-bold text-green-800">
                            {averageScore > 0 ? averageScore.toFixed(1) : "--"}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-yellow-600">Best Category</h3>
                        <p className="text-3xl font-bold text-yellow-800">{bestCategory}</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-pink-600">Chat vs Virtual</h3>
                        <p className="text-2xl font-bold text-pink-800">{modeRatio}</p>
                    </div>
                </section>

                {/* Filters */}
                <section className="flex flex-wrap justify-between items-center mb-6 space-y-3 md:space-y-0">
                    <div className="flex space-x-3">
                        <select 
                            id="filterCategory" 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 text-gray-700"
                        >
                            <option value="all">All Categories</option>
                            <option value="HR">HR</option>
                            <option value="Technical">Technical</option>
                            <option value="Personal">Personal</option>
                        </select>

                        <select 
                            id="filterMode" 
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 text-gray-700"
                        >
                            <option value="all">All Modes</option>
                            <option value="chat">chat</option>
                            <option value="virtual">virtual</option>
                        </select>
                    </div>

                    <input 
                        id="searchInput" 
                        type="text" 
                        placeholder="Search interviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 px-3 text-gray-700 focus:outline-none focus:ring focus:ring-indigo-200 w-full md:w-auto" 
                    />
                </section>

                {/* Interview Table */}
                <section>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
                                <tr>
                                    <th className="py-3 px-4 text-left">Date</th>
                                    <th className="py-3 px-4 text-left">Category</th>
                                    <th className="py-3 px-4 text-left">Mode</th>
                                    <th className="py-3 px-4 text-left">Branch</th>
                                    <th className="py-3 px-4 text-center">Score</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="historyTableBody" className="text-gray-700 divide-y divide-gray-200">
                                
                                {filteredInterviews.length > 0 ? (
                                    filteredInterviews.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">{new Date(item.date).toLocaleString()}</td>
                                            <td className="py-3 px-4">{item.category}</td>
                                            <td className="py-3 px-4">{item.mode}</td>
                                            <td className="py-3 px-4">{item.branch || "N/A"}</td>
                                            <td className="py-3 px-4 text-center font-semibold text-indigo-700">
                                                {item.totalAverage ? `${item.totalAverage.toFixed(1)}/10` : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                                                <button 
                                                    onClick={() => handleViewReport(item._id)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 viewReportBtn"
                                                >
                                                    View Report
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadPdf(item._id)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 downloadPdfBtn"
                                                >
                                                    Download PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colspan="6" className="text-center py-6 text-gray-400">
                                            No interviews match your filters or search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Empty State (Conditional Rendering) */}
                {allInterviews.length === 0 && (
                    <section id="emptyState" className="text-center py-12 text-gray-500">
                        <p className="mb-4 text-lg">You haven't completed any interviews yet.</p>
                        <button
                            onClick={() => navigate('/interview-selection')}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
                        >
                            Start Your First Interview
                        </button>
                    </section>
                )}
            </div>
        </main>
    );
};

export default InterviewHistoryPage;