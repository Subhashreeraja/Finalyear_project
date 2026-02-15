import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchDistricts, fetchPlacesByDistrict } from '../../lib/locationApi';
import type { District, Place } from '../../types/location';
import PlaceList from '../../components/location/PlaceList';
import PlaceMapView from '../../components/location/PlaceMapView';

export default function LocationDistrictPage() {
  const { districtId } = useParams<{ districtId: string }>();
  const navigate = useNavigate();
  const [district, setDistrict] = useState<District | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!districtId) return;
    Promise.all([fetchDistricts(), fetchPlacesByDistrict(districtId)]).then(([districts, placeList]) => {
      const d = districts.find((x) => x.id === districtId) ?? null;
      setDistrict(d);
      setPlaces(placeList);
      setLoading(false);
    });
  }, [districtId]);

  const handleSelect = (p: Place) => setSelected(p);

  const handleViewZones = () => {
    if (selected) navigate(`/location/place/${selected.id}`);
  };

  const center: [number, number] = district ? [district.lat, district.lng] : [13.0827, 80.2707];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">Loading places...</p>
      </div>
    );
  }

  if (!district) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">District not found.</p>
        <Link to="/location" className="text-header font-medium hover:underline mt-2 inline-block">
          Back to districts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link to="/location" className="text-header font-medium hover:underline">
          Location
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-semibold text-accent-primary">{district.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-accent-primary mb-2">Public places</h1>
      <p className="text-accent-muted mb-6">Select a place to view zone-wise crowd status.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-accent-primary">Places</h2>
          <PlaceList places={places} selectedId={selected?.id ?? null} onSelect={handleSelect} />
          {selected && (
            <button
              type="button"
              onClick={handleViewZones}
              className="mt-2 w-full py-3 px-4 bg-header text-white font-medium rounded-lg hover:bg-header-dark transition-colors"
            >
              View zone status at {selected.name}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-accent-primary">Map</h2>
          <PlaceMapView places={places} selected={selected} onSelect={handleSelect} center={center} />
        </div>
      </div>
    </div>
  );
}
