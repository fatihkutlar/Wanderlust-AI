export const INTERESTS = [
  { id: 'history', label: 'History & Landmarks', icon: '🏛️' },
  { id: 'art', label: 'Art & Museums', icon: '🎨' },
  { id: 'food', label: 'Local Food', icon: '🍝' },
  { id: 'cafe', label: 'Cafes & Coffee', icon: '☕' },
  { id: 'nature', label: 'Parks & Nature', icon: '🌳' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'nightlife', label: 'Nightlife', icon: '🥂' },
];

export const MOCK_IMAGES = [
  'https://picsum.photos/800/600?random=1',
  'https://picsum.photos/800/600?random=2',
  'https://picsum.photos/800/600?random=3',
  'https://picsum.photos/800/600?random=4',
];

// Prioritize a specific Maps key, fallback to the general API key if that's all we have.
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.API_KEY || '';
