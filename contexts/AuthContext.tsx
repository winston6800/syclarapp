import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile, SubscriptionStatus } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number;
  isTrialExpired: boolean;
  isCanceled: boolean;
  cancelAtPeriodEnd: boolean;
  daysUntilCancellation: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.log('📊 Fetching profile for user:', userId);
    try {
      const { data, error, status, statusText } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📊 Profile query result:', { data, error, status, statusText });

      if (error) {
        console.error('📊 Error fetching profile:', error.message, error.code, error.details);
        return null;
      }
      console.log('📊 Profile fetched successfully:', data);
      return data as UserProfile;
    } catch (err) {
      console.error('📊 Exception fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Get initial session
    console.log('🔄 Initializing auth...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 Initial session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    }).catch(err => {
      console.error('🔄 Auth initialization error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);  // Set loading to false immediately
        
        // Fetch profile in background (don't block)
        if (session?.user) {
          fetchProfile(session.user.id).then(setProfile).catch(err => {
            console.error('Failed to fetch profile:', err);
            setProfile(null);
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('🔐 Sign in result:', { data, error });
      return { error: error as Error | null };
    } catch (err) {
      console.error('🔐 Sign in exception:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error as Error | null };
  };

  // Calculate subscription status
  const isTrialing = profile?.subscription_status === 'trialing';
  
  const trialDaysRemaining = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Check if trial has expired (was trialing but trial_ends_at is in the past)
  const isTrialExpired = 
    profile?.subscription_status === 'none' && 
    profile?.trial_ends_at !== null && 
    new Date(profile.trial_ends_at).getTime() < Date.now();

  // Check if subscription is canceled
  const isCanceled = profile?.subscription_status === 'canceled';
  
  // Check if subscription will cancel at period end (still active but scheduled for cancellation)
  const cancelAtPeriodEnd = profile?.cancel_at_period_end === true;
  
  // Calculate days until cancellation takes effect
  const daysUntilCancellation = cancelAtPeriodEnd && profile?.current_period_end
    ? Math.max(0, Math.ceil((new Date(profile.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Active subscription includes active or trialing (but not if trial has expired via time check)
  // TEMPORARY: Auto-grant full access to everyone
  const hasActiveSubscription = true; // Always grant access
    // profile?.subscription_status === 'active' || 
    // (profile?.subscription_status === 'trialing' && trialDaysRemaining > 0);
  
  // Debug logging
  console.log('🔐 Subscription check:', {
    profile_subscription_status: profile?.subscription_status,
    hasActiveSubscription,
    isTrialing,
    isTrialExpired,
    isCanceled,
    cancelAtPeriodEnd,
    trialDaysRemaining,
    profile_exists: !!profile,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
        hasActiveSubscription,
        isTrialing,
        trialDaysRemaining,
        isTrialExpired,
        isCanceled,
        cancelAtPeriodEnd,
        daysUntilCancellation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


