/** Merge into src/app/core/config/public-links.ts */

/** In-app center signup route (mock 17 — POST /pending-center-request) */
export const CENTER_SIGNUP_ROUTE = '/user/signup';

/** Public student signup (mock 12) — append ?token= */
export const STUDENT_SIGNUP_ROUTE = '/signup/student';

/** Public identify / returning student (mock 16) — append ?token=&term= */
export const IDENTIFY_ROUTE = '/identify';

/** Product host lock for displayed reg links (rewrite vercel → this). */
export const PRODUCT_PUBLIC_HOST = 'https://www.tahfiz.work';

/**
 * Hosts that do not serve this Angular app's `/identify` (404 on 2026-09-23).
 * ponytail: swap only these; a working absolute host (admin Vercel, localhost) stays.
 * Upgrade: point PRODUCT_PUBLIC_HOST at the deploy that actually serves `/identify`.
 */
const STALE_INVITE_HOSTS = new Set(['tahfiz-client.vercel.app', 'www.tahfiz.work', 'tahfiz.work']);

/** Build shareable identify URL for admin "copy link" UIs. */
export function buildIdentifyShareUrl(token: string, termName?: string): string {
  const url = new URL(`${PRODUCT_PUBLIC_HOST}/identify`);
  url.searchParams.set('token', token);
  if (termName) url.searchParams.set('term', termName);
  return url.toString();
}

export function readAppOrigin(): string | undefined {
  const origin = globalThis.location?.origin;
  if (!origin || origin === 'null') {
    return undefined;
  }
  return origin;
}

/**
 * Invite entry is `/identify`, keeping `token` / `term` (and any other query).
 * Stale hosts are rewritten to `appOrigin` when the admin app is the one that serves identify.
 */
export function rewriteInviteEntryUrl(rawUrl: string, appOrigin?: string): string {
  const trimmed = rawUrl.trim();
  const origin = (appOrigin?.trim() || PRODUCT_PUBLIC_HOST).replace(/\/$/, '');
  if (!trimmed) {
    return '';
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, `${origin}/`);
  } catch {
    return '';
  }

  if (STALE_INVITE_HOSTS.has(parsed.hostname)) {
    const product = new URL(origin);
    parsed.protocol = product.protocol;
    parsed.host = product.host;
  }

  parsed.pathname = IDENTIFY_ROUTE;
  parsed.hash = '';
  return parsed.toString();
}

function optionalLinkString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

/** Nest field names differ by contract: `registrationUrl` | `registrationLink` | `url`. */
export function mapInviteRegistrationLink(
  data: unknown,
  appOrigin?: string,
): { registrationUrl: string; expiresAt: string | null } {
  const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const raw =
    optionalLinkString(row['registrationUrl']) ??
    optionalLinkString(row['registrationLink']) ??
    optionalLinkString(row['url']) ??
    '';
  const token = optionalLinkString(row['token']);
  const term = optionalLinkString(row['termName']) ?? optionalLinkString(row['term']);
  const origin = (appOrigin?.trim() || PRODUCT_PUBLIC_HOST).replace(/\/$/, '');
  let registrationUrl = raw ? rewriteInviteEntryUrl(raw, origin) : '';
  if (!registrationUrl && token) {
    registrationUrl = rewriteInviteEntryUrl(`${origin}/identify`, origin);
  }
  if (registrationUrl) {
    const url = new URL(registrationUrl);
    if (token && !url.searchParams.get('token')) {
      url.searchParams.set('token', token);
    }
    if (term && !url.searchParams.get('term')) {
      url.searchParams.set('term', term);
    }
    registrationUrl = url.toString();
  }
  return {
    registrationUrl,
    expiresAt: optionalLinkString(row['expiresAt']) ?? null,
  };
}
