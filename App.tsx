import React, { useState, useCallback } from 'react';
import { MapPin, ArrowRight, Calendar, RotateCcw, Search, Sparkles, Lightbulb, Info, Clock, ChevronDown } from 'lucide-react';
import LoadingOverlay from './components/LoadingOverlay';
import InterestPicker from './components/InterestPicker';
import PlaceCard from './components/PlaceCard';
import Timeline from './components/Timeline';
import { AppStep, Place, ItineraryItem, Pace } from './types';
import { fetchPlacesWithGemini, generateItineraryWithGemini } from './services/geminiService';
import { GOOGLE_MAPS_API_KEY, QUICK_CITIES, PACING_OPTIONS } from './constants';

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
  
  // Form State
  const [city, setCity] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  const [pace, setPace] = useState<Pace>('balanced');
  const [interests, setInterests] = useState<string[]>([]);
  
  // Data State
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
    
    // Log payload for debugging
    console.log("Generating Route Request:", {
        city,
        selectedPlaceCount: selectedPlaceIds.length,
        startTime,
        endTime,
        pace,
        selectedPlaceIds
    });

    try {
      const selectedPlaces = places.filter(p => selectedPlaceIds.includes(p.id));
      const generatedItinerary = await generateItineraryWithGemini(city, selectedPlaces, startTime, endTime, pace);
      setItinerary(generatedItinerary);
      setStep('itinerary');
    } catch (e) {
      console.error("Route generation failed in UI layer:", e);
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
    setPace('balanced');
    setStartTime('09:00');
    setEndTime('22:00');
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

      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        
        {/* STEP 1: ONBOARDING - New iOS Panel Style */}
        {step === 'onboarding' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            <div className="text-center space-y-1.5 pt-4 pb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Where to next?</h2>
              <p className="text-gray-500 font-medium">Build your perfect day in seconds.</p>
            </div>

            {/* Main Card Container */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden max-w-xl mx-auto">
              <div className="p-6 md:p-8 space-y-8">
                
                {/* Destination Section */}
                <div className="space-y-3">
                  <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <MapPin className="w-3 h-3 mr-1" /> Destination
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Search a city (e.g. Berlin, Paris)"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal outline-none"
                    />
                  </div>
                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-2">
                    {QUICK_CITIES.map(quickCity => (
                      <button
                        key={quickCity}
                        onClick={() => setCity(quickCity)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-full transition-colors"
                      >
                        {quickCity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time & Pace Section */}
                <div className="space-y-3">
                   <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3 mr-1" /> Time & Pace
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Start</label>
                      <input 
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-base font-semibold text-gray-900 focus:ring-0 cursor-pointer"
                      />
                    </div>
                     <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">End</label>
                      <input 
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-base font-semibold text-gray-900 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Pace Selector */}
                  <div className="bg-gray-100 p-1 rounded-xl flex relative">
                     {PACING_OPTIONS.map((option) => {
                       const isSelected = pace === option.id;
                       return (
                         <button
                           key={option.id}
                           onClick={() => setPace(option.id)}
                           className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 z-10 ${isSelected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                           {option.label}
                         </button>
                       );
                     })}
                  </div>
                </div>

                {/* Interests Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 mr-1" /> Interests
                    </label>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Pick at least one
                    </span>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-1 border border-gray-100">
                    <InterestPicker selected={interests} onChange={setInterests} />
                  </div>
                </div>

              </div>
            </div>
            
            {/* Sticky CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50 flex justify-center pb-8">
                <button 
                  onClick={handleStartDiscovery}
                  disabled={!city || interests.length === 0}
                  className="w-full max-w-xl bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 transition-all"
                >
                  Plan My Day <ArrowRight className="ml-2 w-5 h-5" />
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
                      <span>1-Day Plan • {pace.charAt(0).toUpperCase() + pace.slice(1)} Pace</span>
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
