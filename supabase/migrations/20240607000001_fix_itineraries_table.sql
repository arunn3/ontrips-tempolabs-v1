-- Make criteria_id nullable in itineraries table
ALTER TABLE IF EXISTS public.itineraries ALTER COLUMN criteria_id DROP NOT NULL;