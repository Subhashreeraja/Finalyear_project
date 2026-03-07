export interface AdminInfo {
  email: string;
  name: string;
  role: 'admin';
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminInfo;
}

export interface AdminOverview {
  totalCameras: number;
  activeCameras: number;
  totalCrowdCount: number;
  overcrowded: boolean;
  gateStatus: 'Open' | 'Closed';
}

export interface AdminCamera {
  id: number;
  name: string;
  video: string;
}

export type CrowdStatusLevel = 'Safe' | 'Warning' | 'Overcrowded';

export interface CameraCrowdStatus {
  id: number;
  name: string;
  peopleCount: number;
  status: CrowdStatusLevel;
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

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminSession(resp: AdminLoginResponse) {
  localStorage.setItem(ADMIN_TOKEN_KEY, resp.token);
  localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(resp.admin));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_INFO_KEY);
}

export function getAdminInfo(): AdminInfo | null {
  const raw = localStorage.getItem(ADMIN_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminInfo;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
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
    clearAdminSession();
    window.location.href = '/admin/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Invalid credentials');
  }
  const data = (await res.json()) as AdminLoginResponse;
  setAdminSession(data);
  return data;
}

export function adminLogout() {
  clearAdminSession();
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return apiFetch<AdminOverview>('/overview');
}

export async function fetchAdminCameras(): Promise<AdminCamera[]> {
  return apiFetch<AdminCamera[]>('/cameras');
}

export async function fetchCrowdStatus(): Promise<CrowdStatusResponse> {
  return apiFetch<CrowdStatusResponse>('/crowd-status');
}

export async function updateGate(action: 'open' | 'close'): Promise<{ gateStatus: 'Open' | 'Closed' }> {
  return apiFetch<{ gateStatus: 'Open' | 'Closed' }>('/gate-control', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

