-- Add onboarding fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;