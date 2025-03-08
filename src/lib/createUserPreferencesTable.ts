import { supabase } from "./supabase";

export async function createUserPreferencesTable() {
  try {
    // Check if the table already exists
    const { data: existingTables, error: checkError } =
      await supabase.rpc("get_tables");

    if (checkError) {
      console.error("Error checking for existing tables:", checkError);
      return false;
    }

    // If the table already exists, don't recreate it
    if (existingTables && existingTables.includes("user_preferences")) {
      console.log("user_preferences table already exists");
      return true;
    }

    // Create the user_preferences table
    const { error } = await supabase.rpc("create_user_preferences_table");

    if (error) {
      console.error("Error creating user_preferences table:", error);
      return false;
    }

    console.log("Successfully created user_preferences table");
    return true;
  } catch (error) {
    console.error("Error in createUserPreferencesTable:", error);
    return false;
  }
}
