export const CENTER_ADMIN_HOME = '/admin';
export const SYSTEM_ADMIN_HOME = '/system-admin/center-requests';

const DEFAULT_ADMIN_PATH = CENTER_ADMIN_HOME;

/** Same-origin relative path only; blocks open redirects. */
export function safeRedirectPath(path: string | null | undefined, fallback = DEFAULT_ADMIN_PATH): string {
  if (!path || typeof path !== 'string') {
    return fallback;
  }

  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed.includes('://') || trimmed.includes('\\')) {
    return fallback;
  }

  return trimmed;
}

/** Role-aware post-login path: SYSTEM_ADMIN never lands in center `/admin/*`. */
export function postLoginPath(role: string | undefined | null, redirect?: string | null): string {
  if (role === 'SYSTEM_ADMIN') {
    const path = safeRedirectPath(redirect, SYSTEM_ADMIN_HOME);
    return path.startsWith('/system-admin') ? path : SYSTEM_ADMIN_HOME;
  }

  const path = safeRedirectPath(redirect, CENTER_ADMIN_HOME);
  return path.startsWith('/system-admin') ? CENTER_ADMIN_HOME : path;
}
