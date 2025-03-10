import { supabase } from "./supabase";

// Function to get coordinates for a location from the database
export async function getCoordinatesForLocation(
  locationText: string,
): Promise<{ lat: number; lng: number }> {
  try {
    // Clean the location text for better matching
    const cleanedLocation = locationText.toLowerCase().trim();

    // Query the locations table for matching locations
    const { data, error } = await supabase
      .from("locations")
      .select("lat, lng")
      .ilike("name", `%${cleanedLocation}%`)
      .limit(1);

    if (error) {
      console.error("Error querying locations:", error);
      throw error;
    }

    // If we found a match, return the coordinates
    if (data && data.length > 0) {
      return {
        lat: data[0].lat,
        lng: data[0].lng,
      };
    }

    // If no match in the database, try to extract city name and search again
    const cityMatch = locationText.match(/([^,]+)(?:,\s*([^,]+))?$/); // Match last part after comma
    if (cityMatch && cityMatch[1]) {
      const cityName = cityMatch[1].trim().toLowerCase();

      const { data: cityData, error: cityError } = await supabase
        .from("locations")
        .select("lat, lng")
        .ilike("name", `%${cityName}%`)
        .limit(1);

      if (!cityError && cityData && cityData.length > 0) {
        return {
          lat: cityData[0].lat,
          lng: cityData[0].lng,
        };
      }
    }

    // Fallback to Google Maps API
    return getCoordinatesFromGoogleMaps(locationText);
  } catch (error) {
    console.error("Error getting coordinates for location:", error);
    // Return default coordinates if there's an error
    return {
      lat: 35.6762 + (Math.random() - 0.5) * 0.02,
      lng: 139.6503 + (Math.random() - 0.5) * 0.02,
    };
  }
}

// Function to save a new location to the database
export async function saveLocation(
  name: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  try {
    // Skip if name is empty or coordinates are invalid
    if (!name || isNaN(lat) || isNaN(lng)) {
      console.log("Skipping invalid location data:", { name, lat, lng });
      return false;
    }

    const cleanName = name.toLowerCase().trim();

    // First check if this location already exists to avoid duplicates
    const { data: existingData, error: checkError } = await supabase
      .from("locations")
      .select("id")
      .eq("name", cleanName)
      .limit(1);

    if (checkError) {
      console.error("Error checking for existing location:", checkError);
      return false;
    }

    // If location already exists, don't insert it again
    if (existingData && existingData.length > 0) {
      console.log(`Location '${cleanName}' already exists in database`);
      return true;
    }

    // Insert the new location
    const { error } = await supabase.from("locations").insert({
      name: cleanName,
      lat,
      lng,
    });

    if (error) {
      // If error is about unique constraint, that's fine - means it already exists
      if (error.code === "23505") {
        console.log(
          `Location '${cleanName}' already exists (constraint error)`,
        );
        return true;
      }
      console.error("Error saving location:", error);
      return false;
    }

    console.log(`Successfully saved location '${cleanName}' to database`);
    return true;
  } catch (error) {
    console.error("Error saving location:", error);
    return false;
  }
}

// Function to get coordinates from Google Maps API
async function getCoordinatesFromGoogleMaps(
  location: string,
): Promise<{ lat: number; lng: number }> {
  try {
    const apiKey = import.meta.env.VITE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is missing");
      return { lat: 0, lng: 0 };
    }

    const encodedLocation = encodeURIComponent(location);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`,
    );

    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;

      // Save the location to the database for future use
      saveLocation(location, lat, lng);

      return { lat, lng };
    } else {
      console.error("Geocoding API error:", data.status);
      // Return default coordinates if geocoding fails
      return { lat: 0, lng: 0 };
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return { lat: 0, lng: 0 };
  }
}
