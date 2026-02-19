import React, { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MapCircleProps {
  center: { lat: number; lng: number };
  radius: number; // in meters
}

export const MapCircle: React.FC<MapCircleProps> = ({ center, radius }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      strokeColor: '#0ea5e9',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#0ea5e9',
      fillOpacity: 0.1,
      map,
      center,
      radius,
      clickable: false,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, center, radius]);

  return null;
};
