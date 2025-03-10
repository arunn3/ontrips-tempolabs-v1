-- Add share_id column to itineraries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'share_id') THEN
        ALTER TABLE public.itineraries ADD COLUMN share_id UUID DEFAULT NULL;
        
        -- Create index on share_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_itineraries_share_id ON public.itineraries (share_id);
    END IF;
END $$;