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

interface DestinationDetails {
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
  attractions: Array<{
    name: string;
    description: string;
    image: string;
    visitDuration: string;
    bestTime: string;
    price: string;
  }>;
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

      Generate exactly 3 travel destinations that match these preferences. Return only a JSON array with this exact structure for each destination:
      {
        "title": "City, Country",
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

    const prompt = `Generate detailed information for ${destination} based on these preferences:
      ${Object.entries(preferences)
        .map(([category, values]) => `${category}: ${values.join(", ")}`)
        .join("\n")}

      Return a JSON object with exactly this structure (use only these exact image URLs for images):
      {
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
        ],
        "attractions": [
          {
            "name": "Attraction name",
            "description": "Brief description",
            "image": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9",
            "visitDuration": "1-2 hours",
            "bestTime": "Afternoon",
            "price": "$25"
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
    const data = await result.response;
    //console.log(data);
    let text;
    if (data.candidates && data.candidates[0]?.content?.parts) {
      text = data.candidates[0].content.parts[0]?.text;
      //setGeneratedText(text);
      //console.log(text);
    } else {
      throw new Error(`Response data format incorrect!`);
    }

    try {
      // Clean up the response text
      let cleanText = text.trim();

      try {
        // First try to parse the raw response
        return JSON.parse(cleanText);
      } catch (e) {
        // If that fails, try to extract JSON from the text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/); // Match everything between { and }
        if (!jsonMatch) {
          throw new Error("Could not find JSON object in response");
        }
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
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
