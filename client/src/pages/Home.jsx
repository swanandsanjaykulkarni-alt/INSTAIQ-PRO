// client/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Note: Header component import is intentionally REMOVED, as it is loaded in App.jsx

const Home = () => {
    // Standard Tailwind classes replacing custom CSS variables
    const primaryColorClass = 'text-indigo-600';
    const bgColorClass = 'bg-indigo-600';
    const hoverBgClass = 'hover:bg-indigo-700';

    return (
        <div>
            {/* The pt-20 padding is now handled globally in App.jsx */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                <div className="text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
                        Welcome to <span className={primaryColorClass}>Insta IQ</span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                        Your **AI-powered interview practice platform**—designed to help you master any job interview.
                    </p>

                    <div className="mt-10 flex justify-center space-x-6">
                        {/* Action 1: Create Account -> Link to /signup route */}
                        <Link to="/signup" className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white ${bgColorClass} ${hoverBgClass} shadow-lg transition duration-200`}>
                            Create New Account
                        </Link>
                        
                        {/* Action 2: Sign In -> Link to /login route */}
                        <Link to="/login" className={`inline-flex items-center justify-center px-8 py-3 border border-indigo-600 text-base font-medium rounded-md ${primaryColorClass} bg-white hover:bg-indigo-50 transition duration-200`}>
                            Sign In to Existing Account
                        </Link>
                    </div>
                </div>

                <div className="mt-20">
                    <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">

                        {/* Feature Card 1 */}
                        <div className="relative bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
                            <dt>
                                <div className={`absolute flex items-center justify-center h-12 w-12 rounded-md ${bgColorClass} text-white text-2xl`}>
                                    🎯
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Experienced Real Time Interview</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Practice with an intelligent AI interviewer and get instant, objective feedback on your performance.
                            </dd>
                        </div>

                        {/* Feature Card 2 */}
                        <div className="relative bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
                            <dt>
                                <div className={`absolute flex items-center justify-center h-12 w-12 rounded-md ${bgColorClass} text-white text-2xl`}>
                                    📊
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Detailed Performance Analysis</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Download comprehensive reports with scores across communication, confidence, subject matter, and more.
                            </dd>
                        </div>

                        {/* Feature Card 3 */}
                        <div className="relative bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
                            <dt>
                                <div className={`absolute flex items-center justify-center h-12 w-12 rounded-md ${bgColorClass} text-white text-2xl`}>
                                    🚀
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Skill Improvement</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500">
                                Track your progress over time, identify weak spots, and get tailored advice to improve your interview skills.
                            </dd>
                        </div>
                    </dl>
                </div>
            </main>
        </div>
    );
};

export default Home;