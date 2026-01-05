
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  category: 'CONSISTENCY' | 'RESILIENCE' | 'STAMINA' | 'DIVERSITY';
}

export interface UserStats {
  avgDuration: number;
  rejectionResilience: number;
  uniqueLocations: number;
  morningInteractions: number;
  totalApproaches: number;
  totalPassedBy: number;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface UserState {
  confidenceLevel: number;
  streak: number;
  history: { date: string; confidence: number }[];
  approachDates: string[];
  dailyPasses: Record<string, number>;
  dailyApproaches: Record<string, number>;
  dailyBusinessFocus: Record<string, boolean>;
  stats: UserStats;
  achievements: Achievement[];
  homeLocation: Location | null;
  currentPassedBy: number;
  isOnBreak: boolean;
  minThreshold: number;
}

export enum AppScreen {
  BASE = 'BASE',
  DASHBOARD = 'DASHBOARD',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  BREATHE = 'BREATHE'
}
