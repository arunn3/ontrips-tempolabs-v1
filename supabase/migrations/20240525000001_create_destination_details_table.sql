-- Create destination_details table to store cached destination details
CREATE TABLE IF NOT EXISTS destination_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details JSONB NOT NULL,
  preferences JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE destination_details ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own destination details" ON destination_details;
CREATE POLICY "Users can view their own destination details"
  ON destination_details FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own destination details" ON destination_details;
CREATE POLICY "Users can insert their own destination details"
  ON destination_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own destination details" ON destination_details;
CREATE POLICY "Users can update their own destination details"
  ON destination_details FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own destination details" ON destination_details;
CREATE POLICY "Users can delete their own destination details"
  ON destination_details FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS destination_details_title_idx ON destination_details(title);

-- Enable realtime
alter publication supabase_realtime add table destination_details;