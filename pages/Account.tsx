import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRICE_AMOUNT } from '../lib/stripe';
import {
  ArrowLeft, User, CreditCard, Crown, Flame,
  Calendar, Loader2, AlertCircle, CheckCircle, LogOut, ExternalLink
} from 'lucide-react';

const Account: React.FC = () => {
  const { user, profile, signOut, isTrialing, trialDaysRemaining, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
    navigate('/');
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
                <span className="text-white/60">Next billing</span>
                <span className="text-white">{formatDate(profile.current_period_end)}</span>
              </div>
            )}
          </div>

          {/* Manage Billing Button */}
          {profile?.stripe_customer_id && (
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="w-full mt-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition flex items-center justify-center space-x-2"
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


