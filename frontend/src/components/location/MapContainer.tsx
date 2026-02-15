import { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OPENSTREET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface MapContainerProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

/** Fix default marker icon in Leaflet (broken in React/Vite) */
function fixLeafletIcon() {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

export default function MapContainer({ center, zoom = 12, className = 'h-[400px] w-full rounded-lg', children }: MapContainerProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className={className}>
      <LeafletMap center={center} zoom={zoom} className="h-full w-full rounded-lg" scrollWheelZoom={true}>
        <TileLayer attribution={OPENSTREET_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {children}
      </LeafletMap>
    </div>
  );
}
