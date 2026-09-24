import type { AuthTokens } from './models/auth.model';

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface ChangeEmailRequest {
  readonly newEmail: string;
  readonly currentPassword: string;
}

/** Session rotation is optional. Missing tokens leave the current Bearer session in place. */
export function authTokensFromUnknown(data: unknown): AuthTokens | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const row = data as Record<string, unknown>;
  const nested = row['tokens'];
  const source = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : row;
  const accessToken = source['accessToken'];
  const refreshToken = source['refreshToken'];
  if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}
