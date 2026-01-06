import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PRICE_AMOUNT, TRIAL_DAYS } from '../lib/stripe';
import { 
  Zap, CheckCircle, Loader2, AlertCircle, Shield, 
  CreditCard, ArrowRight, LogOut
} from 'lucide-react';

const Subscribe: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, signOut, profile, isTrialing, trialDaysRemaining } = useAuth();
  const navigate = useNavigate();

  const handleStartTrial = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('💳 Starting checkout process...');
      console.log('💳 User ID:', user.id);
      console.log('💳 Email:', user.email);
      console.log('💳 Price ID:', import.meta.env.VITE_STRIPE_PRICE_ID);
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      console.log('💳 Session token (first 20 chars):', session.access_token.substring(0, 20));

      const requestBody = { 
        userId: user.id,
        email: user.email,
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        trialDays: TRIAL_DAYS,
        successUrl: `${window.location.origin}/app`,
        cancelUrl: `${window.location.origin}/subscribe`,
      };
      
      console.log('💳 Request body:', requestBody);

      // Call your Supabase Edge Function to create Stripe checkout session
      console.log('💳 Calling Edge Function...');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('💳 Edge Function response:', { data, error });

      if (error) {
        console.error('💳 Edge Function error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('💳 Redirecting to Stripe:', data.url);
        window.location.href = data.url;
      } else {
        console.error('💳 No checkout URL returned:', data);
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('💳 Checkout failed:', err);
      console.error('💳 Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        full: err
      });
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // If user already has trial/subscription that's valid, redirect to app
  if (isTrialing || profile?.subscription_status === 'active') {
    navigate('/app');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-black to-black" />
      
      <div className="relative w-full max-w-lg">
        <div className="bg-dark-accent/50 backdrop-blur-xl border border-gold/20 rounded-3xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center">
              <Zap className="w-10 h-10 text-black" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-white mb-2">
            Unlock Full Access
          </h1>
          <p className="text-white/50 text-center text-sm mb-8">
            Start your {TRIAL_DAYS}-day free trial to begin your transformation
          </p>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm font-bold">Error Starting Trial</p>
              </div>
              <p className="text-red-400 text-xs mb-2">{error}</p>
              <p className="text-red-300/50 text-xs">
                Check the browser console (F12) for detailed error logs starting with 💳
              </p>
            </div>
          )}

          {/* Pricing Card */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Premium Coach</h3>
                <p className="text-white/40 text-sm">Full access</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-gold">${PRICE_AMOUNT}</span>
                <span className="text-white/40">/mo</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                'Unlimited interaction logging',
                'AI-powered verification',
                'Progress analytics & streaks',
                'Achievement system',
                'Cross-device sync',
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                  <span className="text-white/70 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gold/10 border border-gold/20 rounded-xl">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm text-gold">
                {TRIAL_DAYS}-day free trial • Cancel anytime
              </span>
            </div>
          </div>

          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full py-4 bg-gold text-black font-bold rounded-xl hover:bg-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Start {TRIAL_DAYS}-Day Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-white/30 text-xs mt-4">
            You won't be charged during your trial period
          </p>

          <button
            onClick={handleSignOut}
            className="w-full mt-6 py-3 text-white/40 hover:text-white/60 transition flex items-center justify-center space-x-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;


