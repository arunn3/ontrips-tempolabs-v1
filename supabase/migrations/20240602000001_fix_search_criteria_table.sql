-- Fix search_criteria table structure
ALTER TABLE IF EXISTS public.search_criteria
ADD COLUMN IF NOT EXISTS destinations JSONB;
