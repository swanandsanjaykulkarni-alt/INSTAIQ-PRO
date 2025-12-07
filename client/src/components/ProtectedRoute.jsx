// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check for the authentication item saved during successful login
    const isAuthenticated = localStorage.getItem('user_id'); 

    if (!isAuthenticated) {
        // User is not logged in, redirect them to the login page
        // The 'replace' prop ensures they can't hit the back button to get in
        return <Navigate to="/login" replace />;
    }

    // User is logged in, render the protected component
    return children;
};

export default ProtectedRoute;