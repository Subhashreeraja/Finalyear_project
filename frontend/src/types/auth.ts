export type UserRole = 'super_admin' | 'zone_admin' | 'registered_user' | 'guest';

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  zoneId?: string; // for zone_admin
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
