import { StudyPlanItemType } from '../../../core/api/models/study-plan.model';
import {
  DashboardAttendanceCounts,
  DashboardHalaqaRow,
  DashboardKpis,
  DashboardPendingRequest,
  DashboardTerm,
  DashboardTypeAverages,
  DashboardWeek,
  TermDashboardResponse,
} from '../../../core/api/models/term-dashboard.model';

export const PLAN_ITEM_TYPES: readonly StudyPlanItemType[] = ['HIFZ', 'TATHBEET', 'MURAJAA'];

export const ATTENTION_ABSENCE_MIN = 3;
export const ATTENTION_COVERAGE_BELOW = 75;

/** Per-type `totalPercentage`; a type missing from the student's plan is absent (not 0). */
export type PlanProgress = Partial<Record<StudyPlanItemType, number>>;

export interface DashboardRawStudent {
  studentId: number;
  name: string;
  halaqaId: number;
  attendance: DashboardAttendanceCounts;
  progress: PlanProgress;
}

export interface DashboardRawHalaqa {
  halaqaId: number;
  name: string;
  teacherName: string;
  attendance: DashboardAttendanceCounts;
  /** One row per active student (reports/progress). */
  progress: PlanProgress[];
  markedThisWeek: number;
  expectedThisWeek: number;
}

export interface DashboardRawInput {
  term: DashboardTerm | null;
  week: DashboardWeek | null;
  activeTeachersCount: number;
  halaqat: DashboardRawHalaqa[];
  students: DashboardRawStudent[];
  pendingRequests: DashboardPendingRequest[];
}

function mean(values: readonly number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function presentValues(progress: PlanProgress): number[] {
  return PLAN_ITEM_TYPES.map((type) => progress[type]).filter(
    (value): value is number => value !== undefined,
  );
}

/** (PRESENT + LATE) ÷ (PRESENT + LATE + ABSENT). LEAVE is outside both sides. */
export function attendanceRate(counts: DashboardAttendanceCounts): number | null {
  const attended = counts.present + counts.late;
  const counted = attended + counts.absent;
  return counted ? (attended * 100) / counted : null;
}

/** Mean over the item types this student's plan has. */
export function studentCoverage(progress: PlanProgress): number | null {
  return mean(presentValues(progress));
}

/** Mean over every (student, item) pair that exists in the ḥalaqa. */
export function halaqaCoverage(progress: readonly PlanProgress[]): number | null {
  return mean(progress.flatMap(presentValues));
}

export function performanceScore(
  attendance: number | null,
  coverage: number | null,
): number | null {
  return attendance === null || coverage === null ? null : 0.5 * attendance + 0.5 * coverage;
}

export function needsAttention(absentCount: number, coverage: number | null): boolean {
  return (
    absentCount >= ATTENTION_ABSENCE_MIN ||
    (coverage !== null && coverage < ATTENTION_COVERAGE_BELOW)
  );
}

/** Student-weighted mean per type over students who have that type. */
export function typeAverages(progress: readonly PlanProgress[]): {
  averages: DashboardTypeAverages;
  studentCounts: Record<StudyPlanItemType, number>;
} {
  const averages = {} as DashboardTypeAverages;
  const studentCounts = {} as Record<StudyPlanItemType, number>;
  for (const type of PLAN_ITEM_TYPES) {
    const values = progress
      .map((row) => row[type])
      .filter((value): value is number => value !== undefined);
    averages[type] = mean(values);
    studentCounts[type] = values.length;
  }
  return { averages, studentCounts };
}

/** Lowest score first; ties by Arabic name; rows without a score go last. */
export function rankHalaqat<T extends { name: string; score: number | null }>(
  rows: readonly T[],
): (T & { rank: number })[] {
  return [...rows]
    .sort((first, second) => {
      if (first.score !== second.score) {
        if (first.score === null) return 1;
        if (second.score === null) return -1;
        return first.score - second.score;
      }
      return first.name.localeCompare(second.name, 'ar');
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function sumAttendance(counts: readonly DashboardAttendanceCounts[]): DashboardAttendanceCounts {
  return counts.reduce(
    (total, row) => ({
      present: total.present + row.present,
      late: total.late + row.late,
      absent: total.absent + row.absent,
      leave: total.leave + row.leave,
    }),
    { present: 0, late: 0, absent: 0, leave: 0 },
  );
}

function pendingCounts(
  requests: readonly DashboardPendingRequest[],
): DashboardKpis['pendingRequests'] {
  const count = (kind: DashboardPendingRequest['kind']) =>
    requests.filter((request) => request.kind === kind).length;
  return {
    students: count('STUDENT'),
    teachers: count('TEACHER'),
    reEnrollment: count('RE_ENROLLMENT'),
    total: requests.length,
  };
}

/** Builds the endpoint-shaped response from raw marks and per-student progress. */
export function buildTermDashboard(input: DashboardRawInput): TermDashboardResponse {
  const halaqat = input.term ? input.halaqat : [];
  const kpis: DashboardKpis = {
    activeHalaqatCount: halaqat.length,
    activeTeachersCount: input.activeTeachersCount,
    activeStudentsCount: halaqat.reduce((sum, halaqa) => sum + halaqa.progress.length, 0),
    pendingRequests: pendingCounts(input.pendingRequests),
  };

  if (!input.term) {
    return {
      term: null,
      week: null,
      kpis,
      halaqat: [],
      totals: null,
      markingCompleteness: null,
      attentionStudents: [],
      pendingRequests: input.pendingRequests,
    };
  }

  const rows: DashboardHalaqaRow[] = rankHalaqat(
    halaqat.map((halaqa) => {
      const rate = attendanceRate(halaqa.attendance);
      const coverage = halaqaCoverage(halaqa.progress);
      return {
        halaqaId: halaqa.halaqaId,
        name: halaqa.name,
        teacherName: halaqa.teacherName,
        studentCount: halaqa.progress.length,
        attendance: halaqa.attendance,
        attendanceRate: rate,
        typeAverages: typeAverages(halaqa.progress).averages,
        coverage,
        score: performanceScore(rate, coverage),
        markedThisWeek: halaqa.markedThisWeek,
        expectedThisWeek: halaqa.expectedThisWeek,
        notMarkedThisWeek: halaqa.expectedThisWeek - halaqa.markedThisWeek,
        fullyMarkedThisWeek: halaqa.markedThisWeek >= halaqa.expectedThisWeek,
      };
    }),
  );

  const totalAttendance = sumAttendance(halaqat.map((halaqa) => halaqa.attendance));
  const totalTypes = typeAverages(halaqat.flatMap((halaqa) => halaqa.progress));
  const markedCells = rows.reduce((sum, row) => sum + row.markedThisWeek, 0);
  const expectedCells = rows.reduce((sum, row) => sum + row.expectedThisWeek, 0);
  const halaqaNames = new Map(halaqat.map((halaqa) => [halaqa.halaqaId, halaqa.name]));

  return {
    term: input.term,
    week: input.week,
    kpis,
    halaqat: rows,
    totals: {
      attendance: totalAttendance,
      attendanceRate: attendanceRate(totalAttendance),
      typeAverages: totalTypes.averages,
      typeStudentCounts: totalTypes.studentCounts,
    },
    markingCompleteness: {
      fullyMarkedHalaqat: rows.filter((row) => row.fullyMarkedThisWeek).length,
      totalHalaqat: rows.length,
      markedCells,
      expectedCells,
      notMarkedCells: expectedCells - markedCells,
    },
    attentionStudents: input.students
      .map((student) => ({
        studentId: student.studentId,
        name: student.name,
        halaqaId: student.halaqaId,
        halaqaName: halaqaNames.get(student.halaqaId) ?? '',
        absentCount: student.attendance.absent,
        coverage: studentCoverage(student.progress),
      }))
      .filter((student) => needsAttention(student.absentCount, student.coverage)),
    pendingRequests: input.pendingRequests,
  };
}
