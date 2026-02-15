import type { UserRole } from '../types/auth';

/** Can view zone-wise crowd status (all roles) */
export function canViewCrowdStatus(): boolean {
  return true;
}

/** Can receive alerts (SMS, WhatsApp, in-app) - Registered and Admin */
export function canReceiveAlerts(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'registered_user' || role === 'super_admin' || role === 'zone_admin';
}

/** Can access admin dashboard and live video - Admin only */
export function canAccessAdmin(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'zone_admin';
}

/** Can view live CCTV/video feed per zone */
export function canViewVideo(role: UserRole | undefined): boolean {
  return canAccessAdmin(role);
}

/** Can trigger alerts, restrict zones, redirect crowd */
export function canTriggerAlerts(role: UserRole | undefined): boolean {
  return canAccessAdmin(role);
}
