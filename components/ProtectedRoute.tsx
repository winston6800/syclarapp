import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = true 
}) => {
  const { user, loading, hasActiveSubscription, isTrialing, profile } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', {
    path: location.pathname,
    user_exists: !!user,
    loading,
    requireSubscription,
    hasActiveSubscription,
    isTrialing,
    profile_subscription_status: profile?.subscription_status,
  });

  if (loading) {
    console.log('🛡️ Still loading, showing spinner');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-gold/60 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🛡️ No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSubscription && !hasActiveSubscription && !isTrialing) {
    console.log('🛡️ No subscription/trial, redirecting to subscribe');
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }

  console.log('🛡️ Access granted!');
  return <>{children}</>;
};

export default ProtectedRoute;


