-- This migration will be handled by the Supabase UI
-- Please create the profiles table manually in the Supabase dashboard
-- with the following structure:
-- id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
-- onboarding_completed BOOLEAN DEFAULT FALSE
-- travel_interests JSONB
-- travel_styles JSONB
-- created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
