import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseSelection from './pages/CourseSelection';
import Timetable from './pages/Timetable';
import CourseForm from './pages/CourseForm';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsList from './pages/admin/StudentsList';
import PendingApprovals from './pages/admin/PendingApprovals';
import Analytics from './pages/admin/Analytics';
import TokenGenerator from './pages/admin/TokenGenerator';
import Settings from './pages/admin/Settings';
import Signatures from './pages/admin/Signatures';
import CourseManagement from './pages/admin/CourseManagement';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course-selection"
            element={
              <ProtectedRoute>
                <CourseSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <Timetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course-form"
            element={
              <ProtectedRoute>
                <CourseForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute adminOnly={true}>
                <StudentsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute adminOnly={true}>
                <PendingApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute adminOnly={true}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tokens"
            element={
              <ProtectedRoute adminOnly={true}>
                <TokenGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute adminOnly={true}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/signatures"
            element={
              <ProtectedRoute adminOnly={true}>
                <Signatures />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute adminOnly={true}>
                <CourseManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute adminOnly={true}>
                <CourseManagement />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;