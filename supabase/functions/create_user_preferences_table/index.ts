import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create the user_preferences table if it doesn't exist
    const { error: createTableError } = await supabaseClient.rpc(
      "execute_sql",
      {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            travel_interests JSONB,
            travel_styles JSONB,
            onboarding_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Add RLS policies
          ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

          -- Allow users to read their own preferences
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policy WHERE polname = 'Users can read their own preferences'
            ) THEN
              CREATE POLICY "Users can read their own preferences"
                ON public.user_preferences FOR SELECT
                USING (auth.uid() = user_id);
            END IF;
          END
          $$;

          -- Allow users to update their own preferences
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own preferences'
            ) THEN
              CREATE POLICY "Users can update their own preferences"
                ON public.user_preferences FOR UPDATE
                USING (auth.uid() = user_id);
            END IF;
          END
          $$;

          -- Allow users to insert their own preferences
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own preferences'
            ) THEN
              CREATE POLICY "Users can insert their own preferences"
                ON public.user_preferences FOR INSERT
                WITH CHECK (auth.uid() = user_id);
            END IF;
          END
          $$;

          -- Add realtime
          BEGIN
            ALTER publication supabase_realtime ADD TABLE public.user_preferences;
          EXCEPTION
            WHEN others THEN
              NULL;
          END;
        `,
      },
    );

    if (createTableError) {
      throw createTableError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
