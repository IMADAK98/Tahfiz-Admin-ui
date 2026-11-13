import { DashboardAttendanceCounts } from '../../../core/api/models/term-dashboard.model';
import { DashboardMockState } from '../enums/dashboard-mock-state.enum';
import {
  DashboardRawHalaqa,
  DashboardRawInput,
  DashboardRawStudent,
  PlanProgress,
} from './dashboard-metrics';

/** Sample data (عيّنة) matching design rev 4.1. Derived numbers come from `buildTermDashboard`. */

const TERM_SCHOOL_DAYS = 41;
const WEEK_SCHOOL_DAYS = 2;

interface HalaqaSeed {
  halaqaId: number;
  name: string;
  teacherName: string;
  studentCount: number;
  attendance: DashboardAttendanceCounts;
  progress: PlanProgress;
}

const HALAQA_SEEDS: readonly HalaqaSeed[] = [
  {
    halaqaId: 16,
    name: 'حلقة الناشئين',
    teacherName: 'فهد الشهري',
    studentCount: 13,
    attendance: { present: 350, late: 40, absent: 110, leave: 33 },
    progress: { HIFZ: 56, TATHBEET: 62, MURAJAA: 68 },
  },
  {
    halaqaId: 18,
    name: 'حلقة الأترجة',
    teacherName: 'بدر السلمي',
    studentCount: 11,
    attendance: { present: 336, late: 24, absent: 40, leave: 51 },
    progress: { HIFZ: 52, TATHBEET: 54, MURAJAA: 68 },
  },
  {
    halaqaId: 14,
    name: 'حلقة العصر',
    teacherName: 'خالد الزهراني',
    studentCount: 12,
    attendance: { present: 348, late: 30, absent: 72, leave: 42 },
    progress: { HIFZ: 71, TATHBEET: 72, MURAJAA: 85 },
  },
  {
    halaqaId: 17,
    name: 'حلقة المغرب',
    teacherName: 'عبدالرحمن المطيري',
    studentCount: 10,
    attendance: { present: 332, late: 20, absent: 48, leave: 10 },
    progress: { HIFZ: 78, TATHBEET: 76, MURAJAA: 86 },
  },
  {
    halaqaId: 19,
    name: 'حلقة النور',
    teacherName: 'ماجد الحربي',
    studentCount: 12,
    attendance: { present: 405, late: 18, absent: 27, leave: 42 },
    progress: { HIFZ: 72, TATHBEET: 74, MURAJAA: 88 },
  },
  {
    halaqaId: 15,
    name: 'حلقة المراجعة',
    teacherName: 'سعد القحطاني',
    studentCount: 9,
    attendance: { present: 326, late: 10, absent: 14, leave: 19 },
    progress: { TATHBEET: 76, MURAJAA: 92 },
  },
  {
    halaqaId: 12,
    name: 'حلقة الفجر',
    teacherName: 'محمد العتيبي',
    studentCount: 14,
    attendance: { present: 500, late: 28, absent: 22, leave: 24 },
    progress: { HIFZ: 80, TATHBEET: 78, MURAJAA: 88 },
  },
  {
    halaqaId: 20,
    name: 'حلقة الفرقان',
    teacherName: 'عمر الغامدي',
    studentCount: 15,
    attendance: { present: 520, late: 32, absent: 48, leave: 15 },
    progress: { HIFZ: 89, TATHBEET: 86, MURAJAA: 95 },
  },
];

const EMPTY_WORKLIST_OVERRIDES: Readonly<Record<number, Partial<HalaqaSeed>>> = {
  16: {
    attendance: { present: 410, late: 40, absent: 50, leave: 33 },
    progress: { HIFZ: 76, TATHBEET: 78, MURAJAA: 86 },
  },
  18: {
    attendance: { present: 344, late: 24, absent: 32, leave: 51 },
    progress: { HIFZ: 78, TATHBEET: 80, MURAJAA: 88 },
  },
  14: {
    attendance: { present: 366, late: 30, absent: 54, leave: 42 },
    progress: { HIFZ: 75, TATHBEET: 76, MURAJAA: 89 },
  },
};

/** halaqaId → marks recorded this week (expected = students × school days). */
const INCOMPLETE_MARKING: Readonly<Record<number, number>> = { 14: 17, 19: 20 };

function termMarks(absent: number, leave = 0, late = 1): DashboardAttendanceCounts {
  return { present: TERM_SCHOOL_DAYS - absent - leave - late, late, absent, leave };
}

/** Same spread around the student's coverage, so dropping تثبيت keeps the mean. */
function spread(coverage: number): PlanProgress {
  return { HIFZ: coverage - 4, TATHBEET: coverage, MURAJAA: coverage + 4 };
}

const ATTENTION_STUDENTS: readonly DashboardRawStudent[] = [
  {
    studentId: 201,
    name: 'إبراهيم بن ماجد السبيعي',
    halaqaId: 16,
    attendance: termMarks(9),
    progress: spread(54),
  },
  {
    studentId: 202,
    name: 'تركي بن بندر المالكي',
    halaqaId: 16,
    attendance: termMarks(7),
    progress: spread(70),
  },
  {
    studentId: 203,
    name: 'سلمان بن ناصر العنزي',
    halaqaId: 14,
    attendance: termMarks(5),
    progress: spread(81),
  },
  {
    studentId: 204,
    name: 'فارس بن سامي الحارثي',
    halaqaId: 14,
    attendance: termMarks(4),
    progress: spread(77),
  },
  {
    studentId: 205,
    name: 'نايف بن عادل الشهري',
    halaqaId: 17,
    attendance: termMarks(3),
    progress: spread(84),
  },
  {
    studentId: 206,
    name: 'أنس بن حمد الرشيدي',
    halaqaId: 18,
    attendance: termMarks(1),
    progress: spread(49),
  },
  {
    studentId: 207,
    name: 'بدر بن فهد الدوسري',
    halaqaId: 18,
    attendance: termMarks(0),
    progress: spread(61),
  },
  {
    studentId: 208,
    name: 'خالد بن يوسف العمري',
    halaqaId: 16,
    attendance: termMarks(2),
    progress: spread(66),
  },
  {
    studentId: 209,
    name: 'ماجد بن سعد القرني',
    halaqaId: 19,
    attendance: termMarks(1),
    progress: spread(72),
  },
];

/** Not flagged: 2 absences with many LEAVE days, and coverage exactly 75 without حفظ. */
const CALM_STUDENTS: readonly DashboardRawStudent[] = [
  {
    studentId: 210,
    name: 'عبدالله بن خالد القحطاني',
    halaqaId: 12,
    attendance: termMarks(2, 6),
    progress: spread(88),
  },
  {
    studentId: 211,
    name: 'يوسف بن علي الزهراني',
    halaqaId: 20,
    attendance: termMarks(0),
    progress: spread(93),
  },
  {
    studentId: 212,
    name: 'عمر بن سعيد الغامدي',
    halaqaId: 15,
    attendance: termMarks(1),
    progress: { TATHBEET: 75, MURAJAA: 75 },
  },
];

function withoutTathbeet({ TATHBEET: _dropped, ...rest }: PlanProgress): PlanProgress {
  return rest;
}

function toRawHalaqa(seed: HalaqaSeed, markedThisWeek: number | undefined): DashboardRawHalaqa {
  const expectedThisWeek = seed.studentCount * WEEK_SCHOOL_DAYS;
  return {
    halaqaId: seed.halaqaId,
    name: seed.name,
    teacherName: seed.teacherName,
    attendance: seed.attendance,
    progress: Array.from({ length: seed.studentCount }, () => ({ ...seed.progress })),
    markedThisWeek: markedThisWeek ?? expectedThisWeek,
    expectedThisWeek,
  };
}

export function dashboardMockInput(state: DashboardMockState): DashboardRawInput {
  const emptyWorklists = state === DashboardMockState.EmptyWorklists;
  const missingType = state === DashboardMockState.MissingType;
  const incomplete = state === DashboardMockState.IncompleteMarking;

  const halaqat = HALAQA_SEEDS.map((seed) => {
    const merged = emptyWorklists ? { ...seed, ...EMPTY_WORKLIST_OVERRIDES[seed.halaqaId] } : seed;
    const raw = toRawHalaqa(merged, incomplete ? INCOMPLETE_MARKING[seed.halaqaId] : undefined);
    return missingType ? { ...raw, progress: raw.progress.map(withoutTathbeet) } : raw;
  });

  const students = (emptyWorklists ? CALM_STUDENTS : [...ATTENTION_STUDENTS, ...CALM_STUDENTS]).map(
    (student) =>
      missingType ? { ...student, progress: withoutTathbeet(student.progress) } : student,
  );

  return {
    term:
      state === DashboardMockState.NoTerm
        ? null
        : {
            id: 7,
            name: 'دورة الفصل الأول 1448',
            startDate: '2026-09-13',
            endDate: '2026-12-24',
            status: 'ACTIVE',
            schoolDaysToDate: TERM_SCHOOL_DAYS,
          },
    week: { weekStart: '2026-11-08', weekEnd: '2026-11-12', schoolDaysToDate: WEEK_SCHOOL_DAYS },
    activeTeachersCount: 8,
    halaqat,
    students,
    pendingRequests: [
      { kind: 'STUDENT', requestId: 301, name: 'سعد بن محمد العتيبي', submittedAt: '2026-11-09' },
      { kind: 'STUDENT', requestId: 302, name: 'هشام بن فيصل الحربي', submittedAt: '2026-11-10' },
      { kind: 'TEACHER', requestId: 401, name: 'أحمد بن صالح المطيري', submittedAt: '2026-11-08' },
      {
        kind: 'RE_ENROLLMENT',
        requestId: 501,
        name: 'زياد بن عمر الشمري',
        submittedAt: '2026-11-07',
      },
    ],
  };
}
