// client/src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const adminName = localStorage.getItem('admin_name') || 'Administrator';
    const [stats, setStats] = useState({
        totalUsers: '...',
        totalInterviews: '...',
        avgSystemScore: '...',
        activeAdmins: '...'
    });
    const [isLoading, setIsLoading] = useState(true);

    // Placeholder function to fetch admin stats from a future API endpoint
    const fetchAdminStats = useCallback(async () => {
        // NOTE: This API endpoint (api/admin/stats) is currently hypothetical and needs backend implementation.
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Placeholder data for now
            const data = {
                totalUsers: 452,
                totalInterviews: 1289,
                avgSystemScore: 7.4,
                activeAdmins: 3
            }; 
            
            setStats(data);

        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
            // Fallback to placeholder data on error
            setStats({
                totalUsers: 'N/A',
                totalInterviews: 'N/A',
                avgSystemScore: 'N/A',
                activeAdmins: 'N/A'
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminStats();
    }, [fetchAdminStats]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_id');
        localStorage.removeItem('admin_name');
        navigate('/admin/login');
    };

    return (
        <main className="max-w-7xl mx-auto p-4 pt-10">
            <div className="bg-white shadow-2xl rounded-xl p-8 mt-10">
                
                <header className="flex justify-between items-center border-b pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold text-indigo-600">{adminName}</span>. System Overview.</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </header>

                {/* Statistics Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-indigo-50 p-6 rounded-lg shadow-md border-b-4 border-indigo-500">
                        <p className="text-sm font-medium text-indigo-600">Total Users</p>
                        <p className="text-4xl font-extrabold text-indigo-800 mt-1">
                            {isLoading ? '...' : stats.totalUsers}
                        </p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg shadow-md border-b-4 border-green-500">
                        <p className="text-sm font-medium text-green-600">Total Interviews</p>
                        <p className="text-4xl font-extrabold text-green-800 mt-1">
                            {isLoading ? '...' : stats.totalInterviews}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg shadow-md border-b-4 border-yellow-500">
                        <p className="text-sm font-medium text-yellow-600">Avg. System Score</p>
                        <p className="text-4xl font-extrabold text-yellow-800 mt-1">
                            {isLoading ? '...' : stats.avgSystemScore}
                        </p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg shadow-md border-b-4 border-red-500">
                        <p className="text-sm font-medium text-red-600">Active Admins</p>
                        <p className="text-4xl font-extrabold text-red-800 mt-1">
                            {isLoading ? '...' : stats.activeAdmins}
                        </p>
                    </div>
                </section>
                
                {/* Management Navigation */}
                <section>
                    <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Management Console</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <button 
                            onClick={() => alert("Navigate to User Management")}
                            className="bg-gray-100 hover:bg-indigo-100 border border-gray-300 p-6 rounded-lg text-left transition duration-150"
                        >
                            <h3 className="text-lg font-semibold text-indigo-600">User Management</h3>
                            <p className="text-sm text-gray-600 mt-1">View, edit, or remove user accounts and their history.</p>
                        </button>
                        
                        <button 
                            onClick={() => alert("Navigate to Interview Data Review")}
                            className="bg-gray-100 hover:bg-indigo-100 border border-gray-300 p-6 rounded-lg text-left transition duration-150"
                        >
                            <h3 className="text-lg font-semibold text-indigo-600">Interview Data Review</h3>
                            <p className="text-sm text-gray-600 mt-1">Search and review all interview transcripts and AI feedback.</p>
                        </button>
                        
                        <button 
                            onClick={() => alert("Navigate to System Settings")}
                            className="bg-gray-100 hover:bg-indigo-100 border border-gray-300 p-6 rounded-lg text-left transition duration-150"
                        >
                            <h3 className="text-lg font-semibold text-indigo-600">System Settings</h3>
                            <p className="text-sm text-gray-600 mt-1">Configure interview categories, AI models, and access control.</p>
                        </button>
                    </div>
                </section>

            </div>
        </main>
    );
};

export default AdminDashboard;