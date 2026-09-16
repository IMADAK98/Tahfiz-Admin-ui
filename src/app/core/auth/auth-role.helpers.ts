import { UserRole } from '../api/models/auth.model';
import { decodeJwtClaims } from './jwt.helpers';

export const ADMIN_ROLES: readonly UserRole[] = ['ADMIN', 'SYSTEM_ADMIN'];

export function isAdminRole(role: string | undefined | null): role is UserRole {
  return role === 'ADMIN' || role === 'SYSTEM_ADMIN';
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
