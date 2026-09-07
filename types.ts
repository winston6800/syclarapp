
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
  category: 'CONSISTENCY' | 'RESILIENCE' | 'STAMINA' | 'DIVERSITY' | 'PURPOSE';
  tier?: 'gold';
}

export interface UserStats {
  avgDuration: number;
  rejectionResilience: number;
  uniqueLocations: number;
  morningInteractions: number;
  totalApproaches: number;
  totalPassedBy: number;
  windowsSeized: number;
  windowsFrozen: number;
  plannedOutingsCompleted: number;
  approachesWithFriends: number;
  groupOutingsCompleted: number;
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
  dailyGoldenApproaches: Record<string, boolean>;
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
  BREATHE = 'BREATHE',
  EVENTS = 'EVENTS',
  DATES = 'DATES'
}

export type EventEnvironment = 'indoor' | 'outdoor' | 'online' | 'any';

export interface SocialEvent {
  id: string;
  title: string;
  description: string;
  environment: EventEnvironment;
  location: string;
  date: string;
  time: string;
  createdAt: string;
  completed?: boolean;
  bringsPeople?: boolean;
}

export interface DateMilestones {
  gotContact: boolean;
  firstDate: boolean;
  physicalTouch: boolean;
  firstKiss: boolean;
  regularCommunication: boolean;
  metCircle: boolean;
  deepConversation: boolean;
  exclusive: boolean;
}

export interface DateConnection {
  id: string;
  name: string;
  metWhere: string;
  metDate: string;
  notes: string;
  milestones: DateMilestones;
  createdAt: string;
}
