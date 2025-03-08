import { supabase } from "./supabase";

export async function createProfilesTable() {
  try {
    // First check if the profiles table exists by trying to select from it
    const { data, error: checkError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (!checkError) {
      console.log("Profiles table already exists");
      return true;
    }

    // If we get here, the table might not exist
    // We'll try to create it directly
    console.log("Profiles table doesn't exist yet, attempting to create it");

    // Try to create a dummy user to check if the table exists
    try {
      // First try to create a dummy user with a UUID that won't conflict
      const dummyId = "00000000-0000-0000-0000-000000000000";

      // Check if the dummy user already exists
      const { data: existingData, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", dummyId)
        .maybeSingle();

      // If the dummy user doesn't exist, try to create it
      if (!existingData && existingError) {
        const { error: createError } = await supabase.from("profiles").insert({
          id: dummyId,
          onboarding_completed: false,
          travel_interests: {},
          travel_styles: {},
        });

        // If we get an error other than duplicate key, log it
        if (createError && createError.code !== "23505") {
          console.error("Error creating dummy profile:", createError);
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking/creating profiles table:", error);
      return false;
    }
  } catch (error) {
    console.error("Error in createProfilesTable:", error);
    return false;
  }
}
