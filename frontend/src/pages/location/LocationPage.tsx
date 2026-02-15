import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDistricts } from '../../lib/locationApi';
import type { District } from '../../types/location';
import DistrictList from '../../components/location/DistrictList';
import DistrictMapView from '../../components/location/DistrictMapView';

const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

export default function LocationPage() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selected, setSelected] = useState<District | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDistricts().then((data) => {
      setDistricts(data);
      setLoading(false);
    });
  }, []);

  const handleSelect = (d: District) => {
    setSelected(d);
  };

  const handleViewPlaces = () => {
    if (selected) navigate(`/location/district/${selected.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">Loading districts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <h1 className="text-2xl font-bold text-accent-primary mb-2">Location</h1>
      <p className="text-accent-muted mb-6">Select a district to view public places and crowd status.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-accent-primary">Districts</h2>
          <DistrictList districts={districts} selectedId={selected?.id ?? null} onSelect={handleSelect} />
          {selected && (
            <button
              type="button"
              onClick={handleViewPlaces}
              className="mt-2 w-full py-3 px-4 bg-header text-white font-medium rounded-lg hover:bg-header-dark transition-colors"
            >
              View places in {selected.name}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-accent-primary">Map</h2>
          <DistrictMapView
            districts={districts}
            selected={selected}
            onSelect={handleSelect}
            defaultCenter={DEFAULT_CENTER}
          />
        </div>
      </div>
    </div>
  );
}
