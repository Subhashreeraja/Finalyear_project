import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { CrowdStatusResponse } from '../../lib/adminApi';
import { fetchCrowdStatus } from '../../lib/adminApi';

function statusColor(status: CrowdStatusResponse['status']) {
  if (status === 'Safe') return 'bg-green-100 text-green-700';
  if (status === 'Warning') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export default function MonitorDashboardPage() {
  const { user } = useAuth();
  const [crowd, setCrowd] = useState<CrowdStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const placeType = user?.location || 'mall';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const cr = await fetchCrowdStatus();
        if (!mounted) return;
        setCrowd(cr);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load crowd status');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-accent-primary">Location Admin Dashboard</h1>
      <p className="mt-1 text-sm text-accent-muted">
        Assigned location: {placeType.replace('_', ' ')}. Camera feeds and crowd data for your area only.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && !crowd && <p className="mt-4 text-sm text-accent-muted">Loading...</p>}

      {crowd && (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">Overall Status</p>
            <p className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor(crowd.status)}`}>
              {crowd.status}
            </p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">Total: {crowd.totalCount} people</p>
            {crowd.alert.alertTriggered && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                Alert: Crowd exceeds threshold ({crowd.alert.threshold})
              </p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium text-accent-primary mb-3">Cameras by Place Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crowd.cameras.map((cam) => (
                <div key={cam.id} className="bg-white rounded-lg shadow border p-4">
                  <p className="font-medium truncate">{cam.name}</p>
                  <p className="text-sm text-accent-muted capitalize">{cam.placeType?.replace('_', ' ')}</p>
                  <p className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(cam.status)}`}>
                    {cam.status} ({cam.peopleCount})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
