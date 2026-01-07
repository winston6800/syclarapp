import { useState, useEffect, useCallback, useRef } from 'react';
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Save data to both localStorage and Supabase (without updating state)
  const saveUserState = useCallback(async (newState: UserState) => {
    console.log('💾 Saving user state:', { 
      currentPassedBy: newState.currentPassedBy,
      todayPasses: newState.dailyPasses[new Date().toLocaleDateString('en-CA')],
      hasUser: !!user,
      hasSubscription: hasActiveSubscription 
    });
    
    // Always save to localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      console.log('✅ Saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }

    // Sync to Supabase if authenticated
    if (user && hasActiveSubscription) {
      setSyncing(true);
      try {
        const { error } = await supabase.from('user_data').upsert({
          user_id: user.id,
          data: newState,
          updated_at: new Date().toISOString(),
        });
        
        if (error) {
          console.error('❌ Failed to sync to Supabase:', error);
        } else {
          console.log('✅ Synced to Supabase');
        }
      } catch (error) {
        console.error('❌ Failed to sync to Supabase:', error);
      }
      setSyncing(false);
    }
  }, [user, hasActiveSubscription]);

  // Auto-save whenever userState changes (debounced - 2 seconds)
  useEffect(() => {
    if (userState && !loading) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce saves by 2 seconds (only saves after user stops interacting)
      saveTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-saving state...');
        saveUserState(userState);
      }, 2000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [userState, loading, saveUserState]);

  // Save on page unload/navigation (ensures no data loss)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userState && !loading) {
        // Clear timeout and save immediately to localStorage
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        // Synchronous save to localStorage (always completes)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
        console.log('💾 Emergency save on page unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload); // For mobile Safari
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [userState, loading]);

  // Update function that accepts a callback or new state
  const updateUserState = useCallback((
    updater: UserState | ((prev: UserState) => UserState)
  ) => {
    setUserState(prev => {
      const newState = typeof updater === 'function' 
        ? updater(prev || getDefaultState()) 
        : updater;
      
      return newState;
    });
  }, []);

  return {
    userState: userState || getDefaultState(),
    setUserState: updateUserState,
    loading,
    syncing,
  };
};



