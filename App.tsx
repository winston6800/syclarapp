
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import { AppScreen, Achievement, UserState, Difficulty, UserStats, Location } from './types';
import { useUserData } from './hooks/useUserData';
import { Trophy, Zap, AlertCircle, CheckCircle2, Play, RefreshCw, X, Flame, Calendar, Award, MapPin, Clock, ShieldCheck, Target, Map as MapIcon, Home as HomeIcon, Settings, Terminal, Plus, Minus, UserMinus, Crosshair, Navigation, Eye, EyeOff, CheckCircle, Trash2, FastForward, Dice5, Coffee, ZapOff, ChevronRight, ChevronDown, ChevronLeft, Briefcase, History, BarChart3, Check, Quote, Star, Filter, CalendarPlus, Sun, Cloud, Wifi, Globe, Edit2, Heart, Square, CheckSquare, UserPlus, Sparkles } from 'lucide-react';
import { SocialEvent, EventEnvironment, DateConnection, DateMilestones } from './types';

/**
 * Utility to calculate the current streak based on activity dates.
 */
const calculateCurrentStreak = (approachDates: string[], businessFocus: Record<string, boolean>): number => {
  const focusDates = Object.entries(businessFocus)
    .filter(([_, active]) => active)
    .map(([date]) => date);
  
  const allActiveDates = Array.from(new Set([...approachDates, ...focusDates])).sort((a, b) => b.localeCompare(a));
  
  if (allActiveDates.length === 0) return 0;

  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  
  const latestDate = allActiveDates[0];
  
  if (latestDate !== today && latestDate !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < allActiveDates.length - 1; i++) {
    const d1 = new Date(allActiveDates[i]);
    const d2 = new Date(allActiveDates[i + 1]);
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / 86400000);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const HeadlineRoller: React.FC = () => {
  const headlines = [
    "The point is to talk to the girl, not to secure a date.",
    "Don't try to be smooth.",
    "Do not be intimidated by anyone, authority, crowds, or haters.",
    "Reclaim your freedom to act.",
    "Action is the only antidote to anxiety.",
    "High value is shared energy, not social performance.",
    "It hurts far more not to approach than to be rejected."
  ];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % headlines.length);
        setFade(true);
      }, 500);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/40 border-y border-gold/10 py-3 px-4 overflow-hidden relative group">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Quote size={12} className="text-gold animate-pulse" />
        </div>
        <div className={`transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <p className="text-[11px] font-black uppercase italic tracking-tight text-gold/90 leading-tight">
            {headlines[index]}
          </p>
        </div>
      </div>
      <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-dark-accent/80 to-transparent pointer-events-none"></div>
    </div>
  );
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.BASE);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const updatePassedByRef = useRef<boolean>(false);
  
  // Use the new hook for Supabase sync
  const { userState, setUserState, loading: dataLoading } = useUserData();

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Sync currentPassedBy with today's dailyPasses value when day changes or data loads
  useEffect(() => {
    if (userState && !dataLoading) {
      const today = new Date().toLocaleDateString('en-CA');
      const todayPasses = userState.dailyPasses[today] || 0;
      // Only update if currentPassedBy doesn't match today's passes and we're not in the middle of an update
      if (userState.currentPassedBy !== todayPasses && !updatePassedByRef.current) {
        setUserState(prev => {
          // Double-check the date hasn't changed during the update
          const currentToday = new Date().toLocaleDateString('en-CA');
          const currentTodayPasses = prev.dailyPasses[currentToday] || 0;
          return { ...prev, currentPassedBy: currentTodayPasses };
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState?.dailyPasses, dataLoading]);

  const handleVerifySuccess = (isRejection: boolean = false, withFriends: boolean = false, customDate?: string) => {
    const today = customDate || new Date().toLocaleDateString('en-CA');
    const isMorning = new Date().getHours() < 10;

    setUserState(prev => {
      const isAlreadyLoggedToday = prev.approachDates.includes(today);
      const newDates = isAlreadyLoggedToday ? prev.approachDates : [...prev.approachDates, today];
      const newDailyApproaches = { ...prev.dailyApproaches };
      newDailyApproaches[today] = (newDailyApproaches[today] || 0) + 1;

      const newBusinessFocus = { ...prev.dailyBusinessFocus };
      newBusinessFocus[today] = false;

      const currentStreak = calculateCurrentStreak(newDates, newBusinessFocus);

      const newStats = { ...prev.stats };
      newStats.totalApproaches += 1;
      if (isRejection) newStats.rejectionResilience += 1;
      if (isMorning) newStats.morningInteractions += 1;
      if (withFriends) newStats.approachesWithFriends += 1;

      const newAchievements = prev.achievements.map(ach => {
        let newProgress = ach.progress;
        if (ach.id.startsWith('streak-')) {
          newProgress = Math.max(ach.progress, currentStreak);
        } else if (ach.id === 'vol-100' || ach.id === 'approaches-10' || ach.id === 'approaches-50') {
          newProgress = newStats.totalApproaches;
        } else if (ach.id === 'morning-20') {
          newProgress = newStats.morningInteractions;
        } else if (ach.id === 'golden-approach') {
          newProgress = newStats.approachesWithFriends;
        }
        const unlocked = newProgress >= ach.target;
        return { ...ach, progress: newProgress, unlocked };
      });

      return {
        ...prev,
        approachDates: newDates,
        dailyApproaches: newDailyApproaches,
        dailyBusinessFocus: newBusinessFocus,
        streak: currentStreak,
        stats: newStats,
        achievements: newAchievements,
        currentPassedBy: 0,
        isOnBreak: false
      };
    });
  };

  // Ignition Mode: log whether an approach window was seized or frozen on.
  const logIgnitionWindow = (seized: boolean) => {
    setUserState(prev => {
      const newStats = { ...prev.stats };
      if (seized) newStats.windowsSeized += 1;
      else newStats.windowsFrozen += 1;

      const newAchievements = prev.achievements.map(ach => {
        if (ach.id === 'ignition-10') {
          const newProgress = newStats.windowsSeized;
          return { ...ach, progress: newProgress, unlocked: newProgress >= ach.target };
        }
        return ach;
      });

      return { ...prev, stats: newStats, achievements: newAchievements };
    });
  };

  // Purpose track: a planned outing (Events tab) was actually carried out.
  const markOutingCompleted = () => {
    setUserState(prev => {
      const newStats = { ...prev.stats, plannedOutingsCompleted: prev.stats.plannedOutingsCompleted + 1 };
      const newAchievements = prev.achievements.map(ach => {
        if (ach.id === 'purpose-1' || ach.id === 'purpose-5') {
          const newProgress = newStats.plannedOutingsCompleted;
          return { ...ach, progress: newProgress, unlocked: newProgress >= ach.target };
        }
        return ach;
      });
      return { ...prev, stats: newStats, achievements: newAchievements };
    });
  };

  const updateMinThreshold = () => {
    setUserState(prev => ({
      ...prev,
      minThreshold: prev.minThreshold >= 10 ? 1 : prev.minThreshold + 1
    }));
  };

  const simulateData = (daysCount: number) => {
    const datesToAdd: string[] = [];
    const passesToAdd: Record<string, number> = {};
    const approachesToAdd: Record<string, number> = {};
    const focusToAdd: Record<string, boolean> = {};
    const now = new Date();
    
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString('en-CA');
      
      const rand = Math.random();
      if (rand > 0.4) {
        datesToAdd.push(dStr);
        const passes = Math.floor(Math.random() * 16);
        passesToAdd[dStr] = passes; 
        approachesToAdd[dStr] = passes > 0 ? Math.floor(Math.random() * 5) + 1 : 0;
        focusToAdd[dStr] = false;
      } else {
        passesToAdd[dStr] = 0;
        approachesToAdd[dStr] = 0;
        focusToAdd[dStr] = Math.random() > 0.7;
      }
    }
    
    setUserState(prev => {
      const uniqueDates = Array.from(new Set([...prev.approachDates, ...datesToAdd]));
      const newFocus = { ...prev.dailyBusinessFocus, ...focusToAdd };
      const streak = calculateCurrentStreak(uniqueDates, newFocus);
      const totalApproaches = Object.values(approachesToAdd).reduce((a, b) => a + b, 0);
      const newStats = { 
        ...prev.stats, 
        totalApproaches: prev.stats.totalApproaches + totalApproaches,
        totalPassedBy: prev.stats.totalPassedBy + Object.values(passesToAdd).reduce((a, b) => a + b, 0)
      };
      const newAchievements = prev.achievements.map(ach => {
        let prog = ach.progress;
        if (ach.id.startsWith('streak-')) prog = Math.max(prog, streak);
        if (ach.id === 'vol-100') prog = newStats.totalApproaches;
        return { ...ach, progress: prog, unlocked: prog >= ach.target };
      });

      return { 
        ...prev, 
        approachDates: uniqueDates, 
        streak, 
        dailyPasses: { ...prev.dailyPasses, ...passesToAdd },
        dailyApproaches: { ...prev.dailyApproaches, ...approachesToAdd },
        dailyBusinessFocus: newFocus,
        stats: newStats,
        achievements: newAchievements
      };
    });
  };

  const devClearHistory = () => {
    setUserState(prev => ({ 
      ...prev, 
      approachDates: [], 
      dailyPasses: {}, 
      dailyApproaches: {}, 
      dailyBusinessFocus: {},
      streak: 0,
      stats: { ...prev.stats, totalApproaches: 0, rejectionResilience: 0, morningInteractions: 0, totalPassedBy: 0 },
      achievements: prev.achievements.map(a => ({ ...a, progress: 0, unlocked: false }))
    }));
  };

  const setHomeLocation = () => {
    if (currentLocation) {
      setUserState(prev => ({ ...prev, homeLocation: currentLocation }));
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          setUserState(prev => ({ ...prev, homeLocation: loc }));
        },
        (err) => alert("Could not fetch geolocation.")
      );
    }
  };

  const updatePassedBy = (delta: number) => {
    // Prevent double clicks/rapid calls
    if (updatePassedByRef.current) return;
    updatePassedByRef.current = true;
    
    const today = new Date().toLocaleDateString('en-CA');
    console.log(`📝 Updating passed by: ${delta > 0 ? '+' : ''}${delta} for ${today}`);
    
    setUserState(prev => {
      if (prev.isOnBreak && delta > 0) {
        updatePassedByRef.current = false;
        return prev;
      }
      const newCurrent = Math.max(0, prev.currentPassedBy + delta);
      const newDailyPasses = { ...prev.dailyPasses };
      if (delta > 0) {
        newDailyPasses[today] = (newDailyPasses[today] || 0) + delta;
      } else if (delta < 0 && newDailyPasses[today] > 0) {
        newDailyPasses[today] = Math.max(0, newDailyPasses[today] + delta);
      }
      const newStats = { ...prev.stats };
      if (delta > 0) newStats.totalPassedBy += delta;
      else if (delta < 0) newStats.totalPassedBy = Math.max(0, newStats.totalPassedBy + delta);
      
      console.log(`📝 New state:`, { currentPassedBy: newCurrent, todayPasses: newDailyPasses[today] });
      
      return { ...prev, currentPassedBy: newCurrent, dailyPasses: newDailyPasses, stats: newStats };
    });
    
    // Reset ref after a short delay to allow state update to complete
    setTimeout(() => {
      updatePassedByRef.current = false;
    }, 150);
  };

  const toggleBreakMode = (active: boolean) => {
    const today = new Date().toLocaleDateString('en-CA');
    setUserState(prev => {
      const newFocus = { ...prev.dailyBusinessFocus };
      newFocus[today] = active;
      const newStreak = calculateCurrentStreak(prev.approachDates, newFocus);
      return { 
        ...prev, 
        isOnBreak: active, 
        dailyBusinessFocus: newFocus,
        streak: newStreak
      };
    });
  };

  const isDayCompleted = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return (userState.dailyApproaches[today] || 0) > 0 || !!userState.dailyBusinessFocus[today];
  }, [userState.dailyApproaches, userState.dailyBusinessFocus]);

  return (
    <Layout activeScreen={screen} onNavigate={setScreen}>
      <div className="relative min-h-full">
        {screen === AppScreen.BASE && (
          <BaseHub
            userState={userState}
            isDayCompleted={isDayCompleted}
            onVerifySuccess={handleVerifySuccess}
            onUpdatePassedBy={updatePassedBy}
            onToggleBreak={toggleBreakMode}
            onUpdateThreshold={updateMinThreshold}
            onLogIgnition={logIgnitionWindow}
          />
        )}
        {screen === AppScreen.ACHIEVEMENTS && (
          <AchievementsDashboard
            userState={userState}
            achievements={userState.achievements}
          />
        )}
        {screen === AppScreen.BREATHE && <BreatheModule />}
        {screen === AppScreen.EVENTS && <EventsScreen onOutingCompleted={markOutingCompleted} />}
        {screen === AppScreen.DATES && <DatesScreen />}

        <div className="fixed bottom-24 right-4 z-50">
          <button onClick={() => setDevMenuOpen(!devMenuOpen)} className="w-10 h-10 bg-gold/20 backdrop-blur-md border border-gold/30 rounded-full flex items-center justify-center text-gold hover:bg-gold/40 shadow-lg transition-transform active:scale-90">
            <Terminal size={18} />
          </button>
          {devMenuOpen && (
            <div className="absolute bottom-12 right-0 w-52 bg-black/90 backdrop-blur-xl border border-gold/30 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] font-black uppercase text-gold/50 px-2 py-1 border-b border-white/10 mb-2">Dev Laboratory</p>
              <div className="px-2 mt-2 space-y-1">
                <button onClick={() => { simulateData(30); setDevMenuOpen(false); }} className="w-full text-left p-2 hover:bg-gold/10 rounded-xl text-[10px] font-bold text-gold flex items-center space-x-2">
                  <Calendar size={12} /><span>Simulate Month (30d)</span>
                </button>
                <button onClick={() => { simulateData(365); setDevMenuOpen(false); }} className="w-full text-left p-2 hover:bg-gold/10 rounded-xl text-[10px] font-bold text-gold flex items-center space-x-2">
                  <History size={12} /><span>Simulate Year (365d)</span>
                </button>
                <button onClick={() => { simulateData(1000); setDevMenuOpen(false); }} className="w-full text-left p-2 hover:bg-gold/10 rounded-xl text-[10px] font-bold text-gold flex items-center space-x-2">
                  <BarChart3 size={12} /><span>Simulate All-Time</span>
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button onClick={() => { devClearHistory(); setDevMenuOpen(false); }} className="w-full text-left p-2 hover:bg-red-900/20 rounded-xl text-[10px] font-bold text-red-400 flex items-center space-x-2">
                  <Trash2 size={12} /><span>Wipe All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const ENV_OPTIONS: { value: EventEnvironment; label: string; icon: React.ReactNode }[] = [
  { value: 'any',     label: 'Any',     icon: <Globe size={14} /> },
  { value: 'outdoor', label: 'Outdoor', icon: <Sun size={14} /> },
  { value: 'indoor',  label: 'Indoor',  icon: <Cloud size={14} /> },
  { value: 'online',  label: 'Online',  icon: <Wifi size={14} /> },
];

const EVENTS_KEY = 'syclar_events';

const loadEvents = (): SocialEvent[] => {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]'); } catch { return []; }
};

const saveEvents = (events: SocialEvent[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

const EventsScreen: React.FC<{ onOutingCompleted: () => void }> = ({ onOutingCompleted }) => {
  const [events, setEvents] = useState<SocialEvent[]>(loadEvents);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<EventEnvironment>('any');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const resetForm = () => {
    setTitle(''); setDescription(''); setEnvironment('any');
    setLocation(''); setDate(''); setTime('');
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !date) return;
    const newEvent: SocialEvent = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      environment,
      location: location.trim(),
      date,
      time,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEvent, ...events];
    setEvents(updated);
    saveEvents(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  };

  const handleComplete = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, completed: true } : e);
    setEvents(updated);
    saveEvents(updated);
    onOutingCompleted();
  };

  const upcoming = events.filter(e => e.date >= new Date().toLocaleDateString('en-CA')).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter(e => e.date < new Date().toLocaleDateString('en-CA')).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Events</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gold text-black text-xs font-bold rounded-xl hover:bg-gold/90 transition active:scale-95"
        >
          <CalendarPlus size={14} />
          <span>New Event</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-dark-accent/60 border border-gold/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black text-gold uppercase tracking-wider">Create Event</h3>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none resize-none"
          />

          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Environment</p>
            <div className="flex space-x-2">
              {ENV_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEnvironment(opt.value)}
                  className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[10px] font-bold uppercase transition border ${environment === opt.value ? 'bg-gold/20 border-gold text-gold' : 'bg-black/30 border-white/10 text-white/40 hover:border-white/20'}`}
                >
                  {opt.icon}
                  <span className="mt-0.5">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
          />

          <div className="flex space-x-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:border-gold focus:outline-none"
            />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:border-gold focus:outline-none"
            />
          </div>

          <div className="flex space-x-2 pt-1">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-white/10 rounded-xl text-white/50 text-sm font-bold hover:border-white/20 transition">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || !date}
              className="flex-1 py-2.5 bg-gold text-black text-sm font-bold rounded-xl hover:bg-gold/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Upcoming</p>
          {upcoming.map(event => <EventCard key={event.id} event={event} onDelete={handleDelete} onComplete={handleComplete} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-4">Past</p>
          {past.map(event => <EventCard key={event.id} event={event} onDelete={handleDelete} onComplete={handleComplete} past />)}
        </div>
      )}

      {events.length === 0 && !showForm && (
        <div className="text-center py-16 space-y-3">
          <CalendarPlus className="w-10 h-10 text-gold/30 mx-auto" />
          <p className="text-white/30 text-sm">No events yet.</p>
          <p className="text-white/20 text-xs">Create one to plan your next social outing.</p>
        </div>
      )}
    </div>
  );
};

const ENV_ICON: Record<EventEnvironment, React.ReactNode> = {
  any:     <Globe size={11} />,
  outdoor: <Sun size={11} />,
  indoor:  <Cloud size={11} />,
  online:  <Wifi size={11} />,
};

const EventCard: React.FC<{ event: SocialEvent; onDelete: (id: string) => void; onComplete: (id: string) => void; past?: boolean }> = ({ event, onDelete, onComplete, past }) => (
  <div className={`bg-dark-accent/40 border rounded-2xl p-4 space-y-2 ${event.completed ? 'border-gold/40' : past ? 'border-white/5 opacity-60' : 'border-gold/20'}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm truncate ${past && !event.completed ? 'text-white/50' : 'text-white'}`}>{event.title}</p>
        {event.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{event.description}</p>}
      </div>
      <button onClick={() => onDelete(event.id)} className="ml-2 p-1 text-white/20 hover:text-red-400 transition flex-shrink-0">
        <Trash2 size={14} />
      </button>
    </div>

    <div className="flex flex-wrap gap-2">
      <span className="flex items-center space-x-1 px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-full text-[10px] font-bold text-gold/80">
        {ENV_ICON[event.environment]}
        <span className="ml-1 capitalize">{event.environment}</span>
      </span>
      <span className="flex items-center space-x-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/50">
        <Calendar size={10} />
        <span className="ml-1">{new Date(event.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        {event.time && <span>· {event.time}</span>}
      </span>
      {event.location && (
        <span className="flex items-center space-x-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/50">
          <MapPin size={10} />
          <span className="ml-1">{event.location}</span>
        </span>
      )}
    </div>

    {event.completed ? (
      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold w-fit">
        <CheckCircle size={12} />
        <span>Purpose Fulfilled</span>
      </div>
    ) : (
      <button
        onClick={() => onComplete(event.id)}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-black/40 border border-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold/70 hover:border-gold hover:text-gold transition w-fit"
      >
        <Check size={12} />
        <span>Mark Done</span>
      </button>
    )}
  </div>
);

const DATES_KEY = 'syclar_dates';

const loadDateConnections = (): DateConnection[] => {
  try { return JSON.parse(localStorage.getItem(DATES_KEY) || '[]'); } catch { return []; }
};

const saveDateConnections = (connections: DateConnection[]) => {
  localStorage.setItem(DATES_KEY, JSON.stringify(connections));
};

const getDefaultMilestones = (): DateMilestones => ({
  gotContact: false,
  firstDate: false,
  physicalTouch: false,
  firstKiss: false,
  regularCommunication: false,
  metCircle: false,
  deepConversation: false,
  exclusive: false,
});

const MILESTONE_CONFIG: { key: keyof DateMilestones; label: string }[] = [
  { key: 'gotContact', label: 'Got Her Number' },
  { key: 'firstDate', label: 'First Date' },
  { key: 'physicalTouch', label: 'Comfortable Touch' },
  { key: 'regularCommunication', label: 'Regular Check-ins' },
  { key: 'firstKiss', label: 'First Kiss' },
  { key: 'deepConversation', label: 'Real Vulnerability' },
  { key: 'metCircle', label: 'Met Her Circle' },
  { key: 'exclusive', label: 'Defined Relationship' },
];

const getStageLabel = (count: number): string => {
  if (count === 0) return 'New Contact';
  if (count <= 2) return 'Getting To Know';
  if (count <= 4) return 'Dating';
  if (count <= 6) return 'Deepening';
  return 'Committed Relationship';
};

const DatesScreen: React.FC = () => {
  const [connections, setConnections] = useState<DateConnection[]>(loadDateConnections);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [metWhere, setMetWhere] = useState('');
  const [metDate, setMetDate] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setMetWhere(''); setMetDate(''); setNotes('');
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const newConnection: DateConnection = {
      id: Date.now().toString(),
      name: name.trim(),
      metWhere: metWhere.trim(),
      metDate: metDate || new Date().toLocaleDateString('en-CA'),
      notes: notes.trim(),
      milestones: getDefaultMilestones(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newConnection, ...connections];
    setConnections(updated);
    saveDateConnections(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = connections.filter(c => c.id !== id);
    setConnections(updated);
    saveDateConnections(updated);
  };

  const toggleMilestone = (id: string, key: keyof DateMilestones) => {
    const updated = connections.map(c => c.id === id ? { ...c, milestones: { ...c.milestones, [key]: !c.milestones[key] } } : c);
    setConnections(updated);
    saveDateConnections(updated);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Dates</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gold text-black text-xs font-bold rounded-xl hover:bg-gold/90 transition active:scale-95"
        >
          <UserPlus size={14} />
          <span>New Connection</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-dark-accent/60 border border-gold/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black text-gold uppercase tracking-wider">Log Connection</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
          />
          <input
            value={metWhere}
            onChange={e => setMetWhere(e.target.value)}
            placeholder="Where you met (optional)"
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
          />
          <input
            type="date"
            value={metDate}
            onChange={e => setMetDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:border-gold focus:outline-none"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none resize-none"
          />
          <div className="flex space-x-2 pt-1">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-white/10 rounded-xl text-white/50 text-sm font-bold hover:border-white/20 transition">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex-1 py-2.5 bg-gold text-black text-sm font-bold rounded-xl hover:bg-gold/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {connections.length === 0 && !showForm && (
        <div className="text-center py-16 space-y-3">
          <Heart className="w-10 h-10 text-gold/30 mx-auto" />
          <p className="text-white/30 text-sm">No connections yet.</p>
          <p className="text-white/20 text-xs">Log someone you're seeing to track where things actually stand.</p>
        </div>
      )}

      <div className="space-y-3">
        {connections.map(conn => {
          const count = MILESTONE_CONFIG.filter(m => conn.milestones[m.key]).length;
          return (
            <div key={conn.id} className="bg-dark-accent/40 border border-gold/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-white truncate">{conn.name}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    {conn.metWhere && `${conn.metWhere} · `}
                    {new Date(conn.metDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {conn.notes && <p className="text-white/40 text-xs mt-1 line-clamp-2">{conn.notes}</p>}
                </div>
                <button onClick={() => handleDelete(conn.id)} className="ml-2 p-1 text-white/20 hover:text-red-400 transition flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1 px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-full text-[10px] font-bold text-gold/80">
                  <Sparkles size={10} />
                  <span>{getStageLabel(count)}</span>
                </span>
                <span className="text-[10px] font-bold text-gold/60">{count}/{MILESTONE_CONFIG.length}</span>
              </div>
              <div className="w-full h-1 bg-black rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gold transition-all duration-500" style={{ width: `${(count / MILESTONE_CONFIG.length) * 100}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {MILESTONE_CONFIG.map(m => {
                  const checked = conn.milestones[m.key];
                  return (
                    <button
                      key={m.key}
                      onClick={() => toggleMilestone(conn.id, m.key)}
                      className={`flex items-center space-x-2 py-2 px-2.5 rounded-xl border text-left transition ${checked ? 'bg-gold/10 border-gold/40' : 'bg-black/30 border-white/5'}`}
                    >
                      {checked ? <CheckSquare size={16} className="text-gold flex-shrink-0" /> : <Square size={16} className="text-white/25 flex-shrink-0" />}
                      <span className={`text-[10px] font-bold ${checked ? 'text-gold' : 'text-white/40'}`}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getBoxStyles = (passes: number, isFocus?: boolean) => {
  if (isFocus) return { backgroundColor: 'rgba(59, 130, 246, 0.4)', border: '1px solid rgba(59, 130, 246, 0.6)', color: '#fff' };
  if (passes === 0) return { backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' };
  const capped = Math.min(12, passes);
  const lightness = 80 - ((capped / 12) * 55); 
  const textColor = lightness > 55 ? '#000' : '#fff';
  return {
    backgroundColor: `hsl(45, 80%, ${lightness}%)`,
    color: textColor,
    border: 'none',
    boxShadow: lightness < 45 ? 'inset 0 0 8px rgba(0,0,0,0.4)' : 'none'
  };
};

const FrequencyMap: React.FC<{ data: { date: string, passes: number, isFocus: boolean, hasApproach: boolean, isToday?: boolean }[], columns?: number }> = ({ data, columns = 7 }) => (
  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
    {data.map((day, idx) => (
      <div 
        key={idx} 
        className={`aspect-square rounded-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden ${day.isToday ? 'ring-2 ring-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] animate-pulse-slow' : ''}`} 
        style={getBoxStyles(day.passes, day.isFocus)}
        title={`${day.date}: ${day.isFocus ? 'Business Focus' : day.passes + ' interactions'}`}
      >
        {day.isFocus ? (
          <Briefcase size={10} className="text-blue-100" />
        ) : (
          <>
            {(day.passes > 0 || day.hasApproach) && (
              <span 
                className="text-[10px] font-black tabular-nums" 
                style={day.passes === 0 && day.hasApproach ? { color: '#fff' } : undefined}
              >
                {day.passes}
              </span>
            )}
            {day.hasApproach && (
              <div className="absolute top-0.5 right-0.5 opacity-60">
                <Check size={8} strokeWidth={4} />
              </div>
            )}
          </>
        )}
      </div>
    ))}
  </div>
);

type IgnitionStage = 'countdown' | 'result' | 'friends';

const BaseHub: React.FC<{
  userState: UserState,
  isDayCompleted: boolean,
  onVerifySuccess: (isRejection?: boolean, withFriends?: boolean) => void,
  onUpdatePassedBy: (delta: number) => void,
  onToggleBreak: (active: boolean) => void,
  onUpdateThreshold: () => void,
  onLogIgnition: (seized: boolean) => void
}> = ({ userState, isDayCompleted, onVerifySuccess, onUpdatePassedBy, onToggleBreak, onUpdateThreshold, onLogIgnition }) => {
  const [showHonorCodeConfirm, setShowHonorCodeConfirm] = useState(false);
  const [honorWithFriends, setHonorWithFriends] = useState(false);
  const [showBreakConfirm, setShowBreakConfirm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);

  // Ignition Mode: a forced 5-second countdown the instant you spot her, so the
  // decision gets made before the hesitation loop has time to talk you out of it.
  const [ignitionOpen, setIgnitionOpen] = useState(false);
  const [ignitionStage, setIgnitionStage] = useState<IgnitionStage>('countdown');
  const [ignitionCount, setIgnitionCount] = useState(5);
  const [ignitionWithFriends, setIgnitionWithFriends] = useState(false);
  const [goldenFlash, setGoldenFlash] = useState(false);

  useEffect(() => {
    if (!ignitionOpen || ignitionStage !== 'countdown') return;
    if (ignitionCount <= 0) { setIgnitionStage('result'); return; }
    const t = setTimeout(() => setIgnitionCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [ignitionOpen, ignitionStage, ignitionCount]);

  const openIgnition = () => {
    setIgnitionCount(5);
    setIgnitionStage('countdown');
    setIgnitionWithFriends(false);
    setIgnitionOpen(true);
  };

  const closeIgnition = () => setIgnitionOpen(false);

  const handleFroze = () => {
    onLogIgnition(false);
    closeIgnition();
  };

  const finalizeIgnitionApproach = (withFriends: boolean) => {
    onLogIgnition(true);
    onVerifySuccess(true, withFriends);
    if (withFriends) {
      setGoldenFlash(true);
      setTimeout(() => setGoldenFlash(false), 2500);
    }
    closeIgnition();
  };

  const gridData = useMemo(() => {
    const days = [];
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      days.push({ 
        date: dateStr, 
        passes: userState.dailyPasses[dateStr] || 0,
        isFocus: !!userState.dailyBusinessFocus[dateStr],
        hasApproach: (userState.dailyApproaches[dateStr] || 0) > 0,
        dayLabel: dayName,
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [userState.dailyPasses, userState.dailyBusinessFocus, userState.dailyApproaches]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Modals */}
      {ignitionOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          {ignitionStage === 'countdown' && (
            <button onClick={handleFroze} className="absolute top-6 right-6 p-2 text-white/30 hover:text-white/60 transition">
              <X size={22} />
            </button>
          )}
          <div className="relative flex flex-col items-center text-center space-y-8 animate-in zoom-in-95">
            {ignitionStage === 'countdown' && (
              <>
                <p className="text-gold text-xs font-black uppercase tracking-[0.3em]">Window Open</p>
                <div className="w-48 h-48 rounded-full border-4 border-gold flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.5)] animate-pulse">
                  <span className="text-8xl font-black italic text-gold tabular-nums">{ignitionCount}</span>
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Move. Don't Think.</h3>
                <p className="text-white/40 text-xs max-w-xs">Walk toward her before the countdown ends. Freezing is a choice you're about to make automatically &mdash; don't let it.</p>
              </>
            )}
            {ignitionStage === 'result' && (
              <>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Did You Move?</h3>
                <p className="text-white/40 text-xs max-w-xs">Be honest. This is how you actually fix the freeze.</p>
                <div className="flex flex-col w-full space-y-3 pt-2">
                  <button onClick={() => setIgnitionStage('friends')} className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg">✅ I Walked Up</button>
                  <button onClick={handleFroze} className="w-full py-4 bg-white/5 text-white/50 font-black uppercase text-xs rounded-2xl border border-white/10">😬 I Froze</button>
                </div>
              </>
            )}
            {ignitionStage === 'friends' && (
              <>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Log The Approach</h3>
                <p className="text-white/40 text-xs max-w-xs">Approaching with friends watching is worth bonus credit &mdash; it's harder.</p>
                <button
                  onClick={() => setIgnitionWithFriends(f => !f)}
                  className="w-full flex items-center space-x-3 py-4 px-4 rounded-2xl border border-white/10 bg-white/5 text-left"
                >
                  {ignitionWithFriends ? <CheckSquare size={22} className="text-gold flex-shrink-0" /> : <Square size={22} className="text-white/30 flex-shrink-0" />}
                  <span className={`text-xs font-black uppercase tracking-widest ${ignitionWithFriends ? 'text-gold' : 'text-white/50'}`}>Friends were with me {ignitionWithFriends && '🏆'}</span>
                </button>
                <button onClick={() => finalizeIgnitionApproach(ignitionWithFriends)} className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg">
                  Confirm Log
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {goldenFlash && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none p-6">
          <div className="bg-gradient-to-br from-gold via-yellow-400 to-gold text-black px-8 py-6 rounded-3xl shadow-2xl text-center space-y-1 animate-in zoom-in-95">
            <p className="text-3xl">🏆</p>
            <p className="font-black uppercase italic tracking-tighter text-lg">Golden Approach</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Bonus credit for doing it in front of friends</p>
          </div>
        </div>
      )}

      {showHonorCodeConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="relative bg-dark-card border border-gold/40 p-8 rounded-[40px] shadow-2xl animate-in zoom-in-95">
             <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 rounded-full bg-gold/10 border border-gold/20 text-gold"><ShieldCheck size={40} /></div>
                <h3 className="text-xl font-black italic uppercase text-white">Honor Protocol</h3>
                <p className="text-xs text-gray-400 font-medium">Log field interaction (Target: {selectedRating}/10)? Be truthful for growth.</p>
                <button
                  onClick={() => setHonorWithFriends(f => !f)}
                  className={`w-full flex items-center space-x-3 py-3 px-4 rounded-2xl border text-left transition ${honorWithFriends ? 'bg-gold/20 border-gold' : 'bg-black/30 border-white/10'}`}
                >
                  {honorWithFriends ? <CheckSquare size={20} className="text-gold flex-shrink-0" /> : <Square size={20} className="text-white/30 flex-shrink-0" />}
                  <span className={`text-[11px] font-black uppercase tracking-widest ${honorWithFriends ? 'text-gold' : 'text-white/40'}`}>Friends were with me {honorWithFriends && '🏆'}</span>
                </button>
                <div className="flex flex-col w-full space-y-3 pt-2">
                   <button onClick={() => { onVerifySuccess(true, honorWithFriends); if (honorWithFriends) { setGoldenFlash(true); setTimeout(() => setGoldenFlash(false), 2500); } setShowHonorCodeConfirm(false); setHonorWithFriends(false); }} className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-2xl">Confirm Log</button>
                   <button onClick={() => { setShowHonorCodeConfirm(false); setHonorWithFriends(false); }} className="w-full py-4 bg-white/5 text-white/40 font-black uppercase text-[10px] rounded-2xl">Abort</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {showBreakConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="relative bg-dark-card border border-blue-500/40 p-8 rounded-[40px] shadow-2xl animate-in zoom-in-95">
             <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400"><Briefcase size={40} /></div>
                <h3 className="text-xl font-black italic uppercase text-white">Focus Shift</h3>
                <p className="text-xs text-gray-400 font-medium">Prioritize your business today? Your daily streak will be maintained as an exemption.</p>
                <div className="flex flex-col w-full space-y-3 pt-2">
                   <button onClick={() => { onToggleBreak(true); setShowBreakConfirm(false); }} className="w-full py-4 bg-blue-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl">Confirm Focus</button>
                   <button onClick={() => setShowBreakConfirm(false)} className="w-full py-4 bg-white/5 text-white/40 font-black uppercase text-[10px] rounded-2xl">Cancel</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Hub Command</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Growth Protocol Active</p>
        </div>
        <button 
          onClick={onUpdateThreshold}
          className="flex flex-col items-end group"
        >
          <span className="text-[8px] font-black uppercase tracking-widest text-gold/40 mb-1">Target Threshold</span>
          <div className={`px-4 py-1.5 rounded-full border border-gold transition-all duration-300 flex items-center space-x-2 ${userState.minThreshold >= 8 ? 'bg-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-black/50 hover:bg-gold/10'}`}>
            <span className={`text-xs font-black italic tracking-tighter ${userState.minThreshold >= 8 ? 'text-black' : 'text-gold'}`}>
              {userState.minThreshold}+
            </span>
            <Filter size={10} className={userState.minThreshold >= 8 ? 'text-black' : 'text-gold'} />
          </div>
        </button>
      </div>

      <HeadlineRoller />

      {/* Ignition Mode: the in-the-moment trigger for when you spot her right now */}
      <button
        onClick={openIgnition}
        className="w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm bg-gradient-to-r from-gold via-yellow-400 to-gold text-black shadow-[0_0_30px_rgba(212,175,55,0.35)] flex items-center justify-center space-x-3 active:scale-[0.98] transition-transform"
      >
        <Zap size={22} className="fill-black" />
        <span>She's Here &mdash; Ignite</span>
      </button>
      {(userState.stats.windowsSeized > 0 || userState.stats.windowsFrozen > 0) && (
        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-gray-500 -mt-3">
          Windows Seized: <span className="text-gold">{userState.stats.windowsSeized}</span> · Frozen: <span className="text-gray-400">{userState.stats.windowsFrozen}</span>
        </p>
      )}

      <div className="bg-dark-card border border-gold/10 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-4 left-4 z-20 w-16 h-16 bg-gold rounded-2xl flex flex-col items-center justify-center shadow-xl border-2 border-white/20">
          <span className="text-2xl font-black text-black italic tracking-tighter leading-none">{userState.streak}</span>
          <span className="text-[6px] font-black text-black/60 uppercase tracking-widest mt-1">STREAK</span>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-8">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase text-gold/60 tracking-widest mb-1">Exposure Signal</p>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Weekly Consistency Log</p>
          </div>
          
          <div className="relative p-6 bg-black/40 rounded-[30px] border border-white/5 w-full">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {gridData.map((day, idx) => (
                <span key={idx} className={`text-[9px] font-black uppercase tracking-widest ${day.isToday ? 'text-gold' : 'text-white/40'}`}>{day.dayLabel}</span>
              ))}
            </div>
            <FrequencyMap data={gridData} columns={7} />
          </div>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest text-center">Heatmap History</p>
        </div>
      </div>

      {/* Field Status Unified */}
      <div className={`p-5 rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center text-center ${
        userState.isOnBreak 
          ? 'bg-blue-900/20 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
          : isDayCompleted 
            ? 'bg-gold/10 border-gold shadow-lg' 
            : 'bg-white/5 border-white/10 opacity-80'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {userState.isOnBreak ? (
            <Briefcase className="text-blue-400" size={16} />
          ) : isDayCompleted ? (
            <CheckCircle className="text-gold" size={16} />
          ) : (
            <AlertCircle className="text-gray-500" size={16} />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            userState.isOnBreak ? 'text-blue-400' : isDayCompleted ? 'text-gold' : 'text-gray-500'
          }`}>
            {userState.isOnBreak ? 'Work Optimization Active' : isDayCompleted ? 'Field Goal Secured' : 'Field Objective Pending'}
          </span>
        </div>
        <h2 className={`text-2xl font-black italic tracking-tighter uppercase ${
          userState.isOnBreak ? 'text-blue-100' : isDayCompleted ? 'text-white' : 'text-gray-600'
        }`}>
          {userState.isOnBreak ? 'Business Depth Focus' : isDayCompleted ? 'Retention Maintained' : 'Initiate First Contact'}
        </h2>
      </div>

      {/* Resistance Tracker Unified */}
      <div className={`bg-dark-card border border-gold/10 rounded-3xl p-6 relative overflow-hidden text-center space-y-4 shadow-xl transition-all duration-500 ${userState.isOnBreak ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        <p className="text-[10px] font-black uppercase text-gold tracking-widest">Resistance Tracker</p>
        <div className="flex items-center justify-center space-x-8">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpdatePassedBy(-1);
            }} 
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:bg-gold active:text-black hover:bg-white/10 transition-colors"
          >
            <Minus size={20} />
          </button>
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-5xl font-black italic tracking-tighter text-gold transition-all tabular-nums">{userState.currentPassedBy}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-gold/40">Passed By</span>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUpdatePassedBy(1);
            }} 
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:bg-gold active:text-black hover:bg-white/10 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Success Terminal Unified */}
      <div className={`bg-gradient-to-br from-dark-accent to-black p-6 rounded-3xl text-center space-y-5 border border-gold/20 shadow-2xl transition-all duration-500 ${userState.isOnBreak ? 'opacity-30 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center">
          <h3 className="text-white font-black text-xl italic uppercase tracking-tighter">Success Terminal</h3>
          <div className="flex items-center space-x-1.5 bg-black/50 px-3 py-1.5 rounded-full border border-gold/10">
            <Star size={10} className="text-gold fill-gold" />
            <span className="text-[10px] font-black text-gold/90">{selectedRating}/10 Intensity</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 pt-2">
          <button className="w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 bg-gold text-black shadow-lg disabled:opacity-50" disabled={userState.isOnBreak} onClick={() => setShowHonorCodeConfirm(true)}>
            <ShieldCheck size={20} /><span>Honor Code Log</span>
          </button>
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        <button 
          onClick={() => userState.isOnBreak ? onToggleBreak(false) : setShowBreakConfirm(true)}
          className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.98] ${
            userState.isOnBreak 
              ? 'bg-blue-500 text-black border-blue-400 shadow-lg' 
              : 'bg-white/5 border-white/10 text-gray-600 hover:text-blue-400/60'
          }`}
        >
          <div className="flex items-center space-x-2">
            {userState.isOnBreak ? <Zap size={14} /> : <Briefcase size={14} />}
            <span>{userState.isOnBreak ? 'End Business Focus' : 'Signal Business Focus'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

type TimeFrame = 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

const AchievementsDashboard: React.FC<{ userState: UserState, achievements: Achievement[] }> = ({ userState, achievements }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTH');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const stats = userState.stats;

  const weekData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      days.push({ 
        date: dateStr, 
        passes: userState.dailyPasses[dateStr] || 0,
        isFocus: !!userState.dailyBusinessFocus[dateStr],
        hasApproach: (userState.dailyApproaches[dateStr] || 0) > 0,
        dayLabel: dayName
      });
    }
    return days;
  }, [userState.dailyPasses, userState.dailyBusinessFocus, userState.dailyApproaches]);

  const monthData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      days.push({ 
        date: dateStr, 
        passes: userState.dailyPasses[dateStr] || 0,
        isFocus: !!userState.dailyBusinessFocus[dateStr],
        hasApproach: (userState.dailyApproaches[dateStr] || 0) > 0,
        dayLabel: dayName
      });
    }
    return days;
  }, [userState.dailyPasses, userState.dailyBusinessFocus, userState.dailyApproaches]);

  const monthRangeLabel = useMemo(() => {
    if (monthData.length === 0) return "";
    const start = new Date(monthData[0].date);
    const end = new Date(monthData[monthData.length - 1].date);
    const startM = start.toLocaleDateString('en-US', { month: 'short' });
    const endM = end.toLocaleDateString('en-US', { month: 'short' });
    const year = end.getFullYear();
    return startM === endM ? `${startM.toUpperCase()} ${year}` : `${startM.toUpperCase()} - ${endM.toUpperCase()} ${year}`;
  }, [monthData]);

  const yearGroups = useMemo(() => {
    const years: Record<number, { name: string, days: { date: string, passes: number, isFocus: boolean, hasApproach: boolean }[] }[]> = {};
    const merged = Array.from(new Set([...Object.keys(userState.dailyPasses), ...Object.keys(userState.dailyBusinessFocus), ...Object.keys(userState.dailyApproaches)]));
    const startYear = merged.length > 0 ? Math.min(...merged.map(d => new Date(d).getFullYear())) : new Date().getFullYear();
    const endYear = new Date().getFullYear();

    for (let y = endYear; y >= startYear; y--) {
      const months = [];
      for (let m = 0; m < 12; m++) {
        const monthDays = [];
        const d = new Date(y, m, 1);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        while (d.getMonth() === m) {
          const dateStr = d.toLocaleDateString('en-CA');
          monthDays.push({ 
            date: dateStr, 
            passes: userState.dailyPasses[dateStr] || 0,
            isFocus: !!userState.dailyBusinessFocus[dateStr],
            hasApproach: (userState.dailyApproaches[dateStr] || 0) > 0
          });
          d.setDate(d.getDate() + 1);
        }
        months.push({ name: monthName, days: monthDays });
      }
      years[y] = months;
    }
    return years;
  }, [userState.dailyPasses, userState.dailyBusinessFocus, userState.dailyApproaches]);

  const yearsAvailable = useMemo(() => Object.keys(yearGroups).map(Number).sort((a, b) => b - a), [yearGroups]);

  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="flex flex-col">
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Field Analytics</h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Consistency & Retention Metrics</p>
      </div>

      <div className="flex bg-dark-card border border-white/5 rounded-2xl p-1 shadow-inner">
        {(['WEEK', 'MONTH', 'YEAR', 'ALL'] as TimeFrame[]).map(tf => (
          <button 
            key={tf} 
            onClick={() => setTimeFrame(tf)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${timeFrame === tf ? 'bg-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="bg-dark-card border border-gold/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase text-gold/60 tracking-widest">Field Presence</p>
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
            {timeFrame === 'WEEK' ? 'Current 7-Day Cycle' : timeFrame === 'MONTH' ? monthRangeLabel : timeFrame === 'YEAR' ? `Full Year ${new Date().getFullYear()}` : `Historical Log: ${selectedYear}`}
          </span>
        </div>

        {timeFrame === 'ALL' && (
          <div className="flex items-center space-x-2 py-1 overflow-x-auto no-scrollbar mask-fade-edges">
            {yearsAvailable.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/30 border border-transparent'}`}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        <div className="animate-in fade-in duration-300">
          {timeFrame === 'WEEK' && (
            <div className="relative">
              <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {weekData.map((day, idx) => (
                  <span key={idx} className="text-[9px] font-black text-white/40 uppercase tracking-widest">{day.dayLabel}</span>
                ))}
              </div>
              <FrequencyMap data={weekData} columns={7} />
            </div>
          )}
          {timeFrame === 'MONTH' && (
            <div className="relative">
              <div className="grid grid-cols-7 gap-2 mb-2 text-center opacity-50">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                  <span key={i} className="text-[8px] font-black text-white/40 uppercase tracking-widest">{l}</span>
                ))}
              </div>
              <FrequencyMap data={monthData} columns={7} />
            </div>
          )}
          {timeFrame === 'YEAR' && (
            <YearHeatmap months={yearGroups[new Date().getFullYear()]} />
          )}
          {timeFrame === 'ALL' && (
            <YearHeatmap months={yearGroups[selectedYear]} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard icon={<Clock className="text-gold" size={18} />} label="Focus Level" value={`${stats.avgDuration}h`} desc="Daily Average" />
        <MetricCard icon={<ShieldCheck className="text-gold" size={18} />} label="Retention" value={userState.streak} desc="Day Streak" />
        <MetricCard icon={<Target className="text-gold" size={18} />} label="Resistance" value={stats.totalPassedBy} desc="Total Pass-By" />
        <MetricCard icon={<MapPin className="text-gold" size={18} />} label="Volume" value={stats.totalApproaches} desc="Total Actions" />
        <MetricCard icon={<Zap className="text-gold" size={18} />} label="Ignition" value={`${stats.windowsSeized}/${stats.windowsSeized + stats.windowsFrozen}`} desc="Windows Seized" />
        <MetricCard icon={<Trophy className="text-gold" size={18} />} label="Purpose" value={stats.plannedOutingsCompleted} desc="Outings Completed" />
      </div>

      <div className="space-y-3">
        <h3 className="text-gold font-black text-xs uppercase px-1 tracking-widest">Retention Milestones</h3>
        {achievements.map(ach => {
          const isGolden = ach.tier === 'gold';
          return (
            <div key={ach.id} className={`relative p-4 rounded-2xl border transition-all overflow-hidden ${
              isGolden
                ? (ach.unlocked ? 'bg-gradient-to-br from-yellow-900/40 via-dark-card to-black border-2 border-gold shadow-[0_0_25px_rgba(212,175,55,0.5)]' : 'bg-black/40 border-2 border-gold/30 opacity-70')
                : (ach.unlocked ? 'bg-dark-card border-gold/40 shadow-lg' : 'bg-black/40 border-white/5 opacity-60')
            }`}>
              {isGolden && <div className="absolute top-0 right-0 px-2 py-0.5 bg-gold text-black text-[8px] font-black uppercase tracking-widest rounded-bl-lg">Golden</div>}
              <div className="flex items-center space-x-4">
                <div className={`text-3xl w-14 h-14 flex items-center justify-center rounded-full bg-black border ${ach.unlocked ? 'border-gold shadow-md' : 'border-gray-800'}`}>{ach.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1"><h4 className="font-black text-white uppercase text-sm italic">{ach.title}</h4><span className="text-[10px] font-bold text-gold/60">{ach.progress}/{ach.target}</span></div>
                  <p className="text-[10px] text-gray-400 font-medium mb-2">{ach.description}</p>
                  <div className="w-full h-1 bg-black rounded-full overflow-hidden border border-white/5"><div className={`h-full transition-all duration-1000 ${ach.unlocked ? 'bg-gold' : 'bg-gray-800'}`} style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}></div></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const YearHeatmap: React.FC<{ months: { name: string, days: any[] }[] }> = ({ months }) => (
  <div className="grid grid-cols-3 gap-x-4 gap-y-6">
    {months.map((m, idx) => (
      <div key={idx} className="space-y-2">
        <span className="text-[9px] font-black text-gold/50 uppercase tracking-[0.2em] block text-center border-b border-white/5 pb-1">{m.name}</span>
        <div className="grid grid-cols-7 gap-0.5">
          {m.days.map((d, dIdx) => (
             <div 
              key={dIdx} 
              className="aspect-square rounded-[2px] relative overflow-hidden" 
              style={{
                backgroundColor: d.isFocus ? 'rgba(59, 130, 246, 0.4)' : d.passes > 0 ? `hsl(45, 80%, ${Math.max(25, 80 - (Math.min(10, d.passes) * 5))}%)` : 'rgba(255,255,255,0.03)'
              }}
            >
              {d.hasApproach && <div className="absolute inset-0 flex items-center justify-center"><Check size={4} className="text-black/40" /></div>}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, desc: string }> = ({ icon, label, value, desc }) => (
  <div className="bg-dark-card p-4 rounded-2xl border border-gold/10 shadow-lg group hover:border-gold/30 transition-all">
    <div className="flex items-center space-x-2 mb-2"><div className="p-1.5 bg-black rounded-lg border border-gold/10">{icon}</div><span className="text-[9px] font-black text-gold/40 uppercase tracking-widest">{label}</span></div>
    <div className="text-2xl font-black text-white italic mb-1">{value}</div>
    <div className="text-[8px] text-gray-600 font-bold uppercase">{desc}</div>
  </div>
);

const BreatheModule: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    let interval: any;
    if (isActive) interval = setInterval(() => setTimer(t => t + 1), 1000);
    else setTimer(0);
    return () => clearInterval(interval);
  }, [isActive]);
  const cycle = timer % 8;
  return (
    <div className="flex flex-col items-center justify-center space-y-10 py-10 text-center animate-in zoom-in-95 duration-500">
      <div className="space-y-2"><h2 className="text-3xl font-black text-white italic uppercase">Recalibrate</h2><p className="text-gray-500 text-xs tracking-wide">Lower Social Inhibition Response.</p></div>
      <div className="relative flex items-center justify-center w-72 h-72">
        <div className={`absolute w-full h-full rounded-full border border-gold/10 transition-all duration-1000 ${isActive ? (cycle < 4 ? 'scale-110 opacity-100 shadow-[0_0_50px_rgba(212,175,55,0.2)]' : 'scale-75 opacity-30') : 'scale-90 opacity-20'}`} />
        <div className={`absolute w-56 h-56 rounded-full bg-black border-2 border-gold transition-all duration-1000 flex items-center justify-center ${isActive ? (cycle < 4 ? 'scale-110 shadow-2xl' : 'scale-90') : 'scale-100'}`}><div className="flex flex-col items-center"><span className="text-gold font-black text-xl uppercase tracking-tighter">{!isActive ? 'READY' : (cycle < 4 ? 'INHALE' : 'EXHALE')}</span>{isActive && <span className="text-white/40 text-[10px] mt-1 font-bold italic">{4 - (timer % 4)}s</span>}</div></div>
      </div>
      <button onClick={() => setIsActive(!isActive)} className={`px-16 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${isActive ? 'bg-black text-gold border border-gold' : 'bg-gold text-black hover:bg-gold-light'}`}>{isActive ? 'Stop' : 'Start Relief'}</button>
    </div>
  );
};

export default App;
