-- Enable RLS on itineraries table
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

-- Create policy to allow users to view their own itineraries
DROP POLICY IF EXISTS "Users can view own itineraries" ON public.itineraries;
CREATE POLICY "Users can view own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own itineraries
DROP POLICY IF EXISTS "Users can update own itineraries" ON public.itineraries;
CREATE POLICY "Users can update own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own itineraries
DROP POLICY IF EXISTS "Users can delete own itineraries" ON public.itineraries;
CREATE POLICY "Users can delete own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert itineraries
DROP POLICY IF EXISTS "Users can insert itineraries" ON public.itineraries;
CREATE POLICY "Users can insert itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);
