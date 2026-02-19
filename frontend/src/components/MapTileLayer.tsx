import React, { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MapTileLayerProps {
  urlFormat: string;
}

export const MapTileLayer: React.FC<MapTileLayerProps> = ({ urlFormat }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !urlFormat) return;

    const imageMapType = new google.maps.ImageMapType({
      getTileUrl: function (coord, zoom) {
        return urlFormat
          .replace('{x}', coord.x.toString())
          .replace('{y}', coord.y.toString())
          .replace('{z}', zoom.toString());
      },
      tileSize: new google.maps.Size(256, 256),
      name: 'Earth Engine Overlay',
      maxZoom: 20,
      opacity: 0.8
    });

    // Add to overlayMapTypes
    map.overlayMapTypes.push(imageMapType);

    return () => {
      // Remove it when unmounting
      for (let i = 0; i < map.overlayMapTypes.getLength(); i++) {
        if (map.overlayMapTypes.getAt(i) === imageMapType) {
          map.overlayMapTypes.removeAt(i);
          break;
        }
      }
    };
  }, [map, urlFormat]);

  return null;
};
