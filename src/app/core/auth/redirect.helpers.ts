const DEFAULT_ADMIN_PATH = '/admin';

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
