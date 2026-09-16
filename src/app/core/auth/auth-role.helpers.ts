import { UserRole } from '../api/models/auth.model';
import { JwtClaims, decodeJwtClaims } from './jwt.helpers';

export const ADMIN_ROLES: readonly UserRole[] = ['ADMIN', 'SYSTEM_ADMIN'];

const ADMIN_ROLE_SET = new Set<string>(ADMIN_ROLES);

export function isAdminRole(role: string | undefined | null): role is UserRole {
  return role !== undefined && role !== null && ADMIN_ROLE_SET.has(role);
}

export function canAccessAdmin(claims: JwtClaims | null): boolean {
  return isAdminRole(claims?.role);
}

export function isTeacherRole(role: string | undefined): boolean {
  return role === 'TEACHER';
}

export function isAccessTokenValid(accessToken: string | null): boolean {
  if (!accessToken) {
    return false;
  }

  const claims = decodeJwtClaims(accessToken);
  if (!claims) {
    return false;
  }

  if (claims.exp !== undefined && claims.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
}
