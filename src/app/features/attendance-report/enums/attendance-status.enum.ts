/**
 * Chips: حاضر / غائب / إجازة / متأخر / معذور
 * Nest OpenAPI: PRESENT|ABSENT|LEAVE|LATE|NOT_MARKED|HOLIDAY (no EXCUSED yet).
 */
export enum AttendanceStatusUi {
  Present = 'PRESENT',
  Absent = 'ABSENT',
  Leave = 'LEAVE',
  Late = 'LATE',
  Excused = 'EXCUSED',
  NotMarked = 'NOT_MARKED',
  Holiday = 'HOLIDAY',
}

export type AttendanceChipKind =
  | 'present' | 'absent' | 'leave' | 'late' | 'excused' | 'blank' | 'holiday';

export interface AttendanceStatusView {
  kind: AttendanceChipKind;
  label: string;
  chipClass: string | null;
}

const MARKED: ReadonlySet<string> = new Set([
  AttendanceStatusUi.Present,
  AttendanceStatusUi.Absent,
  AttendanceStatusUi.Leave,
  AttendanceStatusUi.Late,
  AttendanceStatusUi.Excused,
]);

export function isMarkedAttendanceStatus(status: string | null | undefined): boolean {
  return !!status && MARKED.has(status);
}

/**
 * TODO(Nest): OpenAPI has no EXCUSED — if live returns EXCUSED, chip = معذور.
 * TODO(Nest): Confirm LEAVE always means إجازة (not معذور).
 */
export function mapAttendanceStatus(
  status: string | null | undefined,
  isHoliday = false,
): AttendanceStatusView {
  if (isHoliday || status === AttendanceStatusUi.Holiday) {
    return { kind: 'holiday', label: '', chipClass: null };
  }
  switch (status) {
    case AttendanceStatusUi.Present:
      return { kind: 'present', label: 'حاضر', chipClass: 'present' };
    case AttendanceStatusUi.Absent:
      return { kind: 'absent', label: 'غائب', chipClass: 'absent' };
    case AttendanceStatusUi.Leave:
      return { kind: 'leave', label: 'إجازة', chipClass: 'leave' };
    case AttendanceStatusUi.Late:
      return { kind: 'late', label: 'متأخر', chipClass: 'late' };
    case AttendanceStatusUi.Excused:
      return { kind: 'excused', label: 'معذور', chipClass: 'excused' };
    case AttendanceStatusUi.NotMarked:
    case null:
    case undefined:
    case '':
      return { kind: 'blank', label: '—', chipClass: null };
    default:
      return { kind: 'blank', label: '—', chipClass: null };
  }
}
