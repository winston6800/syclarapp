import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'none';

export interface UserProfile {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
}


