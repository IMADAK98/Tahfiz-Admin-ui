/**
 * `GET /halqa/by-term/:termId?includeInactive=`
 * Only the exact value `true` includes inactive ḥalaqas and enrollments.
 * Omitting the param keeps the current active-only list.
 */
export function halqaByTermParams(includeInactive: boolean): Record<string, string> {
  if (includeInactive) {
    return { includeInactive: 'true' };
  }
  return {};
}
