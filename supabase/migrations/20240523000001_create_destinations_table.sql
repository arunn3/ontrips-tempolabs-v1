-- Create destinations table to store destination and preference combinations
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  match_percentage NUMERIC,
  rating NUMERIC,
  price_range TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own destinations" ON destinations;
CREATE POLICY "Users can view their own destinations"
  ON destinations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own destinations" ON destinations;
CREATE POLICY "Users can insert their own destinations"
  ON destinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own destinations" ON destinations;
CREATE POLICY "Users can update their own destinations"
  ON destinations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own destinations" ON destinations;
CREATE POLICY "Users can delete their own destinations"
  ON destinations FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table destinations;
