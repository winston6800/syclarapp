import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRICE_AMOUNT, TRIAL_DAYS } from '../lib/stripe';
import { 
  Clock, Zap, CheckCircle, Loader2, AlertCircle, 
  CreditCard, ArrowRight, LogOut, XCircle, Sparkles
} from 'lucide-react';

const TrialExpired: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, session, signOut, profile, hasActiveSubscription, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      if (!session) {
        throw new Error('Not authenticated - no session');
      }

      const requestBody = { 
        userId: user.id,
        email: user.email,
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        trialDays: 0, // No trial - they already used it
        successUrl: `${window.location.origin}/app`,
        cancelUrl: `${window.location.origin}/trial-expired`,
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      let data;
      let error;
      
      try {
        data = JSON.parse(responseText);
        if (!response.ok) {
          error = { message: data.error || `HTTP ${response.status}` };
        }
      } catch (e) {
        error = { message: `Failed to parse response: ${responseText}` };
      }

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('💳 Checkout failed:', err);
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // If user has an active subscription, redirect to app
  if (hasActiveSubscription) {
    navigate('/app');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative w-full max-w-lg">
        {/* Expired badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-400">Trial Period Ended</span>
          </div>
        </div>

        <div className="bg-dark-accent/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-900/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold rounded-lg flex items-center justify-center border-2 border-black">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-white mb-2">
            Your Trial Has Expired
          </h1>
          <p className="text-white/50 text-center text-sm mb-8">
            Don't lose your progress! Subscribe now to continue your transformation journey.
          </p>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* What you'll get back */}
          <div className="bg-black/40 border border-gold/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-gold" />
              <h3 className="text-sm font-bold text-gold uppercase tracking-wider">
                Unlock Everything
              </h3>
            </div>
            
            <div className="space-y-3">
              {[
                'Resume tracking your streak',
                'Access all logged progress',
                'AI-powered verification',
                'Achievement system',
                'Cross-device sync',
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-gold/70 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/20 rounded-xl mb-6">
            <div>
              <span className="text-white/40 text-sm">Premium Access</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-gold">${PRICE_AMOUNT}</span>
              <span className="text-white/40">/mo</span>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-gold to-gold-light text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gold/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Subscribe Now</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-white/30 text-xs mt-4">
            Secure payment powered by Stripe
          </p>

          <button
            onClick={handleSignOut}
            className="w-full mt-6 py-3 text-white/40 hover:text-white/60 transition flex items-center justify-center space-x-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Stats reminder */}
        {profile && (
          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              Your data is safely stored. Subscribe to pick up where you left off.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialExpired;
