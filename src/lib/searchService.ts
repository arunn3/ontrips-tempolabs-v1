import { supabase } from "./supabase";
import { searchDestinations as searchDestinationsWithGemini } from "./gemini";

export interface Destination {
  title: string;
  description: string;
  image: string;
  matchPercentage: number;
  rating: number;
  priceRange: string;
}

/**
 * Search for destinations based on user preferences
 * First checks if the search criteria exists in the database
 * If not, uses Gemini API to generate destinations
 */
export async function searchDestinations(
  selections: Record<string, string[]>,
): Promise<Destination[]> {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      // If no user, use Gemini API directly
      return searchDestinationsWithGemini(selections);
    }

    // Convert selections to a string for comparison
    const preferencesString = JSON.stringify(selections);

    // First check if we have this exact search criteria in the search_criteria table
    const { data: searchCriteria, error: searchError } = await supabase
      .from("search_criteria")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("preferences", preferencesString)
      .single();

    if (!searchError && searchCriteria?.destinations) {
      console.log(
        "Found matching search criteria in database:",
        searchCriteria,
      );
      return searchCriteria.destinations;
    }

    // If no matching search criteria, use Gemini API
    console.log(
      "No matching search criteria found in database, using Gemini API",
    );
    const destinations = await searchDestinationsWithGemini(selections);

    // Save the search criteria and destinations to the database for future use
    if (destinations.length > 0) {
      try {
        const { error: insertError } = await supabase
          .from("search_criteria")
          .insert({
            user_id: userData.user.id,
            preferences: selections,
            destinations: destinations,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            "Error saving search criteria to database:",
            insertError,
          );

          // If insert fails, try to create the table and retry
          console.error("Table might not exist, trying to create it...");

          // Import and run the table creation function
          const { createSearchCriteriaTable } = await import(
            "./createSearchCriteriaTable"
          );
          const tableCreated = await createSearchCriteriaTable();

          if (tableCreated) {
            // Try inserting again after creating the table
            const { error: retryError } = await supabase
              .from("search_criteria")
              .insert({
                user_id: userData.user.id,
                preferences: selections,
                destinations: destinations,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (retryError) {
              console.error(
                "Error on retry saving search criteria:",
                retryError,
              );
            } else {
              console.log(
                "Successfully saved search criteria after creating table",
              );
            }
          } else {
            console.error("Failed to create search_criteria table");
          }
        } else {
          console.log("Saved search criteria and destinations to database");
        }
      } catch (saveError) {
        console.error("Exception saving search criteria:", saveError);
      }
    }

    return destinations;
  } catch (error) {
    console.error("Error in searchDestinations:", error);
    // Fallback to Gemini API
    return searchDestinationsWithGemini(selections);
  }
}
