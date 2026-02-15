import { Marker, Popup } from 'react-leaflet';
import SetMapView from './SetMapView';
import MapContainer from './MapContainer';
import type { District } from '../../types/location';

interface DistrictMapViewProps {
  districts: District[];
  selected: District | null;
  onSelect: (d: District) => void;
  defaultCenter: [number, number];
}

export default function DistrictMapView({ districts, selected, onSelect, defaultCenter }: DistrictMapViewProps) {
  const center = selected ? ([selected.lat, selected.lng] as [number, number]) : defaultCenter;

  return (
    <MapContainer center={center} zoom={selected ? 13 : 11} className="h-[400px] w-full rounded-lg">
      <SetMapView center={center} zoom={selected ? 13 : 11} />
      {districts.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lng]}
          eventHandlers={{
            click: () => onSelect(d),
          }}
        >
          <Popup>
            <div className="text-center">
              <p className="font-medium">{d.name}</p>
              <p className="text-sm text-gray-600">{d.placeCount} places</p>
              <button
                type="button"
                onClick={() => onSelect(d)}
                className="mt-2 text-sm text-header font-medium hover:underline"
              >
                View places
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
