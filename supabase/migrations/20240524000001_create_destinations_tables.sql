-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  match_percentage INTEGER,
  rating DECIMAL,
  price_range TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create destination_details table
CREATE TABLE IF NOT EXISTS destination_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details JSONB NOT NULL,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row-level security
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_details ENABLE ROW LEVEL SECURITY;

-- Create policies for destinations
DROP POLICY IF EXISTS "Public read access for destinations" ON destinations;
CREATE POLICY "Public read access for destinations" 
  ON destinations FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own destinations" ON destinations;
CREATE POLICY "Users can insert their own destinations" 
  ON destinations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policies for destination_details
DROP POLICY IF EXISTS "Public read access for destination_details" ON destination_details;
CREATE POLICY "Public read access for destination_details" 
  ON destination_details FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own destination_details" ON destination_details;
CREATE POLICY "Users can insert their own destination_details" 
  ON destination_details FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE destination_details;
