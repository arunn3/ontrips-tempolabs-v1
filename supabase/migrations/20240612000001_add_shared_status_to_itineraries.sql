-- Add shared status to itineraries table
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS share_status VARCHAR(20) DEFAULT 'private';

-- Update existing records
UPDATE public.itineraries
SET share_status = CASE
  WHEN is_public = true THEN 'public'
  WHEN share_id IS NOT NULL THEN 'shared'
  ELSE 'private'
END;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_itineraries_share_status ON public.itineraries (share_status);

-- Update any existing records with share_id to have shared status
UPDATE public.itineraries
SET share_status = 'shared'
WHERE share_id IS NOT NULL;

-- Run the migration
SELECT exec_sql('ALTER TABLE public.itineraries ALTER COLUMN share_status SET NOT NULL');