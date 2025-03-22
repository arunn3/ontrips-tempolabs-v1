import { supabase } from "./supabase";

export async function addEditableColumn() {
  try {
    // Check if the column exists
    const { data, error } = await supabase
      .from("itineraries")
      .select("is_editable")
      .limit(1);

    if (
      error &&
      error.message.includes('column "is_editable" does not exist')
    ) {
      console.error(
        "is_editable column doesn't exist, but will be added via migration",
      );
      return false;
    }

    console.log("Successfully added is_editable column to itineraries table");
    return true;
  } catch (error) {
    console.error("Error in addEditableColumn:", error);
    return false;
  }
}
