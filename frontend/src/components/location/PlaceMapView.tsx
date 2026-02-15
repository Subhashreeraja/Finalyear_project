import { Marker, Popup } from 'react-leaflet';
import SetMapView from './SetMapView';
import MapContainer from './MapContainer';
import type { Place } from '../../types/location';

interface PlaceMapViewProps {
  places: Place[];
  selected: Place | null;
  onSelect: (p: Place) => void;
  center: [number, number];
}

export default function PlaceMapView({ places, selected, onSelect, center }: PlaceMapViewProps) {
  const mapCenter = selected ? ([selected.lat, selected.lng] as [number, number]) : center;

  return (
    <MapContainer center={mapCenter} zoom={selected ? 15 : 13} className="h-[400px] w-full rounded-lg">
      <SetMapView center={mapCenter} zoom={selected ? 15 : 13} />
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          eventHandlers={{
            click: () => onSelect(p),
          }}
        >
          <Popup>
            <div className="text-center">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-600">{p.type.replace('_', ' ')}</p>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="mt-2 text-sm text-header font-medium hover:underline"
              >
                View zone status
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
