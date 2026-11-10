import { StudyPlanItemType } from './study-plan.model';
import { TermStatus } from './term.model';

/**
 * Planned GET /dashboard/term/:termId?weekStart=yyyy-MM-dd (Sunday). Not on Nest yet.
 * Percentages are 0–100 and unrounded; the UI rounds for display. `term: null` = no ACTIVE term.
 */
export interface TermDashboardResponse {
  term: DashboardTerm | null;
  week: DashboardWeek | null;
  kpis: DashboardKpis;
  halaqat: DashboardHalaqaRow[];
  totals: DashboardTotals | null;
  markingCompleteness: DashboardMarkingCompleteness | null;
  attentionStudents: DashboardAttentionStudent[];
  pendingRequests: DashboardPendingRequest[];
}

export interface DashboardTerm {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  schoolDaysToDate: number;
}

export interface DashboardWeek {
  weekStart: string;
  weekEnd: string;
  schoolDaysToDate: number;
}

export interface DashboardPendingRequestCounts {
  students: number;
  teachers: number;
  reEnrollment: number;
  total: number;
}

export interface DashboardKpis {
  activeHalaqatCount: number;
  activeTeachersCount: number;
  activeStudentsCount: number;
  pendingRequests: DashboardPendingRequestCounts;
}

/** Term-to-date marks. NOT_MARKED and HOLIDAY cells are not counted here. */
export interface DashboardAttendanceCounts {
  present: number;
  late: number;
  absent: number;
  leave: number;
}

/** `null` = no plan in scope has that item type (never 0). */
export type DashboardTypeAverages = Record<StudyPlanItemType, number | null>;

export interface DashboardHalaqaRow {
  halaqaId: number;
  name: string;
  teacherName: string;
  studentCount: number;
  attendance: DashboardAttendanceCounts;
  attendanceRate: number | null;
  typeAverages: DashboardTypeAverages;
  coverage: number | null;
  score: number | null;
  /** 1 = lowest score (needs the most follow-up). */
  rank: number;
  markedThisWeek: number;
  expectedThisWeek: number;
  notMarkedThisWeek: number;
  fullyMarkedThisWeek: boolean;
}

export interface DashboardTotals {
  attendance: DashboardAttendanceCounts;
  attendanceRate: number | null;
  typeAverages: DashboardTypeAverages;
  /** Students whose plan has the item type (denominator of `typeAverages`). */
  typeStudentCounts: Record<StudyPlanItemType, number>;
}

export interface DashboardMarkingCompleteness {
  fullyMarkedHalaqat: number;
  totalHalaqat: number;
  markedCells: number;
  expectedCells: number;
  notMarkedCells: number;
}

/** Students with ≥ 3 ABSENT marks or coverage < 75%. Not ranked. */
export interface DashboardAttentionStudent {
  studentId: number;
  name: string;
  halaqaId: number;
  halaqaName: string;
  absentCount: number;
  coverage: number | null;
}

export type DashboardPendingRequestKind = 'STUDENT' | 'TEACHER' | 'RE_ENROLLMENT';

export interface DashboardPendingRequest {
  kind: DashboardPendingRequestKind;
  requestId: number;
  name: string;
  submittedAt: string;
}
