import React from 'react';
import { Search, Map, Activity, X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-google-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-5 bg-google-blue rounded-full"></div>
              <div className="w-2 h-5 bg-google-red rounded-full"></div>
              <div className="w-2 h-5 bg-google-yellow rounded-full"></div>
              <div className="w-2 h-5 bg-google-green rounded-full"></div>
            </div>
            <h2 id="about-title" className="text-xl font-medium text-google-gray-900 tracking-tight">
              About GreenGrowth
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-google-gray-800 hover:bg-google-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">

          <div className="mb-8">
            <h3 className="text-lg font-medium text-google-gray-900 mb-3">What is GreenGrowth?</h3>
            <p className="text-google-gray-800 leading-relaxed">
              GreenGrowth is a Retail Intelligence Platform that leverages satellite imagery and census data to help store managers and executives make critical stocking decisions. By monitoring vegetation health and new construction near retail locations, it generates proactive, localized inventory recommendations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-google-gray-900 mb-4">How to Use the Application</h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-google-blue/10 text-google-blue rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-google-gray-900 mb-1">1. Search for a Store</h4>
                  <p className="text-sm text-google-gray-800">
                    Use the search bar at the top to find a specific retail location (e.g., "Home Depot, Austin"). The map will automatically center on the store and load local census demographics and live weather data.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-google-green/10 text-google-green rounded-full flex items-center justify-center">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-google-gray-900 mb-1">2. Run Satellite Analysis</h4>
                  <p className="text-sm text-google-gray-800">
                    Click the <span className="font-medium text-google-gray-900">Satellite:NDVI</span> or <span className="font-medium text-google-gray-900">Satellite:Construction</span> buttons in the right panel. GreenGrowth will query Google Earth Engine to analyze a 5-mile radius around the store over the past 5 years.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-google-yellow/20 text-google-yellow rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-google-gray-900 mb-1">3. Review Actionable Signals</h4>
                  <p className="text-sm text-google-gray-800 mb-2">
                    Once the analysis is complete, "Actionable Signals" will appear. These indicate major shifts—like high spring vegetation activity or explosive neighborhood housing growth.
                  </p>
                  <p className="text-sm text-google-gray-800">
                    Click <span className="font-medium text-google-green">Show Recommendation</span> to have our AI instantly generate a highly specific stocking tip (e.g., "Stock Toro mowers immediately") combining the satellite data with the live local weather.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-google-gray-200 bg-google-gray-50 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-google-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>

      </div>
    </div>
  );
};
