import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleMarker, Popup, Marker } from 'react-leaflet';
import MapContainer from '../../components/location/MapContainer';
import SetMapView from '../../components/location/SetMapView';
import { fetchPlacesByDistrict, fetchCrowdByPlaceType } from '../../lib/locationApi';
import type { CrowdLevel, District, Place } from '../../types/location';

const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

type PlaceType = Place['type'];

/** Map admin status to map crowd level */
function adminStatusToLevel(status: string): CrowdLevel {
  if (status === 'Safe') return 'low';
  if (status === 'Warning') return 'moderate';
  return 'high';
}

interface PlaceCrowdSummary {
  level: CrowdLevel;
  totalCount: number;
  cameraCount: number;
  alertTriggered: boolean;
}

const STATIC_DISTRICTS: District[] = [
  { id: 'd2', name: 'Salem', lat: 11.6643, lng: 78.1460, placeCount: 5 },
];

const CROWD_LIMIT = 100;
const REOPEN_THRESHOLD = 75;

type GateStatus = 'OPEN' | 'CLOSED';

interface DistrictGateState {
  crowd: number;
  gateStatus: GateStatus;
}

const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  railway_station: 'Railway',
  bus_stand: 'Bus Stand',
  temple: 'Temple',
  market: 'Market',
  mall: 'Mall',
};

const CROWD_COLORS: Record<CrowdLevel, { border: string; fill: string; badge: string; label: string }> = {
  low: {
    border: '#16a34a',
    fill: '#22c55e',
    badge: 'bg-green-100 text-green-800',
    label: 'Low crowd',
  },
  moderate: {
    border: '#eab308',
    fill: '#facc15',
    badge: 'bg-yellow-100 text-yellow-800',
    label: 'Moderate crowd',
  },
  high: {
    border: '#dc2626',
    fill: '#f97373',
    badge: 'bg-red-100 text-red-800',
    label: 'High crowd',
  },
};

export default function LocationPage() {
  const navigate = useNavigate();

  const [districts, setDistricts] = useState<District[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [crowdByPlaceType, setCrowdByPlaceType] = useState<Record<PlaceType, PlaceCrowdSummary>>({} as Record<PlaceType, PlaceCrowdSummary>);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const [districtFilter, setDistrictFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<PlaceType[]>([]);
  const [crowdFilter, setCrowdFilter] = useState<CrowdLevel[]>([]);

  const [districtGates, setDistrictGates] = useState<Record<string, DistrictGateState>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ds = STATIC_DISTRICTS;
        if (cancelled) return;
        setDistricts(ds);

        try {
          const placesByDistrict = await Promise.all(
            ds.map((d) =>
              fetchPlacesByDistrict(d.id).catch(() => [] as Place[]),
            ),
          );
          if (cancelled) return;
          const allPlaces = placesByDistrict.flat();
          setPlaces(allPlaces);
        } catch {
          if (!cancelled) {
            setPlaces([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchCrowdByPlaceType()
        .then((data) => {
          if (cancelled) return;
          const summaries = {} as Record<PlaceType, PlaceCrowdSummary>;
          for (const [pt, d] of Object.entries(data)) {
            summaries[pt as PlaceType] = {
              level: adminStatusToLevel(d.status),
              totalCount: d.totalCount,
              cameraCount: d.cameraCount,
              alertTriggered: d.alertTriggered,
            };
          }
          setCrowdByPlaceType(summaries);
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Compute per-district crowd and gate status with hysteresis
  useEffect(() => {
    if (!districts.length) return;
    setDistrictGates((prev) => {
      const next: Record<string, DistrictGateState> = {};
      for (const d of districts) {
        const placeTypesInDistrict = new Set(
          places.filter((p) => p.districtId === d.id).map((p) => p.type),
        );
        let crowd = 0;
        placeTypesInDistrict.forEach((pt) => {
          const summary = crowdByPlaceType[pt];
          if (summary) {
            crowd += summary.totalCount;
          }
        });

        const prevGate = prev[d.id]?.gateStatus ?? 'OPEN';
        let gate: GateStatus = prevGate;
        if (prevGate === 'CLOSED') {
          gate = crowd <= REOPEN_THRESHOLD ? 'OPEN' : 'CLOSED';
        } else {
          gate = crowd > CROWD_LIMIT ? 'CLOSED' : 'OPEN';
        }

        next[d.id] = { crowd, gateStatus: gate };
      }
      return next;
    });
  }, [districts, places, crowdByPlaceType]);

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === (selectedDistrictId ?? selectedPlace?.districtId)) ?? null,
    [districts, selectedDistrictId, selectedPlace],
  );

  const defaultDistrictId = useMemo(
    () => districts.find((d) => d.name.toLowerCase() === 'salem')?.id ?? null,
    [districts],
  );

  const searchQuery = useMemo(() => search.trim().toLowerCase(), [search]);

  const activeDistrictIds = useMemo(() => {
    if (districtFilter.length) return districtFilter;
    if (selectedDistrict) return [selectedDistrict.id];
    return districts.map((d) => d.id);
  }, [districtFilter, selectedDistrict, districts]);

  // When user types a district or place name, auto-focus that location.
  useEffect(() => {
    if (!searchQuery) {
      setSearchError(null);
      return;
    }
    // 1) District name contains query → focus that district.
    const districtMatch = districts.find((d) =>
      d.name.toLowerCase().includes(searchQuery),
    );
    if (districtMatch) {
      setSelectedDistrictId(districtMatch.id);
      setSelectedPlaceId(null);
      setDistrictFilter([districtMatch.id]);
      setSearchError(null);
      return;
    }

    // 2) Place name contains query (search across all places).
    const placeMatch = places.find((p) =>
      p.name.toLowerCase().includes(searchQuery),
    );
    if (!placeMatch) {
      setSearchError('District not found');
      return;
    }

    setSelectedPlaceId(placeMatch.id);
    setSelectedDistrictId(placeMatch.districtId);
    setDistrictFilter([placeMatch.districtId]);
    setSearchError(null);
  }, [searchQuery, districts, places, selectedDistrictId, defaultDistrictId]);

  const filteredPlaces = useMemo(() => {
    if (!places.length) return [];

    return places.filter((p) => {
      const isSelected = selectedPlaceId === p.id;

      const matchesDistrict = activeDistrictIds.includes(p.districtId);

      const matchesType = typeFilter.length ? typeFilter.includes(p.type) : true;

      const summary = crowdByPlaceType[p.type];
      const level = summary?.level;
      const matchesCrowd = crowdFilter.length ? (level ? crowdFilter.includes(level) : false) : true;

      const districtName = districts.find((d) => d.id === p.districtId)?.name ?? '';
      const typeLabel = PLACE_TYPE_LABELS[p.type];
      const matchesSearch = searchQuery
        ? p.name.toLowerCase().includes(searchQuery) ||
          districtName.toLowerCase().includes(searchQuery) ||
          typeLabel.toLowerCase().includes(searchQuery)
        : true;

      if (isSelected) return true;
      return matchesDistrict && matchesType && matchesCrowd && matchesSearch;
    });
  }, [places, selectedPlaceId, activeDistrictIds, typeFilter, crowdByPlaceType, crowdFilter, districts, searchQuery]);

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedPlace) return [selectedPlace.lat, selectedPlace.lng];
    if (selectedDistrict) return [selectedDistrict.lat, selectedDistrict.lng];
    return DEFAULT_CENTER;
  }, [selectedPlace, selectedDistrict]);

  const mapZoom = selectedPlace ? 15 : selectedDistrict ? 12 : 11;

  const toggleDistrictFilter = (id: string) => {
    setDistrictFilter((prev) => {
      const already = prev.includes(id);
      const next = already ? prev.filter((x) => x !== id) : [id];
      setSelectedDistrictId(already ? null : id);
      if (already) {
        setSelectedPlaceId(null);
      }
      return next;
    });
  };

  const toggleTypeFilter = (type: PlaceType) => {
    setTypeFilter((prev) => {
      const next = prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type];

      // When exactly one type is selected, auto-focus a popular Salem place of that type.
      if (next.length === 1) {
        const selectedType = next[0];
        const salemDistrict = districts.find((d) => d.name.toLowerCase() === 'salem');
        if (salemDistrict) {
          const popularPlace = places.find(
            (p) => p.type === selectedType && p.districtId === salemDistrict.id,
          );
          if (popularPlace) {
            setSelectedPlaceId(popularPlace.id);
            setSelectedDistrictId(salemDistrict.id);
            setDistrictFilter([salemDistrict.id]);
          }
        }
      }

      return next;
    });
  };

  const toggleCrowdFilter = (level: CrowdLevel) => {
    setCrowdFilter((prev) => (prev.includes(level) ? prev.filter((x) => x !== level) : [...prev, level]));
  };

  const handleMarkerClick = (place: Place) => {
    setSelectedPlaceId(place.id);
    setSelectedDistrictId(place.districtId);
  };

  const handleViewCrowdStatus = (placeId: string) => {
    navigate(`/location/place/${placeId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-accent-muted">Loading smart location view...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold text-accent-primary">Smart city map</h1>
        <p className="text-accent-muted text-sm sm:text-base">
          Search any district, place, or landmark and explore live crowd status on the city map.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-4 sm:p-5 space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wide text-accent-muted mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search district, place, or landmark..."
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-purple-100 bg-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-header focus:border-transparent text-sm"
                  aria-label="Search district, place, or landmark"
                />
              </div>
              {searchError && (
                <p className="mt-2 text-xs text-red-600">{searchError}</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-muted">Filters</p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-accent-primary/80">Districts</p>
                <div className="flex flex-wrap gap-2">
                  {districts.map((d) => {
                    const active = districtFilter.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDistrictFilter(d.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-header text-white border-header shadow-sm'
                            : 'bg-white text-accent-primary border-purple-100 hover:bg-body'
                        }`}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-accent-primary/80">Place type</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(PLACE_TYPE_LABELS) as [PlaceType, string][]).map(([type, label]) => {
                    const active = typeFilter.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-header/10 text-header border-header/60'
                            : 'bg-white text-accent-primary border-purple-100 hover:bg-body'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-accent-primary/80">Crowd level</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(CROWD_COLORS) as [CrowdLevel, (typeof CROWD_COLORS)[CrowdLevel]][]).map(
                    ([level, { badge, label }]) => {
                      const active = crowdFilter.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleCrowdFilter(level)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? `bg-white border-transparent ${badge}`
                              : 'bg-white text-accent-primary border-purple-100 hover:bg-body'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              level === 'low' ? 'bg-green-500' : level === 'moderate' ? 'bg-yellow-400' : 'bg-red-500'
                            }`}
                          />
                          <span>{label}</span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-4 sm:p-5 min-h-[140px]">
              {selectedPlace ? (
              <SelectedPlaceInfoCard
                place={selectedPlace}
                district={selectedDistrict ?? undefined}
                summary={crowdByPlaceType[selectedPlace.type]}
                onViewZones={() => handleViewCrowdStatus(selectedPlace.id)}
              />
            ) : (
              <div className="h-full flex flex-col items-start justify-center gap-2 text-left">
                <p className="text-sm font-semibold text-accent-primary">No place selected</p>
                <p className="text-xs text-accent-muted">
                  Start typing in the search bar or tap any marker on the map to view detailed crowd information.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-purple-100 h-[420px] sm:h-[480px] lg:h-[560px] overflow-hidden">
            <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full rounded-2xl">
              <SetMapView center={mapCenter} zoom={mapZoom} />
              {districts.map((d) => {
                const gate = districtGates[d.id];
                const crowd = gate?.crowd ?? 0;
                const gateStatus = gate?.gateStatus ?? 'OPEN';
                return (
                  <Marker
                    key={d.id}
                    position={[d.lat, d.lng]}
                    eventHandlers={{
                      click: () => setSelectedDistrictId(d.id),
                    }}
                  >
                    <Popup>
                      <div className="space-y-1 text-left">
                        <p className="text-sm font-semibold text-accent-primary">{d.name}</p>
                        <p className="text-xs text-accent-muted">
                          Crowd: {crowd.toLocaleString()}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            gateStatus === 'OPEN' ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          Gate: {gateStatus}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              {filteredPlaces.map((p) => {
                const summary = crowdByPlaceType[p.type];
                const level = summary?.level ?? 'low';
                const colors = CROWD_COLORS[level];

                return (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat, p.lng]}
                    radius={10}
                    pathOptions={{ color: colors.border, fillColor: colors.fill, fillOpacity: 0.9, weight: 2 }}
                    eventHandlers={{
                      click: () => handleMarkerClick(p),
                    }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-accent-primary">{p.name}</p>
                        <p className="text-xs text-accent-muted">{PLACE_TYPE_LABELS[p.type]}</p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CROWD_COLORS[level].badge}`}>
                            {CROWD_COLORS[level].label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewCrowdStatus(p.id)}
                          className="mt-2 w-full text-xs font-semibold text-header hover:underline"
                        >
                          View status & alerts
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SelectedPlaceInfoCardProps {
  place: Place;
  district?: District;
  summary?: PlaceCrowdSummary;
  onViewZones: () => void;
}

function SelectedPlaceInfoCard({ place, district, summary, onViewZones }: SelectedPlaceInfoCardProps) {
  const level = summary?.level ?? 'low';
  const colors = CROWD_COLORS[level];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-accent-primary">{place.name}</p>
          {district && (
            <p className="text-xs text-accent-muted mt-0.5">
              {district.name} · {PLACE_TYPE_LABELS[place.type]}
            </p>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors.badge}`}>
          {colors.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex flex-col">
          <span className="text-accent-muted">People count</span>
          <span className="font-semibold text-accent-primary">
            {summary ? `${summary.totalCount.toLocaleString()} people` : 'Loading...'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-accent-muted">Cameras</span>
          <span className="font-semibold text-accent-primary">
            {summary ? `${summary.cameraCount} cameras` : '—'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewZones}
        className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-header text-white text-xs font-semibold hover:bg-header-dark transition-colors"
      >
        View status & alerts
      </button>
    </div>
  );
}
