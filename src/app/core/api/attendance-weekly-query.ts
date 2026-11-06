/**
 * Live Nest #40 (`5fa08515` on tahfiz.onrender.com).
 * `GET /attendance/weekly-table?weekStartDate=YYYY-MM-DD&halqaId?`
 * Omit `halqaId` for every active ḥalaqa in the caller center (same set as `GET /halqa/dropdown`).
 */
export const CENTER_WEEKLY_TABLE_PATH = '/attendance/weekly-table';

/** Null omits the query param (all active). Non-positive ids are treated as omit. */
export function centerWeeklyHalqaIdParam(halqaId: number | null | undefined): string | null {
  if (halqaId == null || !Number.isFinite(halqaId) || halqaId <= 0) {
    return null;
  }
  return String(Math.trunc(halqaId));
}
