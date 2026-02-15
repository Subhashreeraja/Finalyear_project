import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPlace, fetchZonesByPlace, fetchZoneStatus } from '../../lib/locationApi';
import { canViewVideo, canTriggerAlerts } from '../../lib/roles';
import type { Place, Zone, ZoneStatus } from '../../types/location';
import ZoneMapOverlay from '../../components/location/ZoneMapOverlay';
import CrowdStatusLegend from '../../components/location/CrowdStatusLegend';

const CROWD_LABELS = { low: 'Low', moderate: 'Moderate', high: 'High' } as const;
const CROWD_BG = { low: 'bg-green-100 text-green-800', moderate: 'bg-yellow-100 text-yellow-800', high: 'bg-red-100 text-red-800' } as const;

export default function LocationPlacePage() {
  const { placeId } = useParams<{ placeId: string }>();
  const { user } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [status, setStatus] = useState<ZoneStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placeId) return;
    Promise.all([fetchPlace(placeId), fetchZonesByPlace(placeId), fetchZoneStatus(placeId)])
      .then(([p, zoneList, statusList]) => {
        setPlace(p ?? null);
        setZones(zoneList);
        setStatus(statusList);
      })
      .finally(() => setLoading(false));
  }, [placeId]);

  const placeCenter: [number, number] = place ? [place.lat, place.lng] : [13.0827, 80.2707];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">Loading zone status...</p>
      </div>
    );
  }

  const showAdmin = user && (canViewVideo(user.role) || canTriggerAlerts(user.role));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Link to="/location" className="text-header font-medium hover:underline">
          Location
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-accent-muted">{place?.name ?? 'Place'}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-accent-primary">Zone-based crowd view</h1>
          <p className="text-accent-muted mt-1">{place?.name ?? placeId}</p>
        </div>
        <CrowdStatusLegend />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ZoneMapOverlay zones={zones} placeCenter={placeCenter} placeName={place?.name ?? ''} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-accent-primary">Zone status</h2>
          <ul className="space-y-3">
            {(status.length ? status : zones.map((z) => ({
              zoneId: z.id,
              zoneName: z.name,
              crowdLevel: z.crowdLevel,
              crowdCount: z.crowdCount ?? 0,
              capacity: z.capacity ?? 500,
              updatedAt: '',
            }))).map((s) => (
              <li key={s.zoneId} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{s.zoneName}</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-medium ${CROWD_BG[s.crowdLevel]}`}>
                    {CROWD_LABELS[s.crowdLevel]}
                  </span>
                </div>
                <p className="text-sm text-accent-muted mt-1">
                  {s.crowdCount} / {s.capacity} people
                </p>
              </li>
            ))}
          </ul>
          {showAdmin && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <p className="text-sm font-medium text-accent-primary">Admin</p>
              {canViewVideo(user!.role) && (
                <Link
                  to={`/dashboard?video=place-${placeId}`}
                  className="block w-full py-2 px-4 bg-header/10 text-header rounded-lg hover:bg-header/20 text-sm font-medium"
                >
                  View live video feed
                </Link>
              )}
              {canTriggerAlerts(user!.role) && (
                <button
                  type="button"
                  className="w-full py-2 px-4 border border-header text-header rounded-lg hover:bg-header/10 text-sm font-medium"
                >
                  Trigger alert / Restrict zone
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
