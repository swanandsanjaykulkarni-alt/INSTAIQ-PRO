// scripts/selection.js

document.addEventListener("DOMContentLoaded", () => {
    const modeCards = document.querySelectorAll(".mode-card");

    modeCards.forEach((card) => {
        const startButton = card.querySelector("button");
        // Get the specific mode: 'virtual-video', 'virtual-voice', or 'chat'
        const mode = card.dataset.mode;

        startButton.addEventListener("click", (e) => {
            e.preventDefault();

            // CRITICAL STEP: Save the specific mode selection
            localStorage.setItem("selected_interview_mode", mode);

            if (mode === "chat") {
                // Redirect to the Chat Interview page (to be built later)
                window.location.href = "chat-interview.html";
            } else {
                // Redirect to the single Virtual Interview page for both voice and video
                window.location.href = "virtual-interview.html";
            }
        });
    });
});
