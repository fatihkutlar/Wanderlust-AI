import React from 'react';
import { Star, MapPin, CheckCircle2, DollarSign } from 'lucide-react';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, isSelected, onToggle }) => {
  return (
    <div 
      onClick={() => onToggle(place.id)}
      className={`
        relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
        bg-white shadow-sm
        ${isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-100 transform scale-[1.02]' 
          : 'border border-gray-100 hover:shadow-md'}
      `}
    >
      {/* Selection Indicator */}
      <div className={`
        absolute top-3 right-3 z-20 transition-all duration-300
        ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
      `}>
        <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* Image Container */}
      <div className="h-36 bg-gray-100 relative overflow-hidden">
        {place.imageUrl ? (
            <img 
            src={place.imageUrl} 
            alt={place.name}
            onError={(e) => {
                // Fallback if the AI provided URL is broken
                (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(place.category)}`;
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                <MapPin className="w-8 h-8 opacity-50" />
            </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
           <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md rounded-md border border-white/10">
             {place.category}
           </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
          {place.name}
        </h3>
        
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1 text-xs">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-800">{place.rating > 0 ? place.rating : 'New'}</span>
                <span className="text-gray-400">({place.reviewCount})</span>
            </div>
            {place.priceLevel && (
                <span className="text-xs font-medium text-gray-500">{place.priceLevel}</span>
            )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
          {place.description}
        </p>
        
        {place.address && (
            <div className="flex items-start text-[10px] text-gray-400 mt-auto">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
                <span className="truncate leading-tight">{place.address.split(',')[0]}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;