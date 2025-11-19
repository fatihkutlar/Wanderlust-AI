export interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceLevel?: string; // e.g., "$$", "$$$"
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  imageUrl?: string;
}

export interface ItineraryItem {
  id: string;
  startTime: string;
  endTime: string;
  placeName: string;
  category: string;
  description: string;
  transportToNext?: {
    type: 'walk' | 'transit' | 'drive';
    details?: string; // e.g. "U8 towards Hermannstr."
    durationMinutes: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type Pace = 'chill' | 'balanced' | 'packed';

export interface UserPreferences {
  city: string;
  interests: string[];
  date: string;
  startTime: string;
  endTime: string;
  pace: Pace;
}

export type AppStep = 'onboarding' | 'loading_places' | 'selection' | 'generating_route' | 'itinerary';
