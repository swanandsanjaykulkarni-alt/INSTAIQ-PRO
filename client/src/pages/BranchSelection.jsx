// client/src/pages/BranchSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- TECHNICAL BRANCH DATA STRUCTURE (Static Data) ---
const TECHNICAL_BRANCHES = {
    Core: {
        name: "Core Engineering",
        icon: "⚙️",
        domains: [
            "Mechanical Engineering",
            "Civil Engineering",
            "Electrical Engineering",
            "Chemical Engineering",
            "Production Engineering",
            "Instrumentation Engineering",
        ],
    },
    Tech: {
        name: "Technology & Computing",
        icon: "💻",
        domains: [
            "Computer Engineering",
            "Software Engineering",
            "Information Technology",
            "Electronics & Communication",
            "Data Science",
            "Artificial Intelligence",
        ],
    },
    Specialized: {
        name: "Specialized Engineering",
        icon: "🚀",
        domains: [
            "Aerospace Engineering",
            "Biomedical Engineering",
            "Nuclear Engineering",
            "Robotics Engineering",
            "Nanotechnology",
            "Biotechnology",
        ],
    },
    Industrial: {
        name: "Industrial & Manufacturing",
        icon: "🏭",
        domains: [
            "Industrial Engineering",
            "Automobile Engineering",
            "Materials Science",
            "Textile Engineering",
            "Metallurgical Engineering",
            "Ceramic Engineering",
        ],
    },
    Environmental: {
        name: "Environmental & Resources",
        icon: "🌱",
        domains: [
            "Environmental Engineering",
            "Petroleum Engineering",
            "Mining Engineering",
            "Agricultural Engineering",
            "Geological Engineering",
            "Renewable Energy Engineering",
        ],
    },
    Emerging: {
        name: "Emerging Technologies",
        icon: "🔬",
        domains: [
            "Quantum Computing",
            "Blockchain Technology",
            "IoT Engineering",
            "Cybersecurity",
        ],
    },
};
// -----------------------------------------------------

const BranchSelection = () => {
    const navigate = useNavigate();
    
    // State to track the currently selected broad category (e.g., 'Tech', 'Core')
    const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
    const selectedCategory = TECHNICAL_BRANCHES[selectedCategoryKey];

    // Standard Tailwind classes
    const primaryColorClass = 'text-indigo-600';
    const bgColorClass = 'bg-indigo-600';

    // Ensure user came from the correct flow (optional but good practice)
    useEffect(() => {
        const interviewType = localStorage.getItem('current_interview_type');
        if (interviewType !== 'Technical') {
            // Redirect if the flow is wrong (e.g., user manually navigates here)
            // You can also add an alert here.
            navigate('/interview-selection');
        }
    }, [navigate]);


    // --- Conversion of handleDomainSelection (Clicking a Sub-Domain Button) ---
    const handleDomainSelection = (domain) => {
        // CRITICAL STEP: Save the technical domain selection
        localStorage.setItem("selected_technical_domain", domain);

        // FINAL STEP: Redirect the user to the Mode Selection page
        navigate("/mode-selection");
    };

    // --- Conversion of Category Card Click Handler ---
    const handleCategoryClick = (categoryKey) => {
        // 1. Update active state
        setSelectedCategoryKey(categoryKey);

        // 2. Clear old domain data just in case
        localStorage.removeItem("selected_technical_domain");

        // React handles showing/hiding the sub-domain section automatically via the render logic below.
        // It also handles scrolling if the user is on a mobile device and the list is long.
    };


    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Technical Interview: Select Your Domain
            </h1>
            <p className="text-xl text-gray-600 mb-10">
                Choose the broad area you wish to be interviewed in.
            </p>

            {/* --- TOP CATEGORY CARDS --- */}
            <div className="flex space-x-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4">
                
                {Object.entries(TECHNICAL_BRANCHES).map(([key, data]) => (
                    <div 
                        key={key}
                        onClick={() => handleCategoryClick(key)}
                        className={`
                            category-card flex-shrink-0 w-48 md:w-auto block bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition duration-300 cursor-pointer
                            ${selectedCategoryKey === key ? `border-b-4 border-indigo-600 shadow-2xl scale-[1.01]` : ''}
                        `}
                        data-category={key}
                    >
                        <div className={`text-3xl mb-1 ${primaryColorClass}`}>{data.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900">{data.name.split(' ')[0]}</h3>
                        <p className="text-xs text-gray-500">{data.domains[0]}, {data.domains[1]}, etc.</p>
                    </div>
                ))}
            </div>

            {/* --- SUB-DOMAIN SELECTION SECTION (CONDITIONAL RENDERING) --- */}
            <div 
                id="subDomainSelection" 
                className={`mt-12 p-6 bg-white rounded-xl shadow-2xl transition-opacity duration-500 ${selectedCategory ? '' : 'hidden'}`}
            >
                {selectedCategory && (
                    <>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Select Your Sub-Domain in <span id="selectedCategoryName" className={`${primaryColorClass} font-bold`}>{selectedCategory.name}</span>
                        </h2>

                        {/* Sub-Domain Buttons Container */}
                        <div id="subDomainButtons" className="flex flex-wrap gap-4 pb-2">
                            {selectedCategory.domains.map((domain) => (
                                <button
                                    key={domain}
                                    onClick={() => handleDomainSelection(domain)}
                                    className="py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-primary hover:text-white transition duration-150 domain-button text-center whitespace-nowrap"
                                    data-domain={domain}
                                >
                                    {domain}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

        </main>
    );
};

export default BranchSelection;