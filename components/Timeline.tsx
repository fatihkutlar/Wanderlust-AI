import React from 'react';
import { ItineraryItem } from '../types';
import { MapPin, Coffee, Camera, Utensils, Footprints, Car, Bus, Clock, Train, ChevronRight } from 'lucide-react';

interface TimelineProps {
  items: ItineraryItem[];
}

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  const getIconForCategory = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('food') || c.includes('restaurant') || c.includes('dinner') || c.includes('lunch')) return <Utensils className="w-5 h-5 text-white" />;
    if (c.includes('cafe') || c.includes('breakfast')) return <Coffee className="w-5 h-5 text-white" />;
    if (c.includes('museum') || c.includes('art')) return <Camera className="w-5 h-5 text-white" />;
    if (c.includes('park') || c.includes('nature')) return <MapPin className="w-5 h-5 text-white" />;
    return <MapPin className="w-5 h-5 text-white" />;
  };

  const getCategoryColor = (cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('food') || c.includes('restaurant')) return 'bg-orange-500';
      if (c.includes('cafe')) return 'bg-amber-500';
      if (c.includes('museum') || c.includes('art')) return 'bg-purple-500';
      if (c.includes('nature')) return 'bg-green-500';
      return 'bg-blue-500';
  };

  const getTransportIcon = (type?: string, details?: string) => {
    const d = details?.toLowerCase() || '';
    if (d.includes('train') || d.includes('s-bahn') || d.includes('u-bahn') || d.includes('metro')) return <Train className="w-3 h-3" />;
    if (d.includes('tram')) return <Train className="w-3 h-3" />;
    
    switch(type) {
      case 'walk': return <Footprints className="w-3 h-3" />;
      case 'transit': return <Bus className="w-3 h-3" />;
      case 'drive': return <Car className="w-3 h-3" />;
      default: return <Footprints className="w-3 h-3" />;
    }
  };

  const handleTravelClick = (destinationLat: number, destinationLng: number, transportType?: string) => {
    const travelMode = transportType === 'drive' ? 'driving' : transportType === 'walk' ? 'walking' : 'transit';
    // Universal Link format is the robust way to handle deep linking on iOS/Web simultaneously.
    // iOS will intercept this URL and open the Google Maps app if installed, or fall back to Safari.
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=${travelMode}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative pl-6 pr-4 py-6 space-y-8">
      {/* Continuous Vertical Line */}
      <div className="absolute left-[35px] top-8 bottom-8 w-0.5 bg-gray-200/80" />

      {items.map((item, index) => {
        const nextItem = items[index + 1];
        
        return (
          <div key={item.id} className="relative flex gap-5 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
            
            {/* Icon Circle */}
            <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full shadow-md flex items-center justify-center ring-4 ring-white ${getCategoryColor(item.category)}`}>
              {getIconForCategory(item.category)}
            </div>

            {/* Card */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-400 flex items-center bg-gray-100 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 mr-1" /> {item.startTime} - {item.endTime}
                  </span>
              </div>
              
              <h4 className="font-bold text-gray-900 text-lg leading-tight">{item.placeName}</h4>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide opacity-80 block mb-2">{item.category}</span>

              <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-100 pl-3 py-1">
                {item.description}
              </p>

              {/* Transport Info Button */}
              {item.transportToNext && nextItem && nextItem.coordinates && (
                <button 
                  onClick={() => handleTravelClick(nextItem.coordinates!.lat, nextItem.coordinates!.lng, item.transportToNext?.type)}
                  className="mt-4 flex items-center text-xs text-gray-500 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all w-full sm:w-fit px-3 py-2 rounded-xl border border-gray-200 group active:scale-95"
                >
                  <div className="flex items-center mr-auto">
                    <span className="mr-2 text-gray-400 group-hover:text-blue-500">
                      {getTransportIcon(item.transportToNext.type, item.transportToNext.details)}
                    </span>
                    <span className="font-medium text-gray-700 group-hover:text-blue-700 mr-2">
                      Travel to {nextItem.placeName}
                    </span>
                  </div>
                  
                  <div className="flex items-center ml-2 pl-2 border-l border-gray-200 group-hover:border-blue-200">
                     <span className="font-medium">{item.transportToNext.details || item.transportToNext.type}</span>
                     <span className="mx-1.5 opacity-30">|</span>
                     <span>{item.transportToNext.durationMinutes} min</span>
                     <ChevronRight className="w-3 h-3 ml-1 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      {/* End of day marker */}
      <div className="relative flex gap-5 opacity-50">
        <div className="relative z-10 flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center ring-4 ring-white">
          <div className="w-3 h-3 bg-gray-400 rounded-full" />
        </div>
        <div className="py-2">
           <span className="text-sm font-medium text-gray-500">End of itinerary</span>
        </div>
      </div>

    </div>
  );
};

export default Timeline;
