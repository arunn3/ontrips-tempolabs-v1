-- Create a function to get user data by ID
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_user_by_id'
    ) THEN
        EXECUTE $FUNC$
        CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $BODY$
        DECLARE
            user_data JSONB;
        BEGIN
            SELECT json_build_object(
                'id', id,
                'email', email,
                'user_metadata', raw_user_meta_data
            )::JSONB INTO user_data
            FROM auth.users
            WHERE id = user_id;
            
            RETURN user_data;
        END;
        $BODY$;
        $FUNC$;
    END IF;
END $$;