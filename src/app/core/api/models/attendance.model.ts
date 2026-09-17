/**
 * Live Nest shapes (discovery 2026-09) + OpenAPI Attendance tag.
 * GET /attendance/halqa/{halqaId}/weekly-table?weekStartDate=YYYY-MM-DD (Sunday).
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
}

export interface WeeklyAttendanceTable {
  halqa: AttendanceHalqaRef;
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
