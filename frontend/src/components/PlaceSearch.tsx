import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';

interface PlaceSearchProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect }) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address'],
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();
      onPlaceSelect(place);
      if (inputRef.current) {
         inputRef.current.value = ''; // clear after selection if desired, or keep it
      }
    });
  }, [placeAutocomplete, onPlaceSelect]);

  return (
    <div className="relative w-full max-w-2xl mx-auto drop-shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-google-gray-800" />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="block w-full pl-12 pr-4 py-3 border border-transparent rounded-full leading-5 bg-white text-google-gray-900 placeholder-google-gray-800 hover:shadow-md focus:shadow-md focus:outline-none sm:text-base transition-shadow"
        placeholder="Search for a store (e.g. Home Depot, Chaska)..."
      />
    </div>
  );
};
