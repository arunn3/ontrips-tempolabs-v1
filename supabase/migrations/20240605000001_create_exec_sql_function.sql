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