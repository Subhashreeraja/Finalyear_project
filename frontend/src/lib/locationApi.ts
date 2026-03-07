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
    { id: 'd1', name: 'Chennai', lat: 13.0827, lng: 80.2707, placeCount: 5 },
    { id: 'd2', name: 'Salem', lat: 11.6643, lng: 78.1460, placeCount: 5 },
    { id: 'd3', name: 'Coimbatore', lat: 11.0168, lng: 76.9558, placeCount: 5 },
  ];
}

function getMockPlaceById(placeId: string): Place | null {
  const all = Object.values(getMockPlacesByDistrictMap()).flat();
  return all.find((p) => p.id === placeId) ?? null;
}

function getMockPlacesByDistrictMap(): Record<string, Place[]> {
  return {
    d1: [
      { id: 'p1', districtId: 'd1', name: 'Chennai Central Railway Station', type: 'railway_station', lat: 13.0827, lng: 80.2707 },
      { id: 'p2', districtId: 'd1', name: 'Chennai Mofussil Bus Terminus', type: 'bus_stand', lat: 13.0820, lng: 80.2751 },
      { id: 'p3', districtId: 'd1', name: 'Kapaleeshwarar Temple', type: 'temple', lat: 13.0356, lng: 80.2678 },
      { id: 'p4', districtId: 'd1', name: 'T. Nagar Market', type: 'market', lat: 13.0358, lng: 80.2300 },
      { id: 'p5', districtId: 'd1', name: 'Phoenix Mall Velachery', type: 'mall', lat: 12.9850, lng: 80.2200 },
    ],
    d2: [
      { id: 'p6', districtId: 'd2', name: 'Salem Railway Junction', type: 'railway_station', lat: 11.6643, lng: 78.1460 },
      { id: 'p7', districtId: 'd2', name: 'Salem New Bus Stand', type: 'bus_stand', lat: 11.6640, lng: 78.1510 },
      { id: 'p8', districtId: 'd2', name: 'Kottai Mariamman Temple', type: 'temple', lat: 11.6648, lng: 78.1450 },
      { id: 'p9', districtId: 'd2', name: 'Salem Old Market', type: 'market', lat: 11.6580, lng: 78.1420 },
      { id: 'p10', districtId: 'd2', name: 'Salem City Centre Mall', type: 'mall', lat: 11.6700, lng: 78.1480 },
    ],
    d3: [
      { id: 'p11', districtId: 'd3', name: 'Coimbatore Junction Railway', type: 'railway_station', lat: 11.0192, lng: 76.9665 },
      { id: 'p12', districtId: 'd3', name: 'Gandhipuram Bus Stand', type: 'bus_stand', lat: 11.0170, lng: 76.9660 },
      { id: 'p13', districtId: 'd3', name: 'Marudamalai Temple', type: 'temple', lat: 10.9910, lng: 76.9320 },
      { id: 'p14', districtId: 'd3', name: 'Gandhipuram Market', type: 'market', lat: 11.0180, lng: 76.9680 },
      { id: 'p15', districtId: 'd3', name: 'Brookefields Mall', type: 'mall', lat: 11.0290, lng: 77.0380 },
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
