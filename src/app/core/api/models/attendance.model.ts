/**
 * Weekly grid DTO. Nest #40 (`5fa08515`).
 * `GET /attendance/weekly-table?weekStartDate=&halqaId?` and the per-ḥalaqa path.
 * Omit `halqaId`: `halqa` is null and each student row includes `halqa`.
 * Set `halqaId`: `halqa` is set and student rows omit `halqa`.
 */

/** OpenAPI enum — EXCUSED not in swagger; kept for UI/mobile معذور. */
export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LEAVE'
  | 'LATE'
  | 'NOT_MARKED'
  | 'HOLIDAY'
  | 'EXCUSED'; // TODO(Nest)

export interface AttendanceHalqaRef {
  id: number;
  name: string;
}

export interface WeeklyTableColumn {
  dayOfWeek: string;
  date: string;
  termDayId?: number;
  isHoliday?: boolean;
}

export interface WeeklyTableDayCell {
  termDayId?: number;
  date: string;
  dayOfWeek?: string;
  isHoliday?: boolean;
  status: AttendanceStatus | string;
}

export interface WeeklyTableStudentRef {
  id: number;
  name: string;
  email?: string;
}

export interface WeeklyTableStudentRow {
  student: WeeklyTableStudentRef;
  days: WeeklyTableDayCell[];
  /** Center-wide grid only. The single-ḥalaqa route omits this. */
  halqa?: AttendanceHalqaRef | null;
}

export interface WeeklyAttendanceTable {
  /** Null when `GET /attendance/weekly-table` omits `halqaId`. */
  halqa: AttendanceHalqaRef | null;
  weekStartDate: string;
  weekEndDate: string;
  columns: WeeklyTableColumn[];
  students: WeeklyTableStudentRow[];
}

/** GET /halqa/by-term/{termId} item */
export interface HalqaByTermItem {
  id: number;
  name: string;
  termId?: number;
  teacherId?: number | null;
  studentLimit?: number;
  periods?: string[];
}
