-- Fix search_criteria table to allow explicit created_at values
ALTER TABLE search_criteria ALTER COLUMN created_at DROP DEFAULT;

-- Create a function to execute SQL directly
CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  result := '{"message": "SQL executed successfully"}'::jsonb;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object('error', SQLERRM);
  RETURN result;
END;
$$;