import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import type { CrowdStatusResponse } from '../../lib/adminApi';
import { fetchCrowdStatus } from '../../lib/adminApi';

interface AlertItem {
  id: string;
  timestamp: string;
  message: string;
}

export default function AdminAlertsPage() {
  const [crowd, setCrowd] = useState<CrowdStatusResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let lastAlertTriggered = false;

    const load = async () => {
      try {
        const cr = await fetchCrowdStatus();
        setCrowd(cr);
        if (cr.alert.alertTriggered && !lastAlertTriggered) {
          const ts = new Date().toISOString();
          setAlerts((prev) => [
            {
              id: ts,
              timestamp: ts,
              message: `Overcrowding detected. Total count ${cr.totalCount} exceeded threshold ${cr.alert.threshold}. WhatsApp sent: ${
                cr.alert.whatsappSent ? 'Yes' : 'No / Not configured'
              }.`,
            },
            ...prev,
          ]);
        }
        lastAlertTriggered = cr.alert.alertTriggered;
      } catch (err: any) {
        setError(err.message || 'Failed to load alerts');
      }
    };

    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-accent-primary">Alerts</h1>
      <p className="mt-1 text-sm text-accent-muted">
        Overcrowding alerts triggered from the crowd monitoring system.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
          <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
            Alert History
          </p>
          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-accent-muted">No alerts generated yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="border border-accent-muted/20 rounded-lg px-3 py-2 bg-body-light"
                >
                  <p className="text-xs text-accent-muted">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-accent-primary">{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-md border border-accent-primary/30 p-4">
          <p className="text-xs font-medium text-accent-muted uppercase tracking-wide">
            Current Status
          </p>
          {crowd ? (
            <>
              <p className="mt-3 text-sm text-accent-primary">
                Total Count:{' '}
                <span className="font-semibold text-accent-primary">{crowd.totalCount}</span>
              </p>
              <p className="mt-1 text-sm text-accent-primary">
                Status:{' '}
                <span
                  className={`font-semibold ${
                    crowd.status === 'Overcrowded'
                      ? 'text-red-700'
                      : crowd.status === 'Warning'
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}
                >
                  {crowd.status}
                </span>
              </p>
              <p className="mt-2 text-xs text-accent-muted">
                Threshold: {crowd.alert.threshold} • Alert triggered:{' '}
                {crowd.alert.alertTriggered ? 'Yes' : 'No'} • WhatsApp sent:{' '}
                {crowd.alert.whatsappSent ? 'Yes' : 'No / Not configured'}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-accent-muted">Loading current status...</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

