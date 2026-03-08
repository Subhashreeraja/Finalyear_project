import type { District, Place, Zone, ZoneStatus } from '../types/location';

const API_BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchDistricts(): Promise<District[]> {
  return fetchJson<District[]>(`${API_BASE}/districts`);
}

export async function fetchPlacesByDistrict(districtId: string): Promise<Place[]> {
  return fetchJson<Place[]>(`${API_BASE}/districts/${districtId}/places`);
}

export async function fetchPlace(placeId: string): Promise<Place | null> {
  return fetchJson<Place | null>(`${API_BASE}/places/${placeId}`);
}

export async function fetchZonesByPlace(placeId: string): Promise<Zone[]> {
  return fetchJson<Zone[]>(`${API_BASE}/places/${placeId}/zones`);
}

export async function fetchZoneStatus(placeId: string): Promise<ZoneStatus[]> {
  return fetchJson<ZoneStatus[]>(`${API_BASE}/places/${placeId}/zones/status`);
}

/** Real camera status for a place (from admin camera service). */
export interface PlaceCameraStatus {
  id: number;
  name: string;
  peopleCount: number;
  status: 'Safe' | 'Warning' | 'Overcrowded';
}

export interface PlaceStatusResponse {
  place: Place;
  cameras: PlaceCameraStatus[];
  totalCount: number;
  status: 'Safe' | 'Warning' | 'Overcrowded';
  alert: {
    threshold: number;
    alertTriggered: boolean;
  };
}

export async function fetchPlaceStatus(placeId: string): Promise<PlaceStatusResponse> {
  return fetchJson<PlaceStatusResponse>(`${API_BASE}/places/${placeId}/status`);
}

export interface CrowdByPlaceType {
  [placeType: string]: {
    totalCount: number;
    status: 'Safe' | 'Warning' | 'Overcrowded';
    cameraCount: number;
    alertTriggered: boolean;
  };
}

export async function fetchCrowdByPlaceType(): Promise<CrowdByPlaceType> {
  return fetchJson<CrowdByPlaceType>(`${API_BASE}/crowd-by-place-type`);
}
