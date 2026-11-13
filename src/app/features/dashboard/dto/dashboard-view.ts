import { DashboardAttentionStudent } from '../../../core/api/models/term-dashboard.model';
import { parseLocalIsoDate } from '../../../core/utils/local-date';
import { ScoreBand } from '../enums/score-band.enum';

export const STUDENT_GROUP_LIMIT = 3;
export const LOW_ATTENDANCE_BELOW = 85;
export const LOW_COVERAGE_BELOW = 75;

export interface StudentGroup {
  absence: boolean;
  total: number;
  students: DashboardAttentionStudent[];
  hidden: number;
}

export function scoreBand(score: number | null): ScoreBand {
  if (score === null || score >= 85) return ScoreBand.Ok;
  return score < 75 ? ScoreBand.Low : ScoreBand.Mid;
}

export function isLow(value: number | null, below: number): boolean {
  return value !== null && value < below;
}

/** Absence group first, then coverage; alphabetical inside each group, never by severity. */
export function studentGroups(students: readonly DashboardAttentionStudent[]): StudentGroup[] {
  const byName = (list: DashboardAttentionStudent[]) =>
    list.sort((first, second) => first.name.localeCompare(second.name, 'ar'));
  const absence = byName(students.filter((student) => student.absentCount >= 3));
  const coverage = byName(students.filter((student) => student.absentCount < 3));
  return [
    { absence: true, students: absence },
    { absence: false, students: coverage },
  ]
    .filter((group) => group.students.length)
    .map((group) => ({
      absence: group.absence,
      total: group.students.length,
      students: group.students.slice(0, STUDENT_GROUP_LIMIT),
      hidden: Math.max(0, group.students.length - STUDENT_GROUP_LIMIT),
    }));
}

const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });
const MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'long' });
const WEEKDAY = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long' });

/** «13 سبتمبر» / «24 ديسمبر 2026» (year only on the end date). */
export function termDateLabels(startDate: string, endDate: string): { start: string; end: string } {
  const start = parseLocalIsoDate(startDate);
  const end = parseLocalIsoDate(endDate);
  const startLabel = DAY_MONTH.format(start);
  return {
    start:
      start.getFullYear() === end.getFullYear()
        ? startLabel
        : `${startLabel} ${start.getFullYear()}`,
    end: `${DAY_MONTH.format(end)} ${end.getFullYear()}`,
  };
}

/** «الأحد 8 – الخميس 12 نوفمبر». */
export function weekRangeLabel(weekStart: string, weekEnd: string): string {
  const start = parseLocalIsoDate(weekStart);
  const end = parseLocalIsoDate(weekEnd);
  const startMonth = start.getMonth() === end.getMonth() ? '' : ` ${MONTH.format(start)}`;
  return `${WEEKDAY.format(start)} ${start.getDate()}${startMonth} – ${WEEKDAY.format(end)} ${end.getDate()} ${MONTH.format(end)}`;
}
