-- Disable RLS temporarily to ensure we can access all itineraries
ALTER TABLE public.itineraries DISABLE ROW LEVEL SECURITY;

-- Update any existing records with share_id to have shared status
UPDATE public.itineraries
SET share_status = 'shared'
WHERE share_id IS NOT NULL;

-- Re-enable RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view shared itineraries
DROP POLICY IF EXISTS "Anyone can view shared itineraries" ON public.itineraries;
CREATE POLICY "Anyone can view shared itineraries"
  ON public.itineraries FOR SELECT
  USING (share_id IS NOT NULL);

-- Create policy to allow anyone to view public itineraries
DROP POLICY IF EXISTS "Anyone can view public itineraries" ON public.itineraries;
CREATE POLICY "Anyone can view public itineraries"
  ON public.itineraries FOR SELECT
  USING (is_public = true);
