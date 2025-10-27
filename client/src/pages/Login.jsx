// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000"; 

const Login = () => {
    const navigate = useNavigate();

    // Standard Tailwind classes
    const primaryColorClass = 'text-indigo-600';
    const focusRingClass = 'focus:ring-indigo-600 focus:border-indigo-600';
    const bgColorClass = 'bg-indigo-600';
    const hoverBgClass = 'hover:bg-indigo-700';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState(null); // { text: string, isError: boolean }

    // Utility function recreated for React state
    const displayMessage = (text, isError = false) => {
        setMessage({ text, isError });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- LOGIN HANDLER (Conversion of handleLogin) ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        displayMessage("Signing in...", false);

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // SUCCESS: Save user info to localStorage (as per your original JS)
                const user = data.user || {}; 
                
                localStorage.setItem("user_id", user._id || 'N/A');
                localStorage.setItem("user_name", user.name || 'User');
                localStorage.setItem("user_email", user.email || formData.email);

                displayMessage(
                    data.message || "Login successful! Redirecting...",
                    false,
                );

                // Redirect to the protected interview page
                setTimeout(() => {
                    navigate("/interview-selection"); 
                }, 1000);

            } else {
                displayMessage(
                    data.message || "Login failed. Invalid email or password.",
                    true,
                );
            }
        } catch (error) {
            console.error("Login Error:", error);
            displayMessage(
                "A network error occurred. Check server connection.",
                true,
            );
        }
    };

    return (
        <div className="flex flex-col items-center pt-20 pb-10 min-h-screen bg-gray-50">
            <div className="w-full max-w-md px-4 sm:px-0">
                <div className="text-center mb-8">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Sign In to Your Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or
                        <Link to="/signup" className={`font-medium ${primaryColorClass} hover:text-indigo-500 ml-1`}>
                            create a new account
                        </Link>
                    </p>
                </div>

                <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1">
                                <input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    autoComplete="email" 
                                    required 
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${focusRingClass} sm:text-sm`}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1">
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    autoComplete="current-password" 
                                    required 
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${focusRingClass} sm:text-sm`}
                                />
                            </div>
                        </div>

                        {/* Message Area for Feedback */}
                        {message && (
                            <div className={`text-sm font-medium p-2 rounded-md ${message.isError ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div>
                            <button 
                                type="submit" 
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${bgColorClass} ${hoverBgClass} focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRingClass} transition duration-150`}
                            >
                                Sign In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;