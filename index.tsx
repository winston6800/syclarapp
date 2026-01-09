import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Subscribe from './pages/Subscribe';
import TrialExpired from './pages/TrialExpired';
import AppDashboard from './pages/AppDashboard';
import Account from './pages/Account';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Auth required, no subscription needed */}
          <Route 
            path="/subscribe" 
            element={
              <ProtectedRoute requireSubscription={false}>
                <Subscribe />
              </ProtectedRoute>
            } 
          />
          
          {/* Trial expired page - auth required, no subscription needed */}
          <Route 
            path="/trial-expired" 
            element={
              <ProtectedRoute requireSubscription={false}>
                <TrialExpired />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - require auth + subscription */}
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <AppDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            } 
          />

          {/* Auth callback for Supabase */}
          <Route path="/auth/callback" element={<Navigate to="/app" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
