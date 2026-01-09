import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRICE_AMOUNT } from '../lib/stripe';
import {
  ArrowLeft, User, CreditCard, Crown, Flame,
  Calendar, Loader2, AlertCircle, CheckCircle, LogOut, ExternalLink,
  XCircle, AlertTriangle, Clock
} from 'lucide-react';

const Account: React.FC = () => {
  const { 
    user, 
    profile, 
    signOut, 
    isTrialing, 
    trialDaysRemaining, 
    refreshProfile,
    cancelAtPeriodEnd,
    daysUntilCancellation,
    session
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleCancelSubscription = async () => {
    if (!user || !session) return;
    
    setCancelLoading(true);
    setError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/cancel-subscription`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ 
          userId: user.id,
          subscriptionId: profile?.subscription_id 
        }),
      });
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`Failed to parse response: ${responseText}`);
        }
        throw e;
      }

      setSuccess('Your subscription will be canceled at the end of the current billing period.');
      setShowCancelModal(false);
      
      // Refresh profile to get updated status
      await refreshProfile();
    } catch (err: any) {
      console.error('❌ Cancel subscription failed:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user || !session) return;
    
    setLoading(true);
    setError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/reactivate-subscription`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ 
          userId: user.id,
          subscriptionId: profile?.subscription_id 
        }),
      });
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`Failed to parse response: ${responseText}`);
        }
        throw e;
      }

      setSuccess('Your subscription has been reactivated!');
      
      // Refresh profile to get updated status
      await refreshProfile();
    } catch (err: any) {
      console.error('❌ Reactivate subscription failed:', err);
      setError(err.message || 'Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { 
          customerId: profile?.stripe_customer_id,
          returnUrl: `${window.location.origin}/account`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-black to-black" />
      
      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-dark-accent border border-red-500/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white">Cancel Subscription?</h3>
              
              <p className="text-white/60 text-sm">
                Your subscription will remain active until the end of your current billing period. 
                After that, you'll lose access to all premium features.
              </p>

              <div className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">You'll lose access to:</p>
                <ul className="space-y-1 text-white/60 text-sm">
                  <li>• Progress tracking & streaks</li>
                  <li>• AI-powered verification</li>
                  <li>• Achievement system</li>
                  <li>• Cross-device sync</li>
                </ul>
              </div>

              <div className="flex flex-col w-full space-y-3 pt-2">
                <button 
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="w-full py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition flex items-center justify-center space-x-2"
                >
                  {cancelLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Yes, Cancel Subscription</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition"
                >
                  Keep My Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-lg mx-auto px-6 py-8">
        <Link 
          to="/app" 
          className="inline-flex items-center space-x-2 text-white/50 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to app</span>
        </Link>

        <h1 className="text-2xl font-black text-white mb-8">Account Settings</h1>

        {error && (
          <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-dark-accent/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="font-bold text-white">{user?.email}</p>
              <p className="text-sm text-white/40">Member since {formatDate(profile?.created_at || null)}</p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-dark-accent/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gold" />
            <span>Subscription</span>
          </h2>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/60">Status</span>
              <div className="flex items-center space-x-2">
                {isTrialing ? (
                  <>
                    <Flame className="w-4 h-4 text-gold" />
                    <span className="text-gold font-bold">Trial</span>
                  </>
                ) : profile?.subscription_status === 'active' ? (
                  <>
                    <Crown className="w-4 h-4 text-gold" />
                    <span className="text-gold font-bold">Premium</span>
                  </>
                ) : (
                  <span className="text-white/40">Inactive</span>
                )}
              </div>
            </div>

            {/* Plan */}
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/60">Plan</span>
              <span className="text-white font-medium">
                ${PRICE_AMOUNT}/month
              </span>
            </div>

            {/* Trial/Billing Info */}
            {isTrialing && (
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/60">Trial ends</span>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gold/60" />
                  <span className="text-white">
                    {formatDate(profile?.trial_ends_at || null)}
                    <span className="text-gold/60 ml-2">({trialDaysRemaining} days)</span>
                  </span>
                </div>
              </div>
            )}

            {profile?.subscription_status === 'active' && profile?.current_period_end && (
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/60">
                  {cancelAtPeriodEnd ? 'Access until' : 'Next billing'}
                </span>
                <span className="text-white">{formatDate(profile.current_period_end)}</span>
              </div>
            )}

            {/* Cancellation Pending Notice */}
            {cancelAtPeriodEnd && (
              <div className="py-3 border-b border-white/10">
                <div className="flex items-center space-x-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-400 text-sm font-medium">
                      Cancellation pending
                    </p>
                    <p className="text-amber-400/70 text-xs">
                      {daysUntilCancellation} day{daysUntilCancellation !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {/* Manage Billing Button */}
            {profile?.stripe_customer_id && (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="w-full py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Manage Billing</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Cancel/Reactivate Subscription Button */}
            {profile?.subscription_status === 'active' && !isTrialing && (
              cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={loading}
                  className="w-full py-3 bg-gold/10 border border-gold/30 text-gold font-medium rounded-xl hover:bg-gold/20 transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Reactivate Subscription</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3 bg-transparent border border-red-500/20 text-red-400/60 font-medium rounded-xl hover:bg-red-500/10 hover:text-red-400 transition flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Subscription</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition flex items-center justify-center space-x-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Account;


