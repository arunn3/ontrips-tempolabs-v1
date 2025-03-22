-- Add is_editable column to itineraries table
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT false;

-- Enable realtime for itineraries table
ALTER PUBLICATION supabase_realtime ADD TABLE itineraries;
