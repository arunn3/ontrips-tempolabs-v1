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
    const { userId, interests, styles, onboardingCompleted } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    let result;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseClient
        .from("profiles")
        .update({
          travel_interests: interests,
          travel_styles: styles,
          onboarding_completed: onboardingCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select();

      if (error) throw error;
      result = { action: "updated", profile: data };
    } else {
      // Create new profile
      const { data, error } = await supabaseClient
        .from("profiles")
        .insert({
          id: userId,
          travel_interests: interests,
          travel_styles: styles,
          onboarding_completed: onboardingCompleted,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      result = { action: "created", profile: data };
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
    });
  }
});
