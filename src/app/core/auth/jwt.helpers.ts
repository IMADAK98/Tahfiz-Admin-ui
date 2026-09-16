import { UserRole } from '../api/models/auth.model';

export interface JwtClaims {
  role?: UserRole | string;
  userId?: number;
  centerId?: number;
  sub?: string;
  exp?: number;
}

export function decodeJwtClaims(accessToken: string): JwtClaims | null {
  try {
    const segment = accessToken.split('.')[1];
    if (!segment) {
      return null;
    }

    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    const payload = JSON.parse(json) as Record<string, unknown>;

    const userId = coerceNumber(payload['userId']) ?? coerceNumber(payload['sub']);
    const centerId = coerceNumber(payload['centerId']);

    return {
      role: typeof payload['role'] === 'string' ? payload['role'] : undefined,
      userId,
      centerId,
      sub: typeof payload['sub'] === 'string' ? payload['sub'] : undefined,
      exp: typeof payload['exp'] === 'number' ? payload['exp'] : undefined,
    };
  } catch {
    return null;
  }
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
