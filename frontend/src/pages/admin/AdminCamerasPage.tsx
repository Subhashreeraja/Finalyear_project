import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import type {
  AdminCamera,
  CameraCrowdStatus,
  CrowdStatusResponse,
  PlaceType,
} from "../../lib/adminApi";
import {
  fetchAdminCameras,
  fetchCrowdStatus,
} from "../../lib/adminApi";

const PLACE_OPTIONS: { value: PlaceType; label: string }[] = [
  { value: "railway_station", label: "Railway" },
  { value: "mall", label: "Mall" },
  { value: "market", label: "Market" },
  { value: "bus_stand", label: "Bus Stand" },
  { value: "temple", label: "Temple" },
];

function badgeColor(status: CameraCrowdStatus["status"]) {
  if (status === "Safe") return "bg-green-100 text-green-700";
  if (status === "Warning") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function AdminCamerasPage() {
  const [cameras, setCameras] = useState<AdminCamera[]>([]);
  const [crowd, setCrowd] = useState<CrowdStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceType | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [cams, cr] = await Promise.all([
          fetchAdminCameras(),
          fetchCrowdStatus(),
        ]);

        if (!mounted) return;

        setCameras(cams);
        setCrowd(cr);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to load cameras");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const interval = setInterval(load, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* Map camera ID → status */
  const cameraStatusMap = new Map<number, CameraCrowdStatus>();
  crowd?.cameras.forEach((c) => cameraStatusMap.set(c.id, c));

  const filteredCameras = selectedPlace
    ? cameras.filter((cam) => cam.placeType === selectedPlace)
    : [];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-accent-primary">
        Camera Monitoring
      </h1>

      <p className="mt-1 text-sm text-accent-muted">
        Select a place type to view its cameras. Live streams with real-time people counts.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-sm font-medium text-accent-muted self-center mr-1">Place:</span>
        {PLACE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelectedPlace(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPlace === value
                ? "bg-accent-primary text-white shadow-md"
                : "bg-white border border-accent-primary/40 text-accent-primary hover:bg-accent-primary/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && !cameras.length && (
        <p className="mt-4 text-sm text-accent-muted">Loading...</p>
      )}

      {!loading && cameras.length > 0 && !selectedPlace && (
        <p className="mt-6 text-accent-muted">Select a place above to view its cameras.</p>
      )}

      {selectedPlace && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCameras.map((cam) => {
          const status = cameraStatusMap.get(cam.id);

          return (
            <div
              key={cam.id}
              className="bg-white rounded-xl shadow-md border border-accent-primary/30 overflow-hidden flex flex-col"
            >
              {/* HEADER */}
              <div className="px-4 py-3 border-b border-accent-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent-primary">
                    {cam.name}
                  </p>

                  <p className="text-xs text-accent-muted">
                    Source: {cam.video}
                  </p>
                </div>

                {status && (
                  <div className="text-right">
                    <p className="text-xs text-accent-muted">
                      People: {status.peopleCount}
                    </p>

                    <span
                      className={`mt-1 inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${badgeColor(
                        status.status
                      )}`}
                    >
                      {status.status}
                    </span>
                  </div>
                )}
              </div>

              {/* VIDEO STREAM */}
              <div className="bg-black/80 flex-1 flex items-center justify-center">
                <img
                  src={`http://localhost:5000/api/admin/stream/${cam.id}`}
                  alt={cam.name}
                  className="w-full h-56 object-cover"
                />
              </div>
            </div>
          );
        })}
        </div>
      )}
    </AdminLayout>
  );
}