/**
 * `GET /attendance/weekly-table?weekStartDate=&halqaId?&termId?`
 * Omit `halqaId` for every ḥalaqa in the requested scope (not one forced ḥalaqa).
 * Omit `termId` only for the legacy Nest roster. Report pages send the selected term.
 */
export const CENTER_WEEKLY_TABLE_PATH = '/attendance/weekly-table';

/** Null omits the query param (all ḥalaqas in scope). Non-positive ids are treated as omit. */
export function centerWeeklyHalqaIdParam(halqaId: number | null | undefined): string | null {
  if (halqaId == null || !Number.isFinite(halqaId) || halqaId <= 0) {
    return null;
  }
  return String(Math.trunc(halqaId));
}

/** Positive integers only. Zero, blank, and non-integers omit the param (legacy Nest behavior). */
export function optionalPositiveIntParam(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return String(Math.trunc(value));
}

/** Center grid. `halqaId` is omitted for «كل الحلقات النشطة». `termId` is omitted only when the caller has none. */
export function centerWeeklyQueryParams(
  weekStartDate: string,
  halqaId?: number | null,
  termId?: number | null,
): Record<string, string> {
  const params: Record<string, string> = { weekStartDate };
  const halqaParam = centerWeeklyHalqaIdParam(halqaId);
  if (halqaParam) {
    params['halqaId'] = halqaParam;
  }
  const termParam = optionalPositiveIntParam(termId);
  if (termParam) {
    params['termId'] = termParam;
  }
  return params;
}

/** `GET /attendance/halqa/:halqaId/weekly-table?weekStartDate=&studentId?&termId?` */
export function halqaWeeklyQueryParams(
  weekStartDate: string,
  studentId?: number | null,
  termId?: number | null,
): Record<string, string> {
  const params: Record<string, string> = { weekStartDate };
  const studentParam = optionalPositiveIntParam(studentId);
  if (studentParam) {
    params['studentId'] = studentParam;
  }
  const termParam = optionalPositiveIntParam(termId);
  if (termParam) {
    params['termId'] = termParam;
  }
  return params;
}
