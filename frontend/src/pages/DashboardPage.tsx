import { useEffect, useState } from 'react';
import type { AdminOverview, CrowdStatusResponse } from '../lib/adminApi';
import { fetchAdminOverview, fetchCrowdStatus } from '../lib/adminApi';

function statusColor(status: CrowdStatusResponse['status']) {
  if (status === 'Safe') return 'bg-green-100 text-green-700';
  if (status === 'Warning') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [crowd, setCrowd] = useState<CrowdStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [ov, cr] = await Promise.all([fetchAdminOverview(), fetchCrowdStatus()]);
        if (!mounted) return;
        setOverview(ov);
        setCrowd(cr);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
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
      <h1 className="text-2xl font-semibold text-accent-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-accent-muted">
        Live overview of cameras, crowd density and gate status.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && !overview && <p className="mt-4 text-sm text-accent-muted">Loading...</p>}

      {overview && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">Total Cameras</p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">{overview.totalCameras}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">Active Cameras</p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">{overview.activeCameras}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">Total Crowd Count</p>
            <p className="mt-2 text-2xl font-semibold text-accent-primary">{overview.totalCrowdCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">Gate Status</p>
            <p className="mt-2 text-lg font-semibold text-accent-primary">{overview.gateStatus}</p>
          </div>
        </div>
      )}

      {crowd && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4 lg:col-span-1">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Overall Crowd Status
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-body-light text-accent-primary">
              Total: {crowd.totalCount}
            </div>
            <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColor(crowd.status)}`}>
              {crowd.status}
            </div>
            {crowd.alert.alertTriggered && (
              <p className="mt-3 text-xs text-red-600">
                Overcrowding alert triggered (threshold {crowd.alert.threshold}). WhatsApp sent:{' '}
                {crowd.alert.whatsappSent ? 'Yes' : 'No / Not configured'}.
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4 lg:col-span-2">
            <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
              Per Camera Crowd
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {crowd.cameras.map((cam) => (
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
    </div>
  );
}
