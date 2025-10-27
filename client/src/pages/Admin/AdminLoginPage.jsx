// client/src/pages/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000";

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific errors from the backend (e.g., invalid credentials)
                throw new Error(data.message || 'Admin login failed.');
            }

            // Successful Admin Login
            // Use specific keys for admin authentication
            localStorage.setItem('admin_token', data.token); 
            localStorage.setItem('admin_id', data.adminId);
            localStorage.setItem('admin_name', data.name);
            
            alert(`Welcome, Admin ${data.name}!`);

            // Redirect to the Admin Dashboard (a page we will create next)
            navigate('/admin/dashboard'); 

        } catch (err) {
            console.error('Admin Login Error:', err);
            setError(err.message || 'An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen pt-20 bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-gray-100">
                
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Portal Login</h1>
                    <p className="mt-2 text-sm text-gray-500">Access the system management dashboard.</p>
                </header>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm font-medium text-red-700 bg-red-100 border border-red-400 rounded-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Logging In...' : 'Admin Login'}
                    </button>
                </form>

                <div className="text-center pt-4 border-t mt-6">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        ← Back to User Login
                    </button>
                </div>
            </div>
        </main>
    );
};

export default AdminLoginPage;