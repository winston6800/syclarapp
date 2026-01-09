-- ============================================
-- Migration: Add Cancellation Tracking Fields
-- ============================================
-- Run this in Supabase SQL Editor
-- Date: 2024
-- Purpose: Add cancel_at_period_end and canceled_at columns to profiles table
-- ============================================

-- Step 1: Add new columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Step 2: Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('cancel_at_period_end', 'canceled_at')
ORDER BY column_name;

-- Step 3: (Optional) Set defaults for existing active subscriptions
-- This ensures existing subscriptions have the correct default values
UPDATE public.profiles
SET 
  cancel_at_period_end = COALESCE(cancel_at_period_end, FALSE),
  canceled_at = NULL
WHERE subscription_status = 'active'
AND (cancel_at_period_end IS NULL);

-- Success message
SELECT 'Migration completed successfully!' AS status;
