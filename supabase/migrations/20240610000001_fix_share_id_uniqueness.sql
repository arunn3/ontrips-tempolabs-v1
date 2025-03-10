-- Add unique constraint to share_id column if it doesn't exist
BEGIN;
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'itineraries_share_id_key'
  ) THEN
    -- Add the unique constraint
    ALTER TABLE public.itineraries 
    ADD CONSTRAINT itineraries_share_id_key UNIQUE (share_id);
  END IF;
COMMIT;