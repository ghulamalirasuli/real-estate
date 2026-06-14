import { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onCoordinatesChange: (lat: string, lng: string) => void;
  height?: string;
}

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function MapPicker({ latitude, longitude, onCoordinatesChange, height = '350px' }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const { darkMode } = useThemeStore();
  const [isLoaded, setIsLoaded] = useState(false);

  const lat = parseFloat(latitude) || 40.7128;
  const lng = parseFloat(longitude) || -74.006;

  const updateTiles = useCallback((L: any, map: any, isDark: boolean) => {
    map.eachLayer((layer: any) => {
      if (layer._url && (layer._url.includes('cartocdn') || layer._url.includes('openstreetmap'))) {
        map.removeLayer(layer);
      }
    });

    const tiles = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);
  }, []);

  useEffect(() => {
    let L: any;
    let map: any;
    let marker: any;

    const initMap = async () => {
      L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current) return;

      map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        dragging: true,
      });

      updateTiles(L, map, darkMode);

      // Add draggable marker
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onCoordinatesChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
      });

      // Handle map click to move marker
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onCoordinatesChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsLoaded(true);
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change from inputs
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !isLoaded) return;
    const newLat = parseFloat(latitude);
    const newLng = parseFloat(longitude);
    if (isNaN(newLat) || isNaN(newLng)) return;

    const currentPos = markerRef.current.getLatLng();
    if (currentPos.lat !== newLat || currentPos.lng !== newLng) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.setView([newLat, newLng], mapInstanceRef.current.getZoom());
    }
  }, [latitude, longitude, isLoaded]);

  // Update tiles on theme change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    (async () => {
      const L = await import('leaflet');
      updateTiles(L, mapInstanceRef.current, darkMode);
      // Re-add marker on top
      if (markerRef.current) {
        mapInstanceRef.current.addLayer(markerRef.current);
      }
    })();
  }, [darkMode, isLoaded, updateTiles]);

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{ height, width: '100%' }}
      />
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Click on the map or drag the marker to set the location
        </span>
        <span className="ml-auto font-mono">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
