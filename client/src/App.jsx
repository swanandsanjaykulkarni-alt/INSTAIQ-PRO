// client/src/App.jsx (UPDATED with Admin Folder structure)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute'; 
import AdminProtectedRoute from './components/AdminProtectedRoute'; 

// --- Pages (User Imports) ---
import Home from './pages/Home.jsx';
import SignUp from './pages/SignUp.jsx';
import Login from './pages/Login.jsx'; 
import InterviewSelection from './pages/InterviewSelection.jsx'; 
import BranchSelection from './pages/BranchSelection.jsx';
import ModeSelection from './pages/ModeSelection.jsx'; 
import ChatInterview from './pages/ChatInterview.jsx'; 
import VirtualInterview from './pages/VirtualInterview.jsx'; 
import ReportsPage from './pages/ReportsPage.jsx'; 
import InterviewHistoryPage from './pages/InterviewHistoryPage.jsx'; 
import ProfilePage from './pages/ProfilePage.jsx'; 

// --- Pages (Admin Imports - PATHS UPDATED) ---
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'; // <-- Updated Path
import AdminDashboard from './pages/admin/AdminDashboard.jsx'; // <-- Updated Path

function App() {
  return (
    <Router>
      <Header /> 
      
      <div className="min-h-screen bg-gray-50 pt-20"> 
        <Routes>
          
          {/* 1. UNPROTECTED USER ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} /> 
          <Route path="/login" element={<Login />} /> 

          {/* 2. PROTECTED USER ROUTES */}
          <Route path="/interview-selection" element={<ProtectedRoute><InterviewSelection /></ProtectedRoute>} />
          <Route path="/branch-selection" element={<ProtectedRoute><BranchSelection /></ProtectedRoute>} />
          <Route path="/mode-selection" element={<ProtectedRoute><ModeSelection /></ProtectedRoute>} />
          <Route path="/chat-interview" element={<ProtectedRoute><ChatInterview /></ProtectedRoute>} />
          <Route path="/virtual-interview" element={<ProtectedRoute><VirtualInterview /></ProtectedRoute>} />

          {/* User Data Views */}
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/interview-history" element={<ProtectedRoute><InterviewHistoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* 3. ADMIN ROUTES */}
          <Route 
              path="/admin/login" 
              element={<AdminLoginPage />} 
          />
          <Route 
              path="/admin/dashboard" 
              element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} 
          />
          
          {/* 4. FALLBACK ROUTE */}
          <Route path="*" element={<main className="max-w-7xl mx-auto p-4"><h1 className="text-4xl text-center pt-20">404 - Page Not Found</h1></main>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;