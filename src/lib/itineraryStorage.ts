import { supabase } from "./supabase";
import type { GeneratedItinerary } from "./gemini";

// Function to save an itinerary to Supabase
export async function saveItinerary(
  userId: string,
  destination: string,
  preferences: Record<string, string[]>,
  itinerary: GeneratedItinerary,
  isPublic: boolean = false,
): Promise<{ id: string } | null> {
  try {
    // First save the search criteria
    const { data: criteriaData, error: criteriaError } = await supabase
      .from("search_criteria")
      .insert({
        user_id: userId,
        destination,
        preferences: preferences,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (criteriaError) throw criteriaError;

    // Then save the itinerary linked to the search criteria
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .insert({
        user_id: userId,
        criteria_id: criteriaData.id,
        destination,
        itinerary_data: itinerary,
        summary: itinerary.summary,
        total_activities: itinerary.totalActivities,
        estimated_cost: itinerary.estimatedCost,
        is_public: isPublic,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (itineraryError) throw itineraryError;

    return { id: itineraryData.id };
  } catch (error) {
    console.error("Error saving itinerary:", error);
    return null;
  }
}

// Function to get all itineraries for a user
export async function getUserItineraries(userId: string) {
  try {
    const { data, error } = await supabase
      .from("itineraries")
      .select(
        `
        id,
        destination,
        summary,
        total_activities,
        estimated_cost,
        created_at,
        criteria_id,
        search_criteria!inner(preferences)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user itineraries:", error);
    return [];
  }
}

// Function to get a specific itinerary by ID
export async function getItineraryById(itineraryId: string) {
  try {
    const { data, error } = await supabase
      .from("itineraries")
      .select(
        `
        id,
        destination,
        itinerary_data,
        summary,
        total_activities,
        estimated_cost,
        created_at,
        criteria_id,
        search_criteria!inner(preferences)
      `,
      )
      .eq("id", itineraryId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    return null;
  }
}

// Function to delete an itinerary
export async function deleteItinerary(itineraryId: string) {
  try {
    const { error } = await supabase
      .from("itineraries")
      .delete()
      .eq("id", itineraryId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    return false;
  }
}
