import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the model
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

export async function getDestinationDetails(
  destination: string,
  preferences: Record<string, string[]>,
): Promise<DestinationDetails> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
