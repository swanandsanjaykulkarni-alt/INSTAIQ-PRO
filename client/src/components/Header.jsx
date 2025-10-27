// client/src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; 

const Header = () => {
    // We use native Tailwind text-indigo-600 which corresponds to your primary color #4f46e5
    const primaryColorClass = 'text-indigo-600'; 

    return (
        // The fixed positioning is critical to prevent content overlap
        <header className="bg-white shadow-md w-full fixed top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">

                {/* LEFT SIDE: Site Title / Home Link */}
                <div className="flex items-center space-x-3">
                    <div className={`text-2xl font-bold ${primaryColorClass}`}>
                        <Link to="/">Insta IQ</Link>
                    </div>
                </div>

                {/* RIGHT SIDE: Logo Only (No Buttons) */}
                <nav>
                    <img 
                        src={logo} 
                        alt="Insta IQ Secondary Logo" 
                        className="h-12 w-auto" 
                    /> 
                </nav>
            </div>
        </header>
    );
};

export default Header;