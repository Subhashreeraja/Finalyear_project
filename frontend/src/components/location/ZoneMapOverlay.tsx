import { Polygon, Popup } from 'react-leaflet';
import SetMapView from './SetMapView';
import MapContainer from './MapContainer';
import type { Zone, CrowdLevel } from '../../types/location';

const ZONE_COLORS: Record<CrowdLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#ef4444',
};

interface ZoneMapOverlayProps {
  zones: Zone[];
  placeCenter: [number, number];
  placeName?: string;
}

export default function ZoneMapOverlay({ zones, placeCenter }: ZoneMapOverlayProps) {
  return (
    <MapContainer center={placeCenter} zoom={16} className="h-[450px] w-full rounded-lg">
      <SetMapView center={placeCenter} zoom={16} />
      {zones.map((z) => (
        <Polygon
          key={z.id}
          positions={z.polygon.map(([lat, lng]) => [lat, lng] as [number, number])}
          pathOptions={{
            color: ZONE_COLORS[z.crowdLevel],
            fillColor: ZONE_COLORS[z.crowdLevel],
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-center min-w-[140px]">
              <p className="font-semibold">{z.name}</p>
              <p className="text-sm capitalize" style={{ color: ZONE_COLORS[z.crowdLevel] }}>
                {z.crowdLevel} crowd
              </p>
              {z.crowdCount != null && z.capacity != null && (
                <p className="text-xs text-gray-600 mt-1">
                  {z.crowdCount} / {z.capacity}
                </p>
              )}
            </div>
          </Popup>
        </Polygon>
      ))}
    </MapContainer>
  );
}
