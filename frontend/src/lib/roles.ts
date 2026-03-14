import type { UserRole } from '../types/auth';

/** Can view zone-wise crowd status - all users including Guest */
export function canViewCrowdStatus(): boolean {
  return true;
}

/** Can receive alerts - PUBLIC, SYSTEM_ADMIN, LOCATION_ADMIN (not Guest) */
export function canReceiveAlerts(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['PUBLIC', 'ADMIN', 'SYSTEM_ADMIN', 'MONITOR', 'LOCATION_ADMIN'].includes(role);
}

/** Can access system admin dashboard - full city access */
export function canAccessAdmin(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'SYSTEM_ADMIN';
}

/** Can access location admin dashboard - assigned location only */
export function canAccessLocationAdmin(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'LOCATION_ADMIN' || role === 'MONITOR';
}

/** Can view live CCTV/video feed per zone */
export function canViewVideo(role: UserRole | undefined): boolean {
  return canAccessAdmin(role);
}

/** Can trigger alerts, restrict zones, redirect crowd - Admin only */
export function canTriggerAlerts(role: UserRole | undefined): boolean {
  return canAccessAdmin(role);
}
