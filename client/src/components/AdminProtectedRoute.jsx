// client/src/components/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
    // Checks for the admin-specific token
    const isAdminAuthenticated = localStorage.getItem('admin_token');

    if (!isAdminAuthenticated) {
        // Redirect to admin login if not authenticated
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminProtectedRoute;