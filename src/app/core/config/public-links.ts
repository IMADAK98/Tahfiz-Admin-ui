/** Merge into src/app/core/config/public-links.ts */

/** In-app center signup route (mock 17 — POST /pending-center-request) */
export const CENTER_SIGNUP_ROUTE = '/user/signup';

/** Public student signup (mock 12) — append ?token= */
export const STUDENT_SIGNUP_ROUTE = '/signup/student';

/** Public identify / returning student (mock 16) — append ?token=&term= */
export const IDENTIFY_ROUTE = '/identify';

/** Product host lock for displayed reg links (rewrite vercel → this). */
export const PRODUCT_PUBLIC_HOST = 'https://www.tahfiz.work';

/** Build shareable identify URL for admin "copy link" UIs. */
export function buildIdentifyShareUrl(token: string, termName?: string): string {
  const url = new URL(`${PRODUCT_PUBLIC_HOST}/identify`);
  url.searchParams.set('token', token);
  if (termName) url.searchParams.set('term', termName);
  return url.toString();
}
