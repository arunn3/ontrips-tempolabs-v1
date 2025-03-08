import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create the profiles table if it doesn't exist
    const { error } = await supabaseClient.rpc("pgaudit.exec_sql", {
      p_sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          onboarding_completed BOOLEAN DEFAULT FALSE,
          travel_interests JSONB,
          travel_styles JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own profile'
          ) THEN
            CREATE POLICY "Users can view their own profile"
              ON public.profiles FOR SELECT
              USING (auth.uid() = id);
          END IF;
        END
        $$;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own profile'
          ) THEN
            CREATE POLICY "Users can update their own profile"
              ON public.profiles FOR UPDATE
              USING (auth.uid() = id);
          END IF;
        END
        $$;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own profile'
          ) THEN
            CREATE POLICY "Users can insert their own profile"
              ON public.profiles FOR INSERT
              WITH CHECK (auth.uid() = id);
          END IF;
        END
        $$;

        -- Add realtime
        BEGIN
          ALTER publication supabase_realtime ADD TABLE public.profiles;
        EXCEPTION
          WHEN others THEN
            NULL;
        END;
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
});
