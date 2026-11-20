import { StudyPlanItemType } from './study-plan.model';

/** Term-to-date marks. NOT_MARKED and HOLIDAY cells are not counted here. */
export interface DashboardAttendanceCounts {
  present: number;
  late: number;
  absent: number;
  leave: number;
}

/** `null` = no plan in scope has that item type (never 0). */
export type DashboardTypeAverages = Record<StudyPlanItemType, number | null>;

/**
 * GET /dashboard/term/:termId/halqa-performance row (Nest PR #47). Rates are 0–100 rounded to
 * 2 decimals; `null` = no data, never 0. `teacherName` joins names with «، ».
 */
export interface DashboardHalaqaPerformanceRow {
  halaqaId: number;
  name: string;
  teacherName: string;
  studentCount: number;
  attendance: DashboardAttendanceCounts;
  attendanceRate: number | null;
  typeAverages: DashboardTypeAverages;
  coverage: number | null;
  score: number | null;
  /** 1 = lowest score (needs the most follow-up); null scores rank last. */
  rank: number;
}
