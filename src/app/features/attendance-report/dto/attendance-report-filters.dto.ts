/** Sentinel for «كل الحلقات النشطة». Not a Nest id — omit `halqaId` when this is selected. */
export const ALL_ACTIVE_HALAQAT = 'all';

export const ALL_ACTIVE_HALAQAT_LABEL = 'كل الحلقات النشطة';

/** UI filters — optional ḥalaqa + Sunday week + student search (no date-range). */
export interface AttendanceReportFilters {
  /** `ALL_ACTIVE_HALAQAT` or a numeric id string. */
  halqaValue: string;
  weekStartDate: string;
  studentQuery: string;
}

export interface HalqaFilterOption {
  value: string;
  name: string;
}

export interface AttendanceDayHeaderVm {
  date: string;
  dayOfWeekEn: string;
  dowAr: string;
  dayOfMonth: string;
  isHoliday: boolean;
  holidayHint: string | null;
}

export interface AttendanceCellVm {
  date: string;
  statusRaw: string;
  viewKind: string;
  label: string;
  chipClass: string | null;
  isHoliday: boolean;
}

export interface AttendanceRowVm {
  trackId: string;
  studentId: number;
  studentName: string;
  halqaId: number | null;
  halqaName: string | null;
  cells: AttendanceCellVm[];
}
