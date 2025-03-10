-- Create locations table for storing geocoded locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations (name);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON public.locations;
CREATE POLICY "Public read access"
  ON public.locations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert" ON public.locations;
CREATE POLICY "Authenticated users can insert"
  ON public.locations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;