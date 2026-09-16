import { UserRole } from '../api/models/auth.model';
import { JwtClaims } from './jwt.helpers';

const ADMIN_ROLES: ReadonlySet<UserRole> = new Set(['ADMIN', 'SYSTEM_ADMIN']);

export function isAdminRole(role: string | undefined): role is UserRole {
  return role !== undefined && ADMIN_ROLES.has(role as UserRole);
}

export function canAccessAdmin(claims: JwtClaims | null): boolean {
  return isAdminRole(claims?.role);
}

export function isTeacherRole(role: string | undefined): boolean {
  return role === 'TEACHER';
}
