import React from 'react';
import { INTERESTS } from '../constants';

interface InterestPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

const InterestPicker: React.FC<InterestPickerProps> = ({ selected, onChange }) => {
  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {INTERESTS.map((interest) => {
        const isActive = selected.includes(interest.id);
        return (
          <button
            key={interest.id}
            onClick={() => toggleInterest(interest.id)}
            className={`
              flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'}
            `}
          >
            <span className="mr-2 text-lg">{interest.icon}</span>
            {interest.label}
          </button>
        );
      })}
    </div>
  );
};

export default InterestPicker;