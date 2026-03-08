import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPlace, fetchPlaceStatus } from '../../lib/locationApi';
import type { Place } from '../../types/location';
import type { PlaceCameraStatus } from '../../lib/locationApi';

const PLACE_TYPE_LABELS: Record<Place['type'], string> = {
  railway_station: 'Railway',
  bus_stand: 'Bus Stand',
  temple: 'Temple',
  market: 'Market',
  mall: 'Mall',
};

const STATUS_LABELS = { Safe: 'Safe', Warning: 'Warning', Overcrowded: 'Overcrowded' } as const;
const STATUS_BG = {
  Safe: 'bg-green-100 text-green-800',
  Warning: 'bg-yellow-100 text-yellow-800',
  Overcrowded: 'bg-red-100 text-red-800',
} as const;

interface PlaceAlert {
  id: string;
  type: 'overcrowded' | 'warning' | 'info';
  message: string;
}

function deriveAlerts(
  cameras: PlaceCameraStatus[],
  totalCount: number,
  threshold: number,
): PlaceAlert[] {
  const alerts: PlaceAlert[] = [];
  for (const cam of cameras) {
    if (cam.status === 'Overcrowded') {
      alerts.push({
        id: `overcrowded-${cam.id}`,
        type: 'overcrowded',
        message: `${cam.name} is overcrowded (${cam.peopleCount} people detected). Consider visiting later.`,
      });
    } else if (cam.status === 'Warning') {
      alerts.push({
        id: `warning-${cam.id}`,
        type: 'warning',
        message: `${cam.name} has elevated crowd (${cam.peopleCount} people).`,
      });
    }
  }
  if (totalCount > threshold) {
    alerts.push({
      id: 'threshold',
      type: 'overcrowded',
      message: `Overall crowd (${totalCount}) exceeds threshold (${threshold}). Alert triggered.`,
    });
  }
  return alerts;
}

export default function LocationPlacePage() {
  const { placeId } = useParams<{ placeId: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [placeStatus, setPlaceStatus] = useState<Awaited<ReturnType<typeof fetchPlaceStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    const load = () =>
      Promise.all([fetchPlace(placeId), fetchPlaceStatus(placeId)])
        .then(([p, status]) => {
          if (cancelled) return;
          setPlace(p ?? null);
          setPlaceStatus(status);
          setError(null);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || 'Failed to load place status');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [placeId]);

  const alerts = useMemo(
    () =>
      placeStatus
        ? deriveAlerts(
            placeStatus.cameras,
            placeStatus.totalCount,
            placeStatus.alert.threshold,
          )
        : [],
    [placeStatus],
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">Loading place status...</p>
      </div>
    );
  }

  if (error || !place || !placeStatus) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Place not found'}</p>
        <Link to="/location" className="mt-4 inline-block text-header hover:underline">
          Back to map
        </Link>
      </div>
    );
  }

  const statusKey = placeStatus.status as keyof typeof STATUS_BG;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Link to="/location" className="text-header font-medium hover:underline">
          Location
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-accent-muted">{place.name}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-accent-primary">{place.name}</h1>
          <p className="text-accent-muted mt-1">
            {PLACE_TYPE_LABELS[place.type]} · {placeStatus.cameras.length} cameras · Status & alerts
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera status */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-5">
            <h2 className="text-lg font-semibold text-accent-primary mb-4">Camera status</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div>
                <p className="text-xs text-accent-muted uppercase tracking-wide">Overall status</p>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-sm font-semibold ${STATUS_BG[statusKey]}`}
                >
                  {STATUS_LABELS[placeStatus.status]}
                </span>
              </div>
              <div>
                <p className="text-xs text-accent-muted uppercase tracking-wide">Total people</p>
                <p className="mt-1 font-semibold text-accent-primary">
                  {placeStatus.totalCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-accent-muted uppercase tracking-wide">Cameras</p>
                <p className="mt-1 font-semibold text-accent-primary">{placeStatus.cameras.length}</p>
              </div>
            </div>
            <h3 className="text-sm font-medium text-accent-primary mt-4 mb-2">
              Per-camera status ({placeStatus.cameras.length} cameras)
            </h3>
            <ul className="space-y-3">
              {placeStatus.cameras.map((cam) => (
                <li
                  key={cam.id}
                  className="flex justify-between items-center p-3 bg-body-light rounded-lg border border-accent-muted/20"
                >
                  <span className="font-medium">{cam.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-sm font-medium ${
                      STATUS_BG[cam.status as keyof typeof STATUS_BG]
                    }`}
                  >
                    {STATUS_LABELS[cam.status]}
                  </span>
                  <span className="text-sm text-accent-muted">{cam.peopleCount} people</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-5">
            <h2 className="text-lg font-semibold text-accent-primary mb-4">Alerts & information</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-accent-muted">
                No active alerts. Crowd levels are within normal range.
              </p>
            ) : (
              <ul className="space-y-3">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className={`p-3 rounded-lg border ${
                      a.type === 'overcrowded'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : a.type === 'warning'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <p className="text-sm font-medium">{a.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
