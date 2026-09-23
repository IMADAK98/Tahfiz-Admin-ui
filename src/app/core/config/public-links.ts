/** Merge into src/app/core/config/public-links.ts */

/** In-app center signup route (mock 17 — POST /pending-center-request) */
export const CENTER_SIGNUP_ROUTE = '/user/signup';

/** Public student signup (mock 12) — append ?token= */
export const STUDENT_SIGNUP_ROUTE = '/signup/student';

/** Public identify / returning student (mock 16) — append ?token=&term= */
export const IDENTIFY_ROUTE = '/identify';

/**
 * www.tahfiz.work 404s `/identify` (2026-09-23). Do not use it for admin invite share.
 * The admin app origin is what serves identify.
 */
export const PRODUCT_PUBLIC_HOST = 'https://www.tahfiz.work';

export function readAppOrigin(): string | undefined {
  const origin = globalThis.location?.origin;
  if (!origin || origin === 'null') {
    return undefined;
  }
  return origin;
}

function optionalLinkString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

function inviteQueryParam(rawUrl: string, key: string): string | undefined {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    return optionalLinkString(new URL(trimmed, 'https://invite.invalid/').searchParams.get(key));
  } catch {
    return undefined;
  }
}

/**
 * Admin invite share. Host and path are only the admin app + `/identify`.
 * Nest host and `/signup/student` are ignored.
 * ponytail: only `term` + `token`. Upgrade: forward extra Nest query keys if identify starts reading them.
 */
export function buildAdminIdentifyShareUrl(
  token: string,
  term?: string,
  appOrigin?: string,
): string {
  const origin = (appOrigin?.trim() || readAppOrigin() || '').replace(/\/$/, '');
  const trimmedToken = token.trim();
  if (!origin || !trimmedToken) {
    return '';
  }
  const url = new URL(`${origin}${IDENTIFY_ROUTE}`);
  const trimmedTerm = term?.trim();
  if (trimmedTerm) {
    url.searchParams.set('term', trimmedTerm);
  }
  url.searchParams.set('token', trimmedToken);
  return url.toString();
}

/** Extract token/term from a Nest URL and rebuild the admin identify share link. */
export function rewriteInviteEntryUrl(rawUrl: string, appOrigin?: string): string {
  const token = inviteQueryParam(rawUrl, 'token');
  if (!token) {
    return '';
  }
  return buildAdminIdentifyShareUrl(token, inviteQueryParam(rawUrl, 'term'), appOrigin);
}

/** Nest field names differ by contract: `registrationUrl` | `registrationLink` | `url`. */
export function mapInviteRegistrationLink(
  data: unknown,
  appOrigin?: string,
): { shareUrl: string; expiresAt: string | null } {
  const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const raw =
    optionalLinkString(row['registrationUrl']) ??
    optionalLinkString(row['registrationLink']) ??
    optionalLinkString(row['url']) ??
    '';
  const token =
    optionalLinkString(row['token']) ?? (raw ? inviteQueryParam(raw, 'token') : undefined);
  const term =
    optionalLinkString(row['termName']) ??
    optionalLinkString(row['term']) ??
    (raw ? inviteQueryParam(raw, 'term') : undefined);
  const origin = (appOrigin?.trim() || readAppOrigin() || '').replace(/\/$/, '');
  return {
    shareUrl: token ? buildAdminIdentifyShareUrl(token, term, origin) : '',
    expiresAt: optionalLinkString(row['expiresAt']) ?? null,
  };
}
