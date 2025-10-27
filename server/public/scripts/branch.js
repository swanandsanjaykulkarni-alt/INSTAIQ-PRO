// scripts/branch.js

// --- TECHNICAL BRANCH DATA STRUCTURE ---
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
// ----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const categoryCards = document.querySelectorAll(".category-card");
    const subDomainSection = document.getElementById("subDomainSelection");
    const selectedCategoryName = document.getElementById(
        "selectedCategoryName",
    );
    const subDomainButtons = document.getElementById("subDomainButtons");

    function handleDomainSelection(e) {
        const domain = e.target.dataset.domain;

        // CRITICAL STEP: Save the technical domain selection before moving on.
        localStorage.setItem("selected_technical_domain", domain);

        // FINAL STEP: Redirect the user to the Mode Selection page
        window.location.href = "mode-selection.html";
    }

    categoryCards.forEach((card) => {
        card.addEventListener("click", (e) => {
            e.preventDefault();
            const categoryKey = card.dataset.category;
            const category = TECHNICAL_BRANCHES[categoryKey];

            if (category) {
                // 1. Update active card styling
                categoryCards.forEach((c) => c.classList.remove("active"));
                card.classList.add("active");

                // 2. Update the header text
                selectedCategoryName.textContent = category.name;

                // 3. Clear and inject sub-domain buttons
                subDomainButtons.innerHTML = "";
                category.domains.forEach((domain) => {
                    const button = document.createElement("button");
                    button.textContent = domain;
                    button.className =
                        "py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-primary hover:text-white transition duration-150 domain-button text-center whitespace-nowrap";
                    button.dataset.domain = domain;

                    button.addEventListener("click", handleDomainSelection);

                    subDomainButtons.appendChild(button);
                });

                // 4. Show the sub-domain selection section and scroll
                subDomainSection.classList.remove("hidden");
                subDomainSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});
