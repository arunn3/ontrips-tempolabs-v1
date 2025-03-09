-- Fix search_criteria table by ensuring timestamps are handled by the database
ALTER TABLE IF EXISTS public.search_criteria
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_search_criteria_updated_at ON public.search_criteria;
CREATE TRIGGER update_search_criteria_updated_at
BEFORE UPDATE ON public.search_criteria
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
