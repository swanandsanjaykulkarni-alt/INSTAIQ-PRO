// client/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);

  // ✅ Initialize Google Login
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "796985895859-iiu4mtk7ipgekq5nb6igvcvpkglht8km.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });
        const container = document.getElementById("googleLoginDiv");
        if (container) container.innerHTML = "";
        window.google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 320,
        });
      }
    };

    if (!document.getElementById("google-script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-script";
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  // ✅ Handle Google Login Response
  const handleGoogleResponse = async (response) => {
    try {
      const userObject = jwtDecode(response.credential);
      const { name, email } = userObject;

      const res = await fetch(`${API_BASE_URL}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/interview-selection");
      } else {
        setMessage({ text: data.message || "Google login failed", isError: true });
      }
    } catch (err) {
      console.error("Google login error:", err);
      setMessage({ text: "Something went wrong with Google login", isError: true });
    }
  };

  // ✅ Handle manual login
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "Signing in...", isError: false });

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage({ text: "Login successful! Redirecting...", isError: false });
        setTimeout(() => navigate("/interview-selection"), 1000);
      } else {
        setMessage({ text: data.message || "Invalid credentials", isError: true });
      }
    } catch (error) {
      setMessage({ text: "Server connection failed.", isError: true });
    }
  };

  return (
    <div className="flex flex-col items-center pt-20 pb-10 min-h-screen bg-gray-50">
      <div className="w-full max-w-md px-4 sm:px-0">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign In to Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              to="/signup"
              className="text-indigo-600 font-medium hover:text-indigo-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm"
              />
            </div>

            {message && (
              <div
                className={`text-sm font-medium p-2 rounded-md ${
                  message.isError ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {/* ✅ Google Login Button (Bottom Section) */}
          <div className="flex justify-center">
            <div id="googleLoginDiv"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
