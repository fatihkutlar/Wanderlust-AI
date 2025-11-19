import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, subMessage }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="p-8 bg-white rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-xs md:max-w-md mx-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-blue-50 p-4 rounded-full">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <h3 className="mt-6 text-xl font-semibold text-gray-900">{message}</h3>
        {subMessage && (
          <p className="mt-2 text-sm text-gray-500">{subMessage}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;