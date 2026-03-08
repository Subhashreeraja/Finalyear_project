import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import type { AdminOverview, PlaceType } from '../../lib/adminApi';
import { fetchAdminOverview, updateGate } from '../../lib/adminApi';

const PLACE_LABELS: Record<PlaceType, string> = {
  railway_station: 'Railway',
  mall: 'Mall',
  market: 'Market',
  bus_stand: 'Bus Stand',
  temple: 'Temple',
};

export default function AdminGateControlPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPlace, setUpdatingPlace] = useState<PlaceType | null>(null);

  const load = async () => {
    try {
      const ov = await fetchAdminOverview();
      setOverview(ov);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load gate status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGate = async (placeType: PlaceType, action: 'open' | 'close') => {
    setUpdatingPlace(placeType);
    try {
      const res = await updateGate(placeType, action);
      setOverview((prev) => {
        if (!prev?.places) return prev;
        return {
          ...prev,
          places: prev.places.map((p) =>
            p.placeType === res.placeType ? { ...p, gateStatus: res.gateStatus } : p,
          ),
        };
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update gate');
    } finally {
      setUpdatingPlace(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-accent-primary">Gate Control</h1>
      <p className="mt-1 text-sm text-accent-muted">
        Separate gate control for each place. Open or close gates by place type.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && !overview && <p className="mt-4 text-sm text-accent-muted">Loading...</p>}

      {overview?.places && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {overview.places.map((place) => {
            const isOpen = place.gateStatus === 'Open';
            const busy = updatingPlace === place.placeType;
            return (
              <div
                key={place.placeType}
                className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-5"
              >
                <p className="text-lg font-semibold text-accent-primary">
                  {PLACE_LABELS[place.placeType]}
                </p>
                <p className="mt-1 text-sm text-accent-muted">
                  Cameras: {place.totalCameras} • Active: {place.activeCameras} • Crowd:{' '}
                  {place.totalCrowdCount}
                </p>
                <p className={`mt-2 text-base font-semibold ${isOpen ? 'text-green-700' : 'text-red-700'}`}>
                  Gate: {place.gateStatus}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busy || isOpen}
                    onClick={() => handleGate(place.placeType, 'open')}
                    className="flex-1 py-2 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Open Gate
                  </button>
                  <button
                    type="button"
                    disabled={busy || !isOpen}
                    onClick={() => handleGate(place.placeType, 'close')}
                    className="flex-1 py-2 rounded-md text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Close Gate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
