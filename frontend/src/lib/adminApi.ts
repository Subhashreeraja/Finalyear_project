export interface AdminInfo {
  email: string;
  name: string;
  role: 'admin';
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminInfo;
}

export interface PlaceOverview {
  placeType: PlaceType;
  totalCameras: number;
  activeCameras: number;
  totalCrowdCount: number;
  gateStatus: 'Open' | 'Closed';
}

export interface AdminOverview {
  totalCameras: number;
  activeCameras: number;
  totalCrowdCount: number;
  overcrowded: boolean;
  gateStatus: 'Open' | 'Closed';
  places: PlaceOverview[];
}

export type PlaceType = 'railway_station' | 'mall' | 'market' | 'bus_stand' | 'temple';

export interface AdminCamera {
  id: number;
  name: string;
  video: string;
  placeType: PlaceType;
}

export type CrowdStatusLevel = 'Safe' | 'Warning' | 'Overcrowded';

export interface CameraCrowdStatus {
  id: number;
  name: string;
  peopleCount: number;
  status: CrowdStatusLevel;
  placeType: PlaceType;
}

export interface CrowdStatusResponse {
  cameras: CameraCrowdStatus[];
  totalCount: number;
  status: CrowdStatusLevel;
  alert: {
    threshold: number;
    alertTriggered: boolean;
    whatsappSent: boolean | null;
  };
}

const ADMIN_TOKEN_KEY = 'crowdai_admin_token';
const ADMIN_INFO_KEY = 'crowdai_admin_info';
const AUTH_TOKEN_KEY = 'crowdai_token';
const AUTH_USER_KEY = 'crowdai_user';

export function getAdminToken(): string | null {
  const legacy = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (legacy) return legacy;
  const userRaw = localStorage.getItem(AUTH_USER_KEY);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!userRaw || !token) return null;
  try {
    const user = JSON.parse(userRaw) as { role?: string };
    if (['ADMIN', 'SYSTEM_ADMIN'].includes(user.role ?? '')) return token;
  } catch {
    /* ignore */
  }
  return null;
}

/** Token for dashboard/alerts - ADMIN, MONITOR, or PUBLIC */
export function getAuthToken(): string | null {
  const admin = getAdminToken();
  if (admin) return admin;
  const userRaw = localStorage.getItem(AUTH_USER_KEY);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!userRaw || !token) return null;
  try {
    const user = JSON.parse(userRaw) as { role?: string };
    if (['ADMIN', 'SYSTEM_ADMIN', 'MONITOR', 'LOCATION_ADMIN', 'PUBLIC'].includes(user.role ?? '')) return token;
  } catch {
    /* ignore */
  }
  return null;
}

export function setAdminSession(resp: AdminLoginResponse) {
  localStorage.setItem(ADMIN_TOKEN_KEY, resp.token);
  localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(resp.admin));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_INFO_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getAdminInfo(): AdminInfo | null {
  const legacy = localStorage.getItem(ADMIN_INFO_KEY);
  if (legacy) {
    try {
      return JSON.parse(legacy) as AdminInfo;
    } catch {
      /* ignore */
    }
  }
  const userRaw = localStorage.getItem(AUTH_USER_KEY);
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw) as { email?: string; name?: string; role?: string };
    if (['ADMIN', 'SYSTEM_ADMIN'].includes(user.role ?? ''))
      return { email: user.email ?? '', name: user.name ?? '', role: 'admin' };
  } catch {
    /* ignore */
  }
  return null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, useAuthToken = false): Promise<T> {
  const token = useAuthToken ? getAuthToken() : getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    if (useAuthToken) {
      clearAdminSession();
      window.location.href = '/';
    } else {
      clearAdminSession();
      window.location.href = '/admin/login';
    }
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export function adminLogout() {
  clearAdminSession();
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return apiFetch<AdminOverview>('/overview', {}, true);
}

export async function fetchAdminCameras(): Promise<AdminCamera[]> {
  return apiFetch<AdminCamera[]>('/cameras');
}

export async function fetchCrowdStatus(): Promise<CrowdStatusResponse> {
  return apiFetch<CrowdStatusResponse>('/crowd-status', {}, true);
}

export async function updateGate(
  placeType: PlaceType,
  action: 'open' | 'close',
): Promise<{ placeType: PlaceType; gateStatus: 'Open' | 'Closed' }> {
  return apiFetch<{ placeType: PlaceType; gateStatus: 'Open' | 'Closed' }>('/gate-control', {
    method: 'POST',
    body: JSON.stringify({ placeType, action }),
  });
}

