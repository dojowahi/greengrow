import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Store, Signal } from '../utils/api';
import { MapCircle } from './MapCircle';
import { MapTileLayer } from './MapTileLayer';

interface MapViewProps {
  stores: Store[];
  signals: Signal[];
  selectedStore: Store | null;
  onSelectStore: (store: Store | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({ stores, signals, selectedStore, onSelectStore }) => {
  // Center map on the US by default
  const [center, setCenter] = useState({ lat: 39.8283, lng: -98.5795 });
  const [zoom, setZoom] = useState(4);

  useEffect(() => {
    if (selectedStore) {
      setCenter({ lat: selectedStore.lat, lng: selectedStore.lng });
      setZoom(14); // zoom in closer on selection for Earth Engine detail
    } else {
      setCenter({ lat: 39.8283, lng: -98.5795 });
      setZoom(4); // reset to US view
    }
  }, [selectedStore]);

  // Note: For a real app, require a Google Maps API Key here. 
  // Using a blank/demo key for this prototype.
  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl border border-gray-800">
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          center={center}
          zoom={zoom}
          onCameraChanged={(ev) => {
            setCenter(ev.detail.center);
            setZoom(ev.detail.zoom);
          }}
          // use dark mode map
          mapId="map-dark"
          styles={[
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
          ]}
        >
          {stores.map((store) => (
            <AdvancedMarker
              key={store.id}
              position={{ lat: store.lat, lng: store.lng }}
              onClick={() => onSelectStore(store)}
            >
              <Pin background={selectedStore?.id === store.id ? '#FF5733' : '#4ade80'} borderColor={'#000'} glyphColor={'#fff'} />
            </AdvancedMarker>
          ))}

          {/* Render 5-Mile radius analytical footprint around the active store */}
          {selectedStore && (
            <MapCircle
              center={{ lat: selectedStore.lat, lng: selectedStore.lng }}
              radius={8046} // 5 Miles in meters
            />
          )}

          {/* Render geographic indicators (hotspots) returned from the signals */}
          {signals.map((signal, idx) => {
            if (signal.tile_url) {
              return <MapTileLayer key={`tile-${idx}`} urlFormat={signal.tile_url} />;
            }
            if (signal.geo_points && signal.geo_points.length > 0) {
              const colorClass = signal.type === 'Seasonal' ? 'bg-[#4ade80]' : 'bg-red-500';
              return signal.geo_points.map((pt, pIdx) => (
                <AdvancedMarker key={`pulse-${idx}-${pIdx}`} position={pt}>
                  <div className={`w-4 h-4 ${colorClass} rounded-full animate-ping opacity-75`}></div>
                  <div className={`w-4 h-4 ${colorClass} rounded-full absolute top-0 left-0`}></div>
                </AdvancedMarker>
              ))
            }
            return null;
          })}
        </Map>
      </APIProvider>
    </div>
  );
};
