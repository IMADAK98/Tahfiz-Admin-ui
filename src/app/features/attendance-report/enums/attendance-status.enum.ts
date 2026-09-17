/**
 * Chips: حاضر / غائب / متأخر / معذور
 * Nest OpenAPI: PRESENT|ABSENT|LEAVE|LATE|NOT_MARKED|HOLIDAY
 * Product lock 2026-09-17: LEAVE → معذور (drop separate إجازة chip).
 */
export enum AttendanceStatusUi {
  Present = 'PRESENT',
  Absent = 'ABSENT',
  Leave = 'LEAVE',
  Late = 'LATE',
  NotMarked = 'NOT_MARKED',
  Holiday = 'HOLIDAY',
}

export type AttendanceChipKind =
  | 'present'
  | 'absent'
  | 'leave'
  | 'late'
  | 'excused'
  | 'blank'
  | 'holiday';

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
]);

export function isMarkedAttendanceStatus(status: string | null | undefined): boolean {
  return !!status && MARKED.has(status);
}

/** Nest LEAVE → معذور. HOLIDAY / blank stay non-marked. */
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
      return { kind: 'excused', label: 'معذور', chipClass: 'excused' };
    case AttendanceStatusUi.Late:
      return { kind: 'late', label: 'متأخر', chipClass: 'late' };
    case 'EXCUSED':
      return { kind: 'excused', label: 'معذور', chipClass: 'excused' };
    case AttendanceStatusUi.NotMarked:
    case null:
    case undefined:
    case '':
      return { kind: 'blank', label: '', chipClass: null };
    default:
      return { kind: 'blank', label: '', chipClass: null };
  }
}
