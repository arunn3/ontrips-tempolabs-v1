-- Create destinations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  match_percentage INTEGER NOT NULL,
  rating NUMERIC(3,1) NOT NULL,
  price_range TEXT NOT NULL,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own destinations" ON public.destinations;
CREATE POLICY "Users can view their own destinations"
  ON public.destinations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own destinations" ON public.destinations;
CREATE POLICY "Users can insert their own destinations"
  ON public.destinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own destinations" ON public.destinations;
CREATE POLICY "Users can update their own destinations"
  ON public.destinations FOR UPDATE
  USING (auth.uid() = user_id);

-- Add realtime
ALTER publication supabase_realtime ADD TABLE public.destinations;