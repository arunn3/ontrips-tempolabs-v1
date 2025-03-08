-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS travel_interests JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS travel_styles JSONB DEFAULT '{}'::jsonb;
