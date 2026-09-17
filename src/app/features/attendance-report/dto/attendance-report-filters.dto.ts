/** UI filters — ḥalaqa + Sunday week + student search (no date-range). */
export interface AttendanceReportFilters {
  halqaId: number | null;
  weekStartDate: string;
  studentQuery: string;
}

export interface HalqaSelectOption {
  id: number;
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
  studentId: number;
  studentName: string;
  cells: AttendanceCellVm[];
}
