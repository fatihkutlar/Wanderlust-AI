import { GoogleGenAI } from "@google/genai";
import { Place, ItineraryItem, Pace } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean markdown code blocks if present
const cleanJson = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
};

/**
 * Fetches place recommendations and a city insight using Google Maps & Search Grounding.
 */
export const fetchPlacesWithGemini = async (
  city: string,
  interests: string[]
): Promise<{ places: Place[], insight: string }> => {
  try {
    console.log(`Fetching places and insight for ${city} with interests: ${interests.join(', ')}`);
    
    const prompt = `
      I need a list of 8-12 top-rated places in ${city} based on these interests: ${interests.join(", ")}.
      
      Also, generate a "City Insight":
      - A single, short, surprising, and attention-grabbing fact about ${city}.
      - Focus on history, culture, architecture, or stats (e.g., "Berlin has more bridges than Venice").
      - Max 2 sentences.
      
      Use Google Maps and Google Search to find:
      - Real, accurate names and locations.
      - Up-to-date ratings and review counts.
      - Real opening hours info.
      - A public image URL for the place if you can find one.
      
      If exact matches aren't found, find the best available alternatives.
      
      IMPORTANT: Return ONLY a valid JSON object (NOT an array directly). Do not use Markdown code blocks.
      
      JSON Structure:
      {
        "insight": "string (The interesting fact)",
        "places": [
          {
            "name": "string",
            "category": "string",
            "description": "string",
            "rating": number,
            "reviewCount": number,
            "priceLevel": "string (e.g. $ or $$$)",
            "address": "string",
            "imageUrl": "string (url or empty)",
            "lat": number,
            "lng": number
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
      },
    });

    console.log("Raw Gemini Response (Places):", response.text);

    const cleanedText = cleanJson(response.text || "{}");
    let rawData;
    try {
        rawData = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", cleanedText);
        throw new Error("Invalid JSON response from AI");
    }
    
    // Handle potential variation in AI response structure (fallback if it just returned array)
    const placesData = Array.isArray(rawData) ? rawData : (rawData.places || []);
    const insightData = rawData.insight || `Welcome to ${city}!`;

    if (!Array.isArray(placesData)) {
        console.warn("Gemini returned non-array data for places:", rawData);
        return { places: [], insight: insightData };
    }

    const places = placesData.map((item: any, index: number) => ({
      id: `place-${index}`,
      name: item.name,
      category: item.category || "General",
      description: item.description || "A popular local spot.",
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      priceLevel: item.priceLevel || "",
      address: item.address,
      coordinates: (item.lat && item.lng) ? { lat: item.lat, lng: item.lng } : undefined,
      imageUrl: item.imageUrl && item.imageUrl.startsWith('http') 
        ? item.imageUrl 
        : `https://placehold.co/600x400/EEE/31343C?text=${encodeURIComponent(item.category || 'Place')}`, 
    }));

    return { places, insight: insightData };

  } catch (error) {
    console.error("Error fetching places:", error);
    throw error;
  }
};

/**
 * Generates a timed itinerary based on selected places using Google Maps Directions logic.
 */
export const generateItineraryWithGemini = async (
  city: string,
  selectedPlaces: Place[],
  startTime: string,
  endTime: string,
  pace: Pace
): Promise<ItineraryItem[]> => {
  try {
    const placesList = selectedPlaces.map(p => 
      `${p.name} (${p.category}) at ${p.address || 'coordinates: ' + p.coordinates?.lat + ',' + p.coordinates?.lng}`
    ).join("; ");

    const paceInstruction = pace === 'chill' 
      ? "Relaxed pace. Allow extra time at each stop. Don't rush."
      : pace === 'packed' 
      ? "Fast pace. Fit as much as possible efficiently. Short stops."
      : "Balanced pace. Standard tourist duration.";

    const prompt = `
      Build a logical, time-optimized 1-day itinerary for ${city} starting at ${startTime} and ending around ${endTime}.
      User wants to visit: ${placesList}.
      Pace preference: ${paceInstruction}.
      
      Use Google Maps to:
      1. Order places geographically to minimize travel.
      2. Calculate realistic travel times and modes (Walk, U-Bahn, S-Bahn, Metro, Bus, etc.).
      3. Insert lunch/dinner at real, highly-rated restaurants near the stops at appropriate times.
      
      Rules:
      - Don't overlap times.
      - Account for ~1.5h at museums, ~45m at cafes/landmarks (adjusted by pace).
      - Respect the end time of ${endTime}.
      
      CRITICAL ERROR HANDLING:
      - If the Google Maps tool fails to return directions for a specific leg, YOU MUST ESTIMATE the travel time (e.g. 15 mins) and mode (e.g. "transit") based on general city knowledge or straight-line distance.
      - DO NOT return an error message or apology text like "I apologize but I encountered a technical issue".
      - YOU MUST return the JSON array under all circumstances.
      
      IMPORTANT: Return ONLY a valid JSON array. Do not use Markdown code blocks.
      
      JSON Structure per item:
      {
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "placeName": "string",
        "category": "string",
        "description": "string",
        "transportType": "walk" | "transit" | "drive",
        "transportDetails": "string (e.g. 'U2 to Alexanderplatz' or 'Walk 500m')",
        "travelMinutes": number,
        "lat": number,
        "lng": number
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }], // Maps tool is crucial for routing logic
      },
    });

    console.log("Raw Gemini Response (Itinerary):", response.text);

    const cleanedText = cleanJson(response.text || "[]");
    let rawData;
    try {
        rawData = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse Itinerary JSON:", cleanedText);
        throw new Error("Invalid JSON response for Itinerary");
    }

    if (!Array.isArray(rawData)) {
       console.warn("Itinerary data is not an array, attempting fallback/fix");
       // If somehow we got an object wrapper, try to extract array or return empty
       return [];
    }

    return rawData.map((item: any, index: number) => ({
      id: `event-${index}`,
      startTime: item.startTime,
      endTime: item.endTime,
      placeName: item.placeName,
      category: item.category,
      description: item.description,
      transportToNext: item.transportType ? {
        type: item.transportType.toLowerCase(),
        details: item.transportDetails,
        durationMinutes: item.travelMinutes || 10
      } : undefined,
      coordinates: (item.lat && item.lng) ? { lat: item.lat, lng: item.lng } : undefined,
    }));

  } catch (error) {
    console.error("Error generating itinerary:", error);
    return createFallbackItinerary(selectedPlaces, startTime);
  }
};

// Fallback generator in case API/Tools fail completely
const createFallbackItinerary = (places: Place[], startTime: string): ItineraryItem[] => {
  console.log("Using fallback itinerary generator");
  let currentHour = parseInt(startTime.split(':')[0]);
  let currentMinute = parseInt(startTime.split(':')[1]);

  return places.map((place, index) => {
    const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    // Add 1.5 hours per place
    currentHour += 1;
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
    const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Add travel time gap (30 mins)
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }

    return {
      id: `fallback-${index}`,
      startTime: startStr,
      endTime: endStr,
      placeName: place.name,
      category: place.category,
      description: place.description,
      transportToNext: index < places.length - 1 ? {
        type: 'transit',
        details: 'Transit to next stop',
        durationMinutes: 30
      } : undefined,
      coordinates: place.coordinates
    };
  });
};
