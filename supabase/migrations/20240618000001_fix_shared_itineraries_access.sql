-- Disable RLS on itineraries table to allow public access
ALTER TABLE itineraries DISABLE ROW LEVEL SECURITY;

-- Add is_editable column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'itineraries' AND column_name = 'is_editable') THEN
    ALTER TABLE itineraries ADD COLUMN is_editable BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Enable realtime for itineraries table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE itineraries;
