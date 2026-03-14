export type UserRole = 'SYSTEM_ADMIN' | 'LOCATION_ADMIN' | 'ADMIN' | 'MONITOR' | 'PUBLIC' | 'GUEST';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  location?: string;  // for LOCATION_ADMIN - assigned place_type (mall, temple, etc.)
  verified?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AUTH_TOKEN_KEY = 'crowdai_token';
export const AUTH_USER_KEY = 'crowdai_user';
