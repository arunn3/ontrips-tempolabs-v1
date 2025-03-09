// Pexels API client for fetching images

/**
 * Fetches an image from Pexels API based on a search query
 * @param query The search query (e.g., "Paris, France")
 * @param orientation Optional orientation (landscape, portrait, square)
 * @returns URL of the image or a fallback URL if not found
 */
export async function getImageFromPexels(
  query: string,
  orientation: "landscape" | "portrait" | "square" = "landscape",
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;

  if (!apiKey) {
    console.error("Pexels API key is missing");
    return null;
  }

  try {
    // Try to get more results to increase chances of finding a good image
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query,
      )}&per_page=5&orientation=${orientation}`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (!response.ok) {
      console.error(`Pexels API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(
      `Pexels search for "${query}" returned ${data.photos?.length || 0} results`,
    );

    if (data.photos && data.photos.length > 0) {
      // Return the large-sized image URL from a random photo in the results
      const randomIndex = Math.floor(
        Math.random() * Math.min(data.photos.length, 5),
      );
      const imageUrl = data.photos[randomIndex].src.large;
      console.log(`Selected image URL: ${imageUrl}`);
      return imageUrl;
    } else {
      // No images found
      console.log(`No images found for query: ${query}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching image from Pexels:", error);
    return null;
  }
}

/**
 * Provides a fallback image URL when Pexels API fails
 * @param query The original search query
 * @returns A fallback image URL
 */
function getFallbackImage(query: string): string {
  // Use Unsplash as fallback
  return `https://source.unsplash.com/featured/?${encodeURIComponent(query)},travel`;
}
