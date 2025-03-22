-- Add policy to allow anyone to view shared itineraries
DROP POLICY IF EXISTS "Anyone can view shared itineraries" ON itineraries;
CREATE POLICY "Anyone can view shared itineraries"
  ON itineraries FOR SELECT
  USING (share_status = 'shared');
