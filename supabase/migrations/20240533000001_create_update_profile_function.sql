-- Create a function to update user profiles
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  interests JSONB,
  styles JSONB,
  completed BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
  
  IF profile_exists THEN
    -- Update existing profile
    UPDATE profiles
    SET 
      travel_interests = interests,
      travel_styles = styles,
      onboarding_completed = completed,
      updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Insert new profile
    INSERT INTO profiles (id, travel_interests, travel_styles, onboarding_completed, created_at, updated_at)
    VALUES (user_id, interests, styles, completed, NOW(), NOW());
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_profile(UUID, JSONB, JSONB, BOOLEAN) TO authenticated;
