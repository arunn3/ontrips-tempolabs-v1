import { supabase } from "./supabase";

export async function setupUserPreferences(userId: string) {
  try {
    // First check if the user already has preferences in their profile
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("travel_interests, travel_styles, onboarding_completed")
      .eq("id", userId)
      .single();

    // If there's no error, the user has a profile
    if (!profileError) {
      // If onboarding_completed is explicitly false, we need to redirect to onboarding
      if (existingProfile && existingProfile.onboarding_completed === false) {
        return { needsOnboarding: true, error: null };
      }

      // If the user has a profile but onboarding status is not set, set it to false
      if (existingProfile && existingProfile.onboarding_completed === null) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ onboarding_completed: false })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating onboarding status:", updateError);
          return { needsOnboarding: false, error: updateError };
        }

        return { needsOnboarding: true, error: null };
      }

      // User has completed onboarding
      return { needsOnboarding: false, error: null };
    }

    // If the error is not a "not found" error, there's a problem
    if (profileError.code !== "PGRST116") {
      console.error("Error checking user profile:", profileError);
      return { needsOnboarding: false, error: profileError };
    }

    // User doesn't have a profile yet, create one with onboarding_completed = false
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      onboarding_completed: false,
    });

    if (insertError) {
      console.error("Error creating user profile:", insertError);
      return { needsOnboarding: false, error: insertError };
    }

    return { needsOnboarding: true, error: null };
  } catch (error) {
    console.error("Error in setupUserPreferences:", error);
    return { needsOnboarding: false, error };
  }
}
