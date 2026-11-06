import type { AttendanceHalqaRef, WeeklyTableColumn, WeeklyTableDayCell } from '../../../core/api/models/attendance.model';
import {
  ALL_ACTIVE_HALAQAT,
  ALL_ACTIVE_HALAQAT_LABEL,
  type HalqaFilterOption,
} from './attendance-report-filters.dto';

/** Normalized center-wide grid. `halqa` is set when the response names one ḥalaqa. */
export interface CenterWeeklyStudentRow {
  student: { id: number; name: string; email?: string };
  days: WeeklyTableDayCell[];
  halqa: AttendanceHalqaRef | null;
}

export interface CenterWeeklyTable {
  halqa: AttendanceHalqaRef | null;
  weekStartDate: string;
  weekEndDate: string;
  columns: WeeklyTableColumn[];
  students: CenterWeeklyStudentRow[];
}

export interface HalqaDropdownItem {
  id: number;
  name: string;
}

/** 0 → «لا طلاب»، 1 → «طالب واحد»، 2 → «طالبان»، 3–10 → «ن طلاب»، 11+ → «ن طالباً». */
export function formatStudentCountAr(count: number): string {
  if (count <= 0) {
    return 'لا طلاب';
  }
  if (count === 1) {
    return 'طالب واحد';
  }
  if (count === 2) {
    return 'طالبان';
  }
  if (count <= 10) {
    return `${count} طلاب`;
  }
  return `${count} طالباً`;
}

export function withAllActiveHalqaOption(items: HalqaDropdownItem[]): HalqaFilterOption[] {
  const seen = new Set<number>();
  const options: HalqaFilterOption[] = [
    { value: ALL_ACTIVE_HALAQAT, name: ALL_ACTIVE_HALAQAT_LABEL },
  ];
  for (const item of items) {
    if (!item.id || seen.has(item.id) || !item.name) {
      continue;
    }
    seen.add(item.id);
    options.push({ value: String(item.id), name: item.name });
  }
  return options;
}

/**
 * `GET /halqa/dropdown` → `HalqaDropdownDto[]` `{ id, name, category }`.
 * Active ḥalaqāt only, including ones whose term is not active (Imad lock, Nest #40).
 */
export function readHalqaDropdown(raw: unknown): HalqaDropdownItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item) => {
    const row = asRecord(item);
    if (!row || row['isActive'] === false) {
      return [];
    }
    const id = coerceId(row['id']);
    const name = stringOf(row['name']);
    if (!id || !name) {
      return [];
    }
    return [{ id, name }];
  });
}

/**
 * Nest #40 `WeeklyAttendanceTableDto`.
 * All-active: `halqa` is null and each student has `halqa`. Order is kept (server sorts by ḥalaqa name, then student name).
 * One ḥalaqa: top-level `halqa` is set and rows omit `halqa` — copied here so the under-label still renders.
 */
export function normalizeCenterWeeklyTable(raw: unknown): CenterWeeklyTable {
  const data = asRecord(raw) ?? {};
  const topHalqa = readHalqa(data['halqa']);
  const students = readStudentRows(data['students'], topHalqa);
  let columns = readColumns(data['columns']);
  if (!columns.length) {
    columns = columnsFromStudentDays(students);
  }
  return {
    halqa: topHalqa,
    weekStartDate: isoDay(data['weekStartDate']) || stringOf(data['weekStartDate']),
    weekEndDate: isoDay(data['weekEndDate']) || stringOf(data['weekEndDate']),
    columns,
    students,
  };
}

function readStudentRows(value: unknown, fallbackHalqa: AttendanceHalqaRef | null): CenterWeeklyStudentRow[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const row = asRecord(item);
    if (!row) {
      return [];
    }
    const student = readStudent(row);
    if (!student) {
      return [];
    }
    return [
      {
        student,
        days: readDays(row['days']),
        halqa: readRowHalqa(row, fallbackHalqa),
      },
    ];
  });
}

function readStudent(row: Record<string, unknown>): { id: number; name: string; email?: string } | null {
  const nested = asRecord(row['student']);
  if (!nested) {
    return null;
  }
  const id = coerceId(nested['id']);
  const name = stringOf(nested['name']);
  if (!name) {
    return null;
  }
  const email = stringOf(nested['email']);
  return email ? { id, name, email } : { id, name };
}

function readRowHalqa(
  row: Record<string, unknown>,
  fallback: AttendanceHalqaRef | null,
): AttendanceHalqaRef | null {
  if (!Object.prototype.hasOwnProperty.call(row, 'halqa')) {
    return fallback;
  }
  return readHalqa(row['halqa']) ?? fallback;
}

function readHalqa(value: unknown): AttendanceHalqaRef | null {
  const row = asRecord(value);
  if (!row) {
    return null;
  }
  const id = coerceId(row['id']);
  const name = stringOf(row['name']);
  if (!id && !name) {
    return null;
  }
  return { id, name };
}

function readColumns(value: unknown): WeeklyTableColumn[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const row = asRecord(item);
    if (!row) {
      return [];
    }
    const date = isoDay(row['date']);
    if (!date) {
      return [];
    }
    const termDayId = coerceId(row['termDayId']);
    return [
      {
        dayOfWeek: stringOf(row['dayOfWeek']),
        date,
        ...(termDayId ? { termDayId } : {}),
        isHoliday: row['isHoliday'] === true,
      },
    ];
  });
}

function readDays(value: unknown): WeeklyTableDayCell[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const row = asRecord(item);
    if (!row) {
      return [];
    }
    const date = isoDay(row['date']);
    if (!date) {
      return [];
    }
    const termDayId = coerceId(row['termDayId']);
    const status = stringOf(row['status']) || 'NOT_MARKED';
    return [
      {
        date,
        status,
        ...(termDayId ? { termDayId } : {}),
        ...(stringOf(row['dayOfWeek']) ? { dayOfWeek: stringOf(row['dayOfWeek']) } : {}),
        isHoliday: row['isHoliday'] === true || status === 'HOLIDAY',
      },
    ];
  });
}

function columnsFromStudentDays(students: CenterWeeklyStudentRow[]): WeeklyTableColumn[] {
  const first = students.find((student) => student.days.length);
  if (!first) {
    return [];
  }
  return first.days.map((day) => ({
    dayOfWeek: day.dayOfWeek ?? '',
    date: day.date,
    ...(day.termDayId ? { termDayId: day.termDayId } : {}),
    isHoliday: !!day.isHoliday,
  }));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function coerceId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function stringOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isoDay(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}
