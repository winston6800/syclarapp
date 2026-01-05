import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserState } from '../types';

const STORAGE_KEY = 'syclar_user_state_v12';

// Default state for new users
const getDefaultState = (): UserState => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return {
    confidenceLevel: 45,
    streak: 0,
    minThreshold: 1,
    history: [
      { date: 'Mon', confidence: 25 },
      { date: 'Tue', confidence: 35 },
      { date: 'Wed', confidence: 42 },
      { date: 'Thu', confidence: 45 },
    ],
    approachDates: [],
    dailyPasses: {},
    dailyApproaches: {},
    dailyBusinessFocus: {},
    stats: {
      avgDuration: 0,
      rejectionResilience: 0,
      uniqueLocations: 0,
      morningInteractions: 0,
      totalApproaches: 0,
      totalPassedBy: 0
    },
    achievements: [
      { id: 'streak-3', title: 'Momentum', description: '3-Day Streak', icon: '🔥', unlocked: false, progress: 0, target: 3, category: 'CONSISTENCY' },
      { id: 'streak-7', title: 'Unstoppable', description: '7-Day Streak', icon: '⚡', unlocked: false, progress: 0, target: 7, category: 'CONSISTENCY' },
      { id: 'approaches-10', title: 'Initiator', description: '10 Interactions', icon: '🎯', unlocked: false, progress: 0, target: 10, category: 'STAMINA' },
      { id: 'approaches-50', title: 'Social Dynamo', description: '50 Interactions', icon: '💪', unlocked: false, progress: 0, target: 50, category: 'STAMINA' },
    ],
    homeLocation: null,
    currentPassedBy: 0,
    isOnBreak: false,
  };
};

export const useUserData = () => {
  const { user, hasActiveSubscription } = useAuth();
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load data from Supabase or localStorage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (user && hasActiveSubscription) {
        // Try to load from Supabase first
        const { data, error } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', user.id)
          .single();

        if (data?.data) {
          setUserState(data.data as UserState);
        } else {
          // Check localStorage for migration
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData) {
            const parsed = JSON.parse(localData);
            setUserState(parsed);
            // Migrate to Supabase
            await supabase.from('user_data').upsert({
              user_id: user.id,
              data: parsed,
              updated_at: new Date().toISOString(),
            });
          } else {
            setUserState(getDefaultState());
          }
        }
      } else {
        // Fallback to localStorage for non-authenticated users
        const localData = localStorage.getItem(STORAGE_KEY);
        setUserState(localData ? JSON.parse(localData) : getDefaultState());
      }

      setLoading(false);
    };

    loadData();
  }, [user, hasActiveSubscription]);

  // Save data to both localStorage and Supabase
  const saveUserState = useCallback(async (newState: UserState) => {
    setUserState(newState);
    
    // Always save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    // Sync to Supabase if authenticated
    if (user && hasActiveSubscription) {
      setSyncing(true);
      try {
        await supabase.from('user_data').upsert({
          user_id: user.id,
          data: newState,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to sync to Supabase:', error);
      }
      setSyncing(false);
    }
  }, [user, hasActiveSubscription]);

  // Update function that accepts a callback or new state
  const updateUserState = useCallback((
    updater: UserState | ((prev: UserState) => UserState)
  ) => {
    setUserState(prev => {
      const newState = typeof updater === 'function' 
        ? updater(prev || getDefaultState()) 
        : updater;
      
      // Save in background
      saveUserState(newState);
      
      return newState;
    });
  }, [saveUserState]);

  return {
    userState: userState || getDefaultState(),
    setUserState: updateUserState,
    loading,
    syncing,
  };
};


