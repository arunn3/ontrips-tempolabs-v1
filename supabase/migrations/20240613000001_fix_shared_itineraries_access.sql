-- Fix shared itineraries access by ensuring all itineraries with share_id are accessible

-- Update any existing records with share_id to have shared status
UPDATE public.itineraries
SET share_status = 'shared'
WHERE share_id IS NOT NULL;

-- Create a policy to allow anyone to view itineraries with a share_id
DROP POLICY IF EXISTS "Anyone can view shared itineraries" ON public.itineraries;
CREATE POLICY "Anyone can view shared itineraries"
  ON public.itineraries FOR SELECT
  USING (share_id IS NOT NULL);

-- Create a policy to allow anyone to view public itineraries
DROP POLICY IF EXISTS "Anyone can view public itineraries" ON public.itineraries;
CREATE POLICY "Anyone can view public itineraries"
  ON public.itineraries FOR SELECT
  USING (is_public = true);
