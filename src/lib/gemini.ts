import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the model
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY || "",
  {
    apiVersion: "v1",
  },
);

interface Destination {
  title: string;
  description: string;
  image: string;
  matchPercentage: number;
  rating: number;
  priceRange: string;
}

interface City {
  name: string;
  description: string;
  image: string;
  activities: Array<{
    name: string;
    description: string;
    duration: string;
    image: string;
    bestTime: string;
    price: string;
  }>;
  events: Array<{
    name: string;
    description: string;
    date: string;
    image: string;
  }>;
}

interface DestinationDetails {
  cities: City[];
  weather: {
    temperature: string;
    conditions: string;
    rainfall: string;
  };
  transportation: {
    options: string[];
    costs: string;
  };
  accommodation: {
    types: string[];
    priceRanges: string;
    recommendations: string[];
  };
}

export async function searchDestinations(
  preferences: Record<string, string[]>,
): Promise<Destination[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Based on these travel preferences:
      ${Object.entries(preferences)
        .map(([category, values]) => `${category}: ${values.join(", ")}`)
        .join("\n")}

      Generate exactly 5 countries that match these preferences. Return only a JSON array with this exact structure for each destination:
      {
        "title": "Country",
        "description": "Brief description",
        "image": "[One of: https://images.unsplash.com/photo-1499856871958-5b9627545d1a, https://images.unsplash.com/photo-1555992828-ca4dbe41d294, https://images.unsplash.com/photo-1523906834658-6e24ef2386f9]",
        "matchPercentage": 85,
        "rating": 4.5,
        "priceRange": "$200-300/day"
      }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up the response text
      let cleanText = text.replace(/\n/g, "").replace(/\s+/g, " ").trim();

      // Extract just the JSON array
      const start = cleanText.indexOf("[");
      const end = cleanText.lastIndexOf("]") + 1;
      if (start === -1 || end === -1) {
        throw new Error("Could not find JSON array in response");
      }
      cleanText = cleanText.substring(start, end);

      // Parse the JSON
      const destinations = JSON.parse(cleanText);
      return destinations.map((d: any) => ({
        ...d,
        matchPercentage: Number(d.matchPercentage),
        rating: Number(d.rating),
      }));
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      console.log("Raw response:", text);
      throw new Error("Failed to parse destinations");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

interface DayItinerary {
  date: string;
  activities: Array<{
    time: string;
    title: string;
    duration: string;
    location: string;
    description: string;
    type: "attraction" | "meal" | "transport" | "rest";
  }>;
}

export interface GeneratedItinerary {
  days: DayItinerary[];
  summary: string;
  totalActivities: number;
  estimatedCost: string;
}

interface CityInfo {
  name: string;
  description: string;
  daysToSpend: number;
}

// Function to get coordinates from Google Maps API
async function getCoordinatesFromGoogleMaps(
  location: string,
): Promise<{ lat: number; lng: number }> {
  try {
    const encodedLocation = encodeURIComponent(location);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${import.meta.env.VITE_MAPS_API_KEY}`,
    );

    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
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

export async function generateItinerary(
  destination: string,
  preferences: Record<string, string[]>,
  startDate: Date,
  duration: number,
): Promise<GeneratedItinerary> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Step 1: Get list of cities within the country
    const citiesPrompt = `Based on these travel preferences:
      ${Object.entries(preferences)
        .map(([category, values]) => `${category}: ${values.join(", ")}`)
        .join("\n")}
      
      Generate a list of ${Math.min(duration, 3)} cities to visit in ${destination} for a ${duration}-day trip.
      Return only a JSON array with this structure:
      [
        {
          "name": "City Name",
          "description": "Brief description of why this city matches preferences",
          "daysToSpend": 2
        }
      ]
      
      Important: Make sure the total daysToSpend across all cities equals ${duration}.`;

    const citiesResult = await model.generateContent(citiesPrompt);
    const citiesResponse = await citiesResult.response;
    const citiesText = citiesResponse.text();

    let cities: CityInfo[] = [];
    try {
      let cleanText = citiesText.trim();
      const startIndex = cleanText.indexOf("[");
      const endIndex = cleanText.lastIndexOf("]") + 1;
      cleanText = cleanText.substring(startIndex, endIndex);
      cities = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Error parsing cities:", parseError);
      throw new Error("Failed to generate city list");
    }

    // Step 2: Generate itinerary for each city
    let allDays: DayItinerary[] = [];
    let currentDate = new Date(startDate);
    let totalActivities = 0;
    let estimatedCostSum = 0;

    for (const city of cities) {
      const cityDuration = city.daysToSpend;

      const cityPrompt = `Generate a detailed day-by-day itinerary for ${city.name}, ${destination} based on these preferences:
        ${Object.entries(preferences)
          .map(([category, values]) => `${category}: ${values.join(", ")}`)
          .join("\n")}
        
        Duration: ${cityDuration} days
        Start Date: ${currentDate.toLocaleDateString()}

        **RESPONSE INSTRUCTIONS:**

        **IMPORTANT: You MUST respond with VALID JSON only.  No other text or explanations should be included in your response.**

        **JSON FORMAT:**
        json
        {
          "days": [
            {
              "date": "YYYY-MM-DD",
              "city": "${city.name}",
              "activities": [
                {
                  "time": "HH:MM",
                  "title": "Activity name",
                  "duration": "X hours",
                  "location": "${city.name}",
                  "description": "Brief description",
                  "type": "attraction | meal | transport | rest",
                  "lat": "latitude",
                  "long": "longitude"
                }
              ]
            }
          ],
          "summary": "Brief summary of the visit to ${city.name}",
          "totalActivities": 10,
          "estimatedCost": "$X,XXX"
        }`;

      // Add a 5 second delay between API calls
      if (cities.indexOf(city) > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      const cityResult = await model.generateContent(cityPrompt);
      const cityResponse = await cityResult.response;
      const cityText = cityResponse.text();

      try {
        let cleanText = cityText.trim();
        const startIndex = cleanText.indexOf("{");
        const endIndex = cleanText.lastIndexOf("}") + 1;
        cleanText = cleanText.substring(startIndex, endIndex);
        console.log("cleanText:", cleanText);

        const cityItinerary = JSON.parse(cleanText);

        // Add coordinates to each activity using Google Maps API
        for (const day of cityItinerary.days) {
          for (const activity of day.activities) {
            // Only get coordinates if they don't already exist
            if (!activity.lat || !activity.long) {
              // Use the location or title to get coordinates
              const locationQuery = `${activity.location || activity.title}, ${city.name}, ${destination}`;
              console.log(`Getting coordinates for: ${locationQuery}`);

              try {
                const coordinates =
                  await getCoordinatesFromGoogleMaps(locationQuery);
                activity.lat = coordinates.lat;
                activity.long = coordinates.lng;
                console.log(
                  `Got coordinates for ${locationQuery}:`,
                  coordinates,
                );

                // Add a small delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 200));
              } catch (coordError) {
                console.error(
                  `Failed to get coordinates for ${locationQuery}:`,
                  coordError,
                );
              }
            }
          }
        }

        // Add city days to overall itinerary
        allDays = [...allDays, ...cityItinerary.days];

        // Update totals
        totalActivities += cityItinerary.totalActivities;

        // Extract cost as number for summing
        const costMatch = cityItinerary.estimatedCost.match(/\$([\d,]+)/);
        if (costMatch && costMatch[1]) {
          const costValue = parseInt(costMatch[1].replace(/,/g, ""));
          if (!isNaN(costValue)) {
            estimatedCostSum += costValue;
          }
        }

        // Update current date for next city
        currentDate.setDate(currentDate.getDate() + cityDuration);
      } catch (parseError) {
        console.error(`Error parsing itinerary for ${city.name}:`, parseError);
        throw new Error(`Failed to generate itinerary for ${city.name}`);
      }
    }

    // Format the final itinerary
    const formattedCost = `$${estimatedCostSum.toLocaleString()}`;
    const citySummary = cities
      .map((city) => `${city.name} (${city.daysToSpend} days)`)
      .join(", ");

    return {
      days: allDays,
      summary: `${duration}-day trip to ${destination} visiting ${citySummary}.`,
      totalActivities,
      estimatedCost: formattedCost,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function getNearbyAttractions(
  coordinates: { lat: number; lng: number },
  city: string = "",
): Promise<
  Array<{
    name: string;
    description: string;
    duration: string;
    location: string;
    type: string;
  }>
> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create a prompt to get nearby attractions
    const prompt = `Given these coordinates: latitude ${coordinates.lat}, longitude ${coordinates.lng} ${city ? `in ${city}` : ""}, suggest 5 nearby tourist attractions or points of interest.

Return ONLY a JSON array with this structure (no other text):
[
  {
    "name": "Attraction Name",
    "description": "Brief description of the attraction",
    "duration": "1-2h",
    "location": "Address or area",
    "type": "attraction"
  }
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up the response text to ensure it's valid JSON
      let cleanText = text.trim();
      const startIndex = cleanText.indexOf("[");
      const endIndex = cleanText.lastIndexOf("]") + 1;

      if (startIndex === -1 || endIndex === -1) {
        throw new Error("Invalid response format");
      }

      cleanText = cleanText.substring(startIndex, endIndex);
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Error parsing attractions:", parseError);
      throw new Error("Failed to parse nearby attractions");
    }
  } catch (error) {
    console.error("Error fetching nearby attractions:", error);
    throw error;
  }
}

export async function getDestinationDetails(
  destination: string,
  preferences: Record<string, string[]>,
): Promise<DestinationDetails> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Generate top 3-5 cities in ${destination} with activities and events based on these preferences:
      ${Object.entries(preferences)
        .map(([category, values]) => `${category}: ${values.join(", ")}`)
        .join("\n")}

      Return a JSON object with exactly this structure (use only these exact image URLs for images). IMPORTANT: Include exactly 3 activities per city, no more:
      {
        "cities": [
          {
            "name": "City Name",
            "description": "Brief city description",
            "image": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a",
            "activities": [
              {
                "name": "Activity name",
                "description": "Brief description",
                "duration": "2-3 hours",
                "image": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a",
                "bestTime": "Morning",
                "price": "$50"
              }
            ],
            "events": [
              {
                "name": "Event name",
                "description": "Brief description",
                "date": "Specific date/period",
                "image": "https://images.unsplash.com/photo-1555992828-ca4dbe41d294"
              }
            ]
          }
        ],
        "weather": {
          "temperature": "20-25°C",
          "conditions": "Sunny",
          "rainfall": "Low"
        },
        "transportation": {
          "options": ["Metro", "Bus", "Taxi"],
          "costs": "$20-30/day"
        },
        "accommodation": {
          "types": ["Hotels", "Hostels", "Apartments"],
          "priceRanges": "$100-200/night",
          "recommendations": ["City Center", "Historic District"]
        }
      }
      
      Important: Return ONLY the JSON object, no other text. Use the exact structure and image URLs shown above.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up the response text
      let cleanText = text.trim();
      console.log("Raw response:", cleanText);

      // Remove any text before the first { and after the last }
      const startIndex = cleanText.indexOf("{");
      const endIndex = cleanText.lastIndexOf("}") + 1;

      if (startIndex === -1 || endIndex === -1) {
        console.error("Could not find JSON object markers");
        throw new Error("Invalid response format");
      }

      cleanText = cleanText.substring(startIndex, endIndex);
      console.log("Cleaned response:", cleanText);

      try {
        // First try to parse the cleaned response
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("First parse attempt failed:", e);

        // Try to fix common JSON issues
        cleanText = cleanText
          .replace(/\n/g, "")
          .replace(/\r/g, "")
          .replace(/\t/g, "")
          .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
          .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote unquoted keys
          .replace(/\/\/.*$/gm, "") // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

        console.log("Further cleaned response:", cleanText);
        return JSON.parse(cleanText);
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      console.log("Raw response:", text);
      throw new Error("Failed to parse destination details");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
