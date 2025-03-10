-- Create a function to get an itinerary by share_id
CREATE OR REPLACE FUNCTION get_itinerary_by_share_id(p_share_id UUID)
RETURNS SETOF itineraries
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM itineraries
  WHERE share_id = p_share_id;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_itinerary_by_share_id(UUID) TO anon, authenticated;
