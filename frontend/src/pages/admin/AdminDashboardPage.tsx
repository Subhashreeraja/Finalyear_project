import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import type {
  AdminOverview,
  CrowdStatusResponse,
  PlaceOverview,
  PlaceType,
} from '../../lib/adminApi';
import { fetchAdminOverview, fetchCrowdStatus, updateGate } from '../../lib/adminApi';

const PLACE_LABELS: Record<PlaceType, string> = {
  railway_station: 'Railway',
  mall: 'Mall',
  market: 'Market',
  bus_stand: 'Bus Stand',
  temple: 'Temple',
};
const ALL_PLACE_TYPES: PlaceType[] = [
  'railway_station',
  'mall',
  'market',
  'bus_stand',
  'temple',
];

function statusColor(status: CrowdStatusResponse['status']) {
  if (status === 'Safe') return 'bg-green-100 text-green-700';
  if (status === 'Warning') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [crowd, setCrowd] = useState<CrowdStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceType[]>(() => [...ALL_PLACE_TYPES]);
  const [updatingGate, setUpdatingGate] = useState<PlaceType | null>(null);

  const load = useCallback(async () => {
    try {
      const [ov, cr] = await Promise.all([fetchAdminOverview(), fetchCrowdStatus()]);
      setOverview(ov);
      setCrowd(cr);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    load();
    const interval = setInterval(load, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [load]);

  const togglePlace = (placeType: PlaceType) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeType) ? prev.filter((p) => p !== placeType) : [...prev, placeType],
    );
  };

  const handleGate = async (placeType: PlaceType, action: 'open' | 'close') => {
    setUpdatingGate(placeType);
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
      setUpdatingGate(null);
    }
  };

  const selectedPlaceOverviews =
    overview?.places?.filter((p) => selectedPlaces.includes(p.placeType)) ?? [];
  const selectedTotalCameras = selectedPlaceOverviews.reduce((s, p) => s + p.totalCameras, 0);
  const selectedActiveCameras = selectedPlaceOverviews.reduce((s, p) => s + p.activeCameras, 0);
  const selectedTotalCrowd = selectedPlaceOverviews.reduce((s, p) => s + p.totalCrowdCount, 0);
  const filteredCameras =
    crowd?.cameras?.filter((c) => selectedPlaces.includes(c.placeType)) ?? [];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-accent-primary">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-accent-muted">
        Select places to show. Live overview of cameras, crowd density and gate status per place.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && !overview && <p className="mt-4 text-sm text-accent-muted">Loading...</p>}

      {/* Place selector */}
      {overview && (
        <div className="mt-6">
          <p className="text-sm font-medium text-accent-muted mb-2">Show places</p>
          <div className="flex flex-wrap gap-3">
            {ALL_PLACE_TYPES.map((placeType) => (
              <label
                key={placeType}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPlaces.includes(placeType)}
                  onChange={() => togglePlace(placeType)}
                  className="rounded border-accent-primary text-accent-primary"
                />
                <span className="text-sm font-medium text-accent-primary">
                  {PLACE_LABELS[placeType]}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Summary for selected places */}
      {overview && selectedPlaces.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Cameras (selected)
            </p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">{selectedTotalCameras}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Active Cameras
            </p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">{selectedActiveCameras}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Total Crowd (selected)
            </p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">{selectedTotalCrowd}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Overcrowded
            </p>
            <p className="mt-2 text-lg font-semibold text-accent-primary">
              {overview.overcrowded ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      )}

      {/* Per-place cards with gate control */}
      {overview && selectedPlaces.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-accent-muted uppercase tracking-wide mb-3">
            Per place – stats & gate
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {selectedPlaceOverviews.map((place: PlaceOverview) => {
              const isOpen = place.gateStatus === 'Open';
              const busy = updatingGate === place.placeType;
              return (
                <div
                  key={place.placeType}
                  className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4"
                >
                  <p className="text-base font-semibold text-accent-primary">
                    {PLACE_LABELS[place.placeType]}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-accent-muted">Cameras:</span>
                    <span className="font-medium">{place.totalCameras}</span>
                    <span className="text-accent-muted">Active:</span>
                    <span className="font-medium">{place.activeCameras}</span>
                    <span className="text-accent-muted">Crowd:</span>
                    <span className="font-medium">{place.totalCrowdCount}</span>
                    <span className="text-accent-muted">Gate:</span>
                    <span className={isOpen ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                      {place.gateStatus}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={busy || isOpen}
                      onClick={() => handleGate(place.placeType, 'open')}
                      className="flex-1 py-2 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      disabled={busy || !isOpen}
                      onClick={() => handleGate(place.placeType, 'close')}
                      className="flex-1 py-2 rounded-md text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPlaces.length === 0 && overview && (
        <p className="mt-6 text-accent-muted">Select at least one place above to see stats and gates.</p>
      )}

      {crowd && selectedPlaces.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4 lg:col-span-1">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Overall Crowd (selected)
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-body-light text-accent-primary">
              Total: {crowd.totalCount}
            </div>
            <div
              className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                crowd.status,
              )}`}
            >
              {crowd.status}
            </div>
            {crowd.alert.alertTriggered && (
              <p className="mt-3 text-xs text-red-600">
                Overcrowding alert (threshold {crowd.alert.threshold}). WhatsApp:{' '}
                {crowd.alert.whatsappSent ? 'Yes' : 'No'}.
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4 lg:col-span-2">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Per Camera Crowd (selected places)
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCameras.map((cam) => (
                <div key={cam.id} className="border border-accent-muted/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-accent-primary">{cam.name}</p>
                  <p className="mt-1 text-xs text-accent-muted">People: {cam.peopleCount}</p>
                  <span
                    className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColor(
                      cam.status,
                    )}`}
                  >
                    {cam.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
