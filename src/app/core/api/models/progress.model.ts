/**
 * Nest Reports — GET /reports/progress
 * Shape from design/API-SCREEN-MAP.md §2.11, plus optional `termId` (Tahfiz PR 43).
 *
 * Query: halqaId (required) + period=day|week|month + startingDate + endingDate (YYYY-MM-DD)
 * + termId (optional positive integer). Period MUST be lowercase.
 * When both dates are sent they are the window. Response DTO is unchanged.
 */

export type ProgressPeriod = 'day' | 'week' | 'month';

/** Nest study-plan item types for progress percentages. */
export type ProgressPlanItemType = 'HIFZ' | 'TATHBEET' | 'MURAJAA';

export interface ProgressHalqaRef {
  id: number;
  name: string;
}

export interface ProgressTypePercent {
  planItemType: ProgressPlanItemType | string;
  totalPercentage: number;
}

/**
 * One roster student row.
 * lastUpdatedAt / updatedAt are ASSUMED (not in API-SCREEN-MAP) — TODO confirm live Nest.
 */
export interface ProgressStudentRow {
  studentId: number;
  studentName: string;
  /** Optional nested ref if Nest wraps student like weekly-table. */
  student?: { id: number; name: string; email?: string };
  progress: ProgressTypePercent[];
  /** ASSUMED — ISO date or datetime of last teacher progress write. */
  lastUpdatedAt?: string | null;
  updatedAt?: string | null;
}

export interface ProgressReportResponse {
  halqa: ProgressHalqaRef;
  period?: ProgressPeriod | string;
  startingDate?: string;
  endingDate?: string;
  students: ProgressStudentRow[];
}

/** GET /halqa/by-term/{termId} item (shared with attendance). */
export interface HalqaByTermItem {
  id: number;
  name: string;
  termId?: number;
  teacherId?: number | null;
  studentLimit?: number;
  periods?: string[];
}

export interface ProgressReportQuery {
  halqaId: number;
  period: ProgressPeriod;
  startingDate: string;
  endingDate: string;
  /** Selected term. Omit for the legacy unscoped read. */
  termId?: number | null;
}
