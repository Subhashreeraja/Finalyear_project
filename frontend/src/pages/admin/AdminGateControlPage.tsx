import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import type { AdminOverview } from '../../lib/adminApi';
import { fetchAdminOverview, updateGate } from '../../lib/adminApi';

export default function AdminGateControlPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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

  const handleGate = async (action: 'open' | 'close') => {
    setUpdating(true);
    try {
      const res = await updateGate(action);
      setOverview((prev) => (prev ? { ...prev, gateStatus: res.gateStatus } : prev));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update gate');
    } finally {
      setUpdating(false);
    }
  };

  const isOpen = overview?.gateStatus === 'Open';

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-accent-primary">Gate Control</h1>
      <p className="mt-1 text-sm text-accent-muted">
        Remotely open or close gates based on live crowd status.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && !overview && <p className="mt-4 text-sm text-accent-muted">Loading...</p>}

      {overview && (
        <div className="mt-6 max-w-xl bg-white rounded-xl shadow-md border border-accent-primary/30 p-6">
          <p className="text-sm font-medium text-accent-primary">Current Gate Status</p>
          <p className={`mt-2 text-lg font-semibold ${isOpen ? 'text-green-700' : 'text-red-700'}`}>
            {overview.gateStatus}
          </p>
          <p className="mt-2 text-xs text-accent-muted">
            Total cameras: {overview.totalCameras} • Active: {overview.activeCameras} • Crowd:{' '}
            {overview.totalCrowdCount}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={updating || isOpen}
              onClick={() => handleGate('open')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              Open Gate
            </button>
            <button
              type="button"
              disabled={updating || !isOpen}
              onClick={() => handleGate('close')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              Close Gate
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

