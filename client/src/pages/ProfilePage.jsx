// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000";

// --- Utility to format date ---
function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const ProfilePage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalInterviews: 0,
        averageScore: '--',
        highestScore: '--',
        bestCategory: '--',
        lastInterviewDate: '--',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastInterviewId, setLastInterviewId] = useState(null);

    // Fetch user info from localStorage (as per your script)
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name") || "User";
    const userEmail = localStorage.getItem("user_email") || "No email found";
    const userJoined = "Aug 2025"; // Placeholder from your original HTML

    const fetchProfileData = useCallback(async () => {
        if (!userId) {
            navigate('/login');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch interview history
            const response = await fetch(`${API_BASE_URL}/api/interview/history/${userId}`);
            if (!response.ok) throw new Error("Failed to load interview history");

            const data = await response.json();
            const interviews = data.interviews || [];

            if (interviews.length === 0) {
                setStats({
                    totalInterviews: 0,
                    averageScore: '0',
                    highestScore: '0',
                    bestCategory: '--',
                    lastInterviewDate: '--',
                });
                return;
            }

            // Calculations
            const total = interviews.length;
            const avgScore = interviews.reduce((sum, i) => sum + (i.totalAverage || 0), 0) / total;
            
            const highest = interviews.reduce(
                (prev, curr) => (curr.totalAverage > prev.totalAverage ? curr : prev),
                interviews[0]
            );

            const lastInterview = interviews[0];
            
            setStats({
                totalInterviews: total,
                averageScore: avgScore.toFixed(1),
                highestScore: highest.totalAverage.toFixed(1),
                bestCategory: highest.category,
                lastInterviewDate: formatDate(lastInterview.date),
            });
            
            setLastInterviewId(lastInterview._id);

        } catch (err) {
            console.error("Error loading profile data:", err);
            setError("Failed to load your profile statistics.");
        } finally {
            setIsLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // --- Handlers ---
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleDownloadReport = async () => {
        if (!lastInterviewId) {
            alert("No recent report found.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/interview/download/${lastInterviewId}`);
            if (!res.ok) throw new Error("Failed to download report");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `interview-report-${lastInterviewId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error:", err);
            alert("Failed to download your report. Try again later.");
        }
    };
    
    // --- Render Logic ---
    if (isLoading) {
        return (
            <main className="max-w-5xl mx-auto p-4 pt-10">
                <div className="bg-white shadow-xl rounded-lg p-8 mt-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading profile data...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="w-full pt-10 px-6 pb-6 min-h-screen">
            <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl p-8">

                {/* Header */}
                <header className="flex justify-between items-center border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">User Profile</h1>
                    <button 
                        id="logoutBtn" 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </header>

                {/* User Info & Overall Score */}
                <section className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <img 
                            id="userAvatar" 
                            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                            alt="User Avatar" 
                            className="w-24 h-24 rounded-full border-4 border-indigo-600 shadow-md"
                        />
                        <div>
                            <h2 id="userName" className="text-2xl font-semibold text-gray-800">{userName}</h2>
                            <p id="userEmail" className="text-gray-500">{userEmail}</p>
                            <p className="text-sm text-gray-400">Member since <span id="userJoined">{userJoined}</span></p>
                            {error && <p className="text-sm text-red-500 mt-1">({error})</p>}
                        </div>
                    </div>

                    <div className="mt-6 md:mt-0 text-center md:text-right">
                        <h3 className="text-4xl font-bold text-indigo-600" id="averageScore">{stats.averageScore}</h3>
                        <p className="text-gray-600 text-sm">Overall Average Score</p>
                    </div>
                </section>

                {/* Summary Stats Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-indigo-50 p-4 rounded-lg shadow text-center">
                        <p className="text-gray-500 text-sm">Total Interviews</p>
                        <p id="totalInterviews" className="text-2xl font-bold text-indigo-700">{stats.totalInterviews}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg shadow text-center">
                        <p className="text-gray-500 text-sm">Best Category</p>
                        <p id="bestCategory" className="text-2xl font-bold text-indigo-700">{stats.bestCategory}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg shadow text-center">
                        <p className="text-gray-500 text-sm">Last Interview</p>
                        <p id="lastInterviewDate" className="text-xl font-bold text-indigo-700">{stats.lastInterviewDate}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg shadow text-center">
                        <p className="text-gray-500 text-sm">Highest Score</p>
                        <p id="highestScore" className="text-2xl font-bold text-indigo-700">{stats.highestScore}</p>
                    </div>
                </section>

                {/* Action Buttons */}
                <section className="flex flex-wrap justify-center gap-4">
                    <button 
                        id="startInterviewBtn"
                        onClick={() => navigate('/interview-selection')}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                    >
                        Start New Interview
                    </button>
                    <button 
                        id="viewHistoryBtn"
                        onClick={() => navigate('/interview-history')}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                        View Interview History
                    </button>
                    <button 
                        id="downloadReportBtn"
                        onClick={handleDownloadReport}
                        disabled={stats.totalInterviews === 0}
                        className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition disabled:bg-gray-400"
                    >
                        Download Latest Report
                    </button>
                </section>
            </div>
        </main>
    );
};

export default ProfilePage;