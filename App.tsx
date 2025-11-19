import React, { useState, useCallback } from 'react';
import { MapPin, ArrowRight, Calendar, RotateCcw, Search, Sparkles, Lightbulb, Info } from 'lucide-react';
import LoadingOverlay from './components/LoadingOverlay';
import InterestPicker from './components/InterestPicker';
import PlaceCard from './components/PlaceCard';
import Timeline from './components/Timeline';
import { AppStep, Place, ItineraryItem } from './types';
import { fetchPlacesWithGemini, generateItineraryWithGemini } from './services/geminiService';
import { GOOGLE_MAPS_API_KEY } from './constants';

// Skeleton Component for loading states
const SkeletonGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 h-64">
        <div className="h-36 bg-gray-200"></div>
        <div className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded w-full mt-2"></div>
        </div>
      </div>
    ))}
  </div>
);

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('onboarding');
  const [city, setCity] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [interests, setInterests] = useState<string[]>([]);
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [cityInsight, setCityInsight] = useState<string>('');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  
  const [loadingMsg, setLoadingMsg] = useState('');

  const handleStartDiscovery = async () => {
    if (!city || interests.length === 0) return;
    
    setLoadingMsg(`AI is scouting best spots in ${city}...`);
    setStep('loading_places');
    
    try {
      const { places: fetchedPlaces, insight } = await fetchPlacesWithGemini(city, interests);
      setPlaces(fetchedPlaces);
      setCityInsight(insight);
      setStep('selection');
    } catch (e) {
      console.error(e);
      alert('Something went wrong fetching places. Please check your API connection.');
      setStep('onboarding');
    }
  };

  const handleGenerateRoute = async () => {
    if (selectedPlaceIds.length === 0) return;

    setLoadingMsg('AI is optimizing your travel route...');
    setStep('generating_route');

    try {
      const selectedPlaces = places.filter(p => selectedPlaceIds.includes(p.id));
      const generatedItinerary = await generateItineraryWithGemini(city, selectedPlaces, startTime);
      setItinerary(generatedItinerary);
      setStep('itinerary');
    } catch (e) {
      alert('Failed to generate itinerary. Please try again.');
      setStep('selection');
    }
  };

  const togglePlaceSelection = useCallback((id: string) => {
    setSelectedPlaceIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  }, []);

  const handleReset = () => {
    setStep('onboarding');
    setCity('');
    setInterests([]);
    setSelectedPlaceIds([]);
    setItinerary([]);
    setPlaces([]);
    setCityInsight('');
  };

  // Helper to build Google Maps Embed URL for directions (Fallback if needed, but Map is removed from UI)
  const getMapEmbedUrl = () => {
    if (itinerary.length < 2 || !GOOGLE_MAPS_API_KEY) return '';
    
    const origin = encodeURIComponent(itinerary[0].placeName + ' ' + city);
    const destination = encodeURIComponent(itinerary[itinerary.length - 1].placeName + ' ' + city);
    
    // Intermediate waypoints (exclude first and last)
    const waypoints = itinerary.slice(1, -1)
      .map(item => encodeURIComponent(item.placeName + ' ' + city))
      .join('|');

    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}&waypoints=${waypoints}&mode=transit`;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans selection:bg-blue-200">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2" onClick={handleReset}>
            <div className="bg-black text-white p-1.5 rounded-xl shadow-sm cursor-pointer">
               <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight cursor-pointer">Wanderlust AI</h1>
          </div>
          {step === 'itinerary' && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Restart
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        
        {/* STEP 1: ONBOARDING */}
        {step === 'onboarding' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-2 pt-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Where to next?</h2>
              <p className="text-gray-500">Build your perfect day in seconds.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              {/* City Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Destination</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Search city..."
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-100/50 border-none rounded-2xl text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Start Time</label>
                <input 
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-100/50 border-none rounded-2xl text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                />
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Interests</label>
                <InterestPicker selected={interests} onChange={setInterests} />
              </div>
            </div>
            
            {/* Floating Action Button */}
            <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-30">
                <button 
                  onClick={handleStartDiscovery}
                  disabled={!city || interests.length === 0}
                  className="w-full max-w-md bg-black hover:bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 transition-all"
                >
                  Start Planning <ArrowRight className="ml-2 w-5 h-5" />
                </button>
            </div>
          </div>
        )}

        {/* LOADING STATES */}
        {(step === 'loading_places' || step === 'generating_route') && (
           <div className="space-y-6">
              <div className="text-center py-8">
                 <h3 className="text-xl font-semibold text-gray-900">{loadingMsg}</h3>
                 <p className="text-gray-500 text-sm mt-2">Gathering real-time data from Google Maps...</p>
              </div>
              <SkeletonGrid />
           </div>
        )}

        {/* STEP 2: SELECTION */}
        {step === 'selection' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end px-1">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Top Picks</h2>
                <p className="text-gray-500 text-sm mt-1">Select places you'd love to visit.</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  {selectedPlaceIds.length} selected
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Found {places.length} places</span>
              </div>
            </div>

            {/* EMPTY STATE for Places */}
            {places.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No top picks found</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                  We couldn't find any places matching your criteria in {city}. Try fewer interests or a different city.
                </p>
                <button 
                  onClick={handleReset}
                  className="mt-6 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Change Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-24">
                {places.map(place => (
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    isSelected={selectedPlaceIds.includes(place.id)}
                    onToggle={togglePlaceSelection}
                  />
                ))}
              </div>
            )}

            {places.length > 0 && (
              <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-30">
                  <button 
                    onClick={handleGenerateRoute}
                    disabled={selectedPlaceIds.length === 0}
                    className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center active:scale-95 transition-all"
                  >
                    Generate Route <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ITINERARY */}
        {step === 'itinerary' && (
          <div className="animate-in slide-in-from-bottom-12 fade-in duration-700 pb-10">
             <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50/50 border-b border-gray-100 p-6 text-center">
                   <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{city}</h2>
                   <div className="flex items-center justify-center mt-2 space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>1-Day Plan</span>
                   </div>
                </div>

                {/* CITY INSIGHT CARD (Replaces Map) */}
                <div className="px-6 pt-6 pb-2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                       <Lightbulb className="w-24 h-24 text-blue-600 transform rotate-12" />
                    </div>
                    
                    <div className="flex items-start space-x-3 relative z-10">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600 mt-0.5">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">Did you know?</h4>
                        <p className="text-lg font-medium text-gray-900 leading-relaxed">
                          {cityInsight || "This city is full of hidden gems waiting to be discovered."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Timeline items={itinerary} />
             </div>

             <div className="mt-8 text-center">
                <p className="text-gray-400 text-xs">
                   Routes and times are estimates. Check real-time traffic locally.
                </p>
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
