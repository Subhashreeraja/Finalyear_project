import type { District, Place, Zone, ZoneStatus } from '../types/location';

const API_BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchDistricts(): Promise<District[]> {
  try {
    return await fetchJson<District[]>(`${API_BASE}/districts`);
  } catch {
    return getMockDistricts();
  }
}

export async function fetchPlacesByDistrict(districtId: string): Promise<Place[]> {
  try {
    return await fetchJson<Place[]>(`${API_BASE}/districts/${districtId}/places`);
  } catch {
    return getMockPlaces(districtId);
  }
}

export async function fetchPlace(placeId: string): Promise<Place | null> {
  try {
    return await fetchJson<Place | null>(`${API_BASE}/places/${placeId}`);
  } catch {
    return getMockPlaceById(placeId);
  }
}

export async function fetchZonesByPlace(placeId: string): Promise<Zone[]> {
  try {
    return await fetchJson<Zone[]>(`${API_BASE}/places/${placeId}/zones`);
  } catch {
    return getMockZones(placeId);
  }
}

export async function fetchZoneStatus(placeId: string): Promise<ZoneStatus[]> {
  try {
    return await fetchJson<ZoneStatus[]>(`${API_BASE}/places/${placeId}/zones/status`);
  } catch {
    return getMockZoneStatus(placeId);
  }
}

// --- Mock data for development / when backend is not available ---

function getMockDistricts(): District[] {
  return [
    { id: 'd1', name: 'Central District', lat: 13.0827, lng: 80.2707, placeCount: 5 },
    { id: 'd2', name: 'North District', lat: 13.0878, lng: 80.2085, placeCount: 4 },
    { id: 'd3', name: 'South District', lat: 13.0150, lng: 80.2592, placeCount: 6 },
  ];
}

function getMockPlaceById(placeId: string): Place | null {
  const all = Object.values(getMockPlacesByDistrictMap()).flat();
  return all.find((p) => p.id === placeId) ?? null;
}

function getMockPlacesByDistrictMap(): Record<string, Place[]> {
  return {
    d1: [
      { id: 'p1', districtId: 'd1', name: 'Central Railway Station', type: 'railway_station', lat: 13.0827, lng: 80.2707 },
      { id: 'p2', districtId: 'd1', name: 'City Bus Stand', type: 'bus_stand', lat: 13.0819, lng: 80.2751 },
      { id: 'p3', districtId: 'd1', name: 'Main Market', type: 'market', lat: 13.0845, lng: 80.2680 },
    ],
    d2: [
      { id: 'p4', districtId: 'd2', name: 'North Railway Station', type: 'railway_station', lat: 13.0878, lng: 80.2085 },
      { id: 'p5', districtId: 'd2', name: 'Temple Square', type: 'temple', lat: 13.0900, lng: 80.2100 },
    ],
    d3: [
      { id: 'p6', districtId: 'd3', name: 'South Bus Stand', type: 'bus_stand', lat: 13.0150, lng: 80.2592 },
      { id: 'p7', districtId: 'd3', name: 'Event Ground', type: 'event_ground', lat: 13.0180, lng: 80.2610 },
    ],
  };
}

function getMockPlaces(districtId: string): Place[] {
  return getMockPlacesByDistrictMap()[districtId] ?? [];
}

function getMockZones(placeId: string): Zone[] {
  const place = getMockPlaceById(placeId);
  const base = place ? { lat: place.lat, lng: place.lng } : { lat: 13.0827, lng: 80.2707 };
  const d = 0.002;
  return [
    {
      id: 'z1', placeId, name: 'Zone 1', order: 1,
      polygon: [[base.lat - d, base.lng - d], [base.lat + d, base.lng - d], [base.lat + d, base.lng], [base.lat - d, base.lng]],
      crowdLevel: 'low', crowdCount: 50, capacity: 500,
    },
    {
      id: 'z2', placeId, name: 'Zone 2', order: 2,
      polygon: [[base.lat - d, base.lng], [base.lat + d, base.lng], [base.lat + d, base.lng + d], [base.lat - d, base.lng + d]],
      crowdLevel: 'moderate', crowdCount: 320, capacity: 500,
    },
    {
      id: 'z3', placeId, name: 'Zone 3', order: 3,
      polygon: [[base.lat, base.lng - d], [base.lat + d * 1.5, base.lng - d], [base.lat + d * 1.5, base.lng + d], [base.lat, base.lng + d]],
      crowdLevel: 'high', crowdCount: 480, capacity: 500,
    },
  ];
}

function getMockZoneStatus(placeId: string): ZoneStatus[] {
  const zones = getMockZones(placeId);
  return zones.map((z) => ({
    zoneId: z.id,
    zoneName: z.name,
    crowdLevel: z.crowdLevel,
    crowdCount: z.crowdCount ?? 0,
    capacity: z.capacity ?? 500,
    updatedAt: new Date().toISOString(),
  }));
}
