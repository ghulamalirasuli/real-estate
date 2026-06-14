import { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../store/themeStore';

interface MapViewProps {
  latitude: number;
  longitude: number;
  height?: string;
  zoom?: number;
  className?: string;
}

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function MapView({ latitude, longitude, height = '200px', zoom = 14, className = '' }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const { darkMode } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map once
  useEffect(() => {
    let map: any;
    let marker: any;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      leafletRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false,
      });

      L.tileLayer(darkMode ? DARK_TILES : LIGHT_TILES, {
        attribution: ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      marker = L.marker([latitude, longitude]).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsLoading(false);
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        leafletRef.current = null;
      }
    };
  }, []);

  // Update marker position and center when lat/lng/zoom props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], zoom);
    }
  }, [latitude, longitude, zoom]);

  // Update tiles on theme change using stored Leaflet ref
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapInstanceRef.current) return;

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer._url && layer._url.includes('cartocdn')) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    const tiles = L.tileLayer(darkMode ? DARK_TILES : LIGHT_TILES, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Re-add marker on top of new tiles
    if (markerRef.current) {
      markerRef.current.addTo(mapInstanceRef.current);
    }
  }, [darkMode]);

  return (
    <div className="relative" style={{ height, width: '100%' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center z-10 animate-pulse border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
