// client/src/pages/CheatedPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CheatedPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear any leftover session
        localStorage.removeItem("current_interview_id");
        localStorage.setItem("cheated", "true");
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Interview Ended</h1>
                <p className="text-gray-700 mb-6">
                    You switched tabs during the interview. This is considered cheating.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
};

export default CheatedPage;
