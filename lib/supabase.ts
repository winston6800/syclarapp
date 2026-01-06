import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log the keys being used
console.log('🔑 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key (first 20 chars):', supabaseAnonKey?.substring(0, 20));
console.log('🔑 Key starts with sb_publishable?', supabaseAnonKey?.startsWith('sb_publishable_'));

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


