// scripts/interview.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Get the username from localStorage (set during successful login)
    const userName = localStorage.getItem("user_name");
    const userNameDisplay = document.getElementById("userNameDisplay");

    // 2. Update the greeting if the element and name exist
    if (userName && userNameDisplay) {
        // Capitalize the first letter of the name for a clean display
        const formattedName =
            userName.charAt(0).toUpperCase() + userName.slice(1);
        userNameDisplay.textContent = formattedName;
    }

    // 3. Basic protection: If no user is logged in, redirect to login page
    const userId = localStorage.getItem("user_id");
    if (!userId) {
        // In a real app, you might check for a valid token, but for now, id is enough.
        console.warn(
            "User ID not found in localStorage. Redirecting to login.",
        );
        // window.location.href = 'login.html';
    }

    // Future logic for handling card clicks will go here
    document.querySelectorAll(".interview-card").forEach((card) => {
        card.addEventListener("click", (e) => {
            e.preventDefault();
            const interviewType = card.dataset.type;
            console.log(`Starting ${interviewType} interview...`);
            // Next step: redirect to a page to select branch/category
        });
    });
});
