// auth.js

const API_BASE_URL = ""; // If your API is on the same domain, leave this empty.
// If not, change to 'http://localhost:3000' or your domain.

/**
 * Utility function to display success or error messages.
 * @param {string} message - The message text.
 * @param {boolean} isError - True if it's an error message.
 */
function displayMessage(message, isError = false) {
    const messageArea = document.getElementById("messageArea");
    if (messageArea) {
        messageArea.textContent = message;
        if (isError) {
            messageArea.className =
                "text-sm font-medium text-red-600 p-2 bg-red-50 rounded-md";
        } else {
            messageArea.className =
                "text-sm font-medium text-green-600 p-2 bg-green-50 rounded-md";
        }
    }
}

/**
 * Handles user registration.
 */
async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;

    displayMessage("Registering...", false); // Clear previous messages

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage(
                data.message ||
                    "Account created successfully! Redirecting to login...",
                false,
            );
            // Redirect to login after successful registration
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            displayMessage(
                data.message || "Registration failed. Please try again.",
                true,
            );
        }
    } catch (error) {
        console.error("Registration Error:", error);
        displayMessage(
            "A network error occurred. Check server connection.",
            true,
        );
    }
}

/**
 * Handles user login.
 */
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;

    displayMessage("Signing in...", false); // Clear previous messages

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS: Save user info to localStorage
            const user = data.user;

            localStorage.setItem("user_id", user._id);
            localStorage.setItem("user_name", user.name);
            localStorage.setItem("user_email", user.email);

            // NOTE: Your backend login route currently does NOT return a token.
            // If you implement a token (JWT), you must save it here:
            // localStorage.setItem('auth_token', user.token);

            displayMessage(
                data.message || "Login successful! Redirecting...",
                false,
            );

            // Redirect to the main interview page
            setTimeout(() => {
                window.location.href = "interview.html"; // Placeholder for the main page
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
}

// Attach event listeners when the script loads
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
});
