import type {
  WeeklyReportAssembleInput,
  WeeklyReportDay,
  WeeklyReportPercents,
  WeeklyReportSourceStudent,
} from './weekly-report-workbook';

/**
 * Realistic stub for the workbook builder: 3 ḥalaqas, 8 students, 2 weeks,
 * present / late / absent / leave / unmarked, plus a term window.
 * P present, A absent, T late, E leave, U unmarked.
 */
const WEEK_1 = '2026-11-01';
const WEEK_2 = '2026-11-08';

type Code = 'P' | 'A' | 'T' | 'E' | 'U';

const STATUS: Record<Code, string | null> = {
  P: 'PRESENT',
  A: 'ABSENT',
  T: 'LATE',
  E: 'LEAVE',
  U: null,
};

export function sampleWeeklyReportInput(): WeeklyReportAssembleInput {
  const teachers = new Map<number, string | null>([
    [1, 'أ. خالد'],
    [2, 'أ. منى'],
    [3, 'أ. سالم'],
  ]);
  const roster: Array<[number, string, number, string]> = [
    [1, 'سارة', 1, 'حلقة الفجر'],
    [2, 'ليلى', 1, 'حلقة الفجر'],
    [3, 'يوسف', 1, 'حلقة الفجر'],
    [4, 'عمر', 2, 'حلقة الظهر'],
    [5, 'هند', 2, 'حلقة الظهر'],
    [6, 'فهد', 2, 'حلقة الظهر'],
    [7, 'نورة', 3, 'حلقة العصر'],
    [8, 'آدم', 3, 'حلقة العصر'],
  ];
  const week1Marks: Code[][] = [
    ['P', 'A', 'T', 'E', 'P'],
    ['P', 'P', 'P', 'P', 'P'],
    ['A', 'A', 'A', 'A', 'A'],
    ['P', 'P', 'A', 'A', 'T'],
    ['U', 'U', 'U', 'U', 'U'],
    ['P', 'E', 'P', 'A', 'P'],
    ['T', 'P', 'P', 'P', 'A'],
    ['P', 'P', 'P', 'P', 'E'],
  ];
  const week2Marks: Code[][] = [
    ['P', 'P', 'P', 'P', 'P'],
    ['A', 'P', 'P', 'P', 'P'],
    ['A', 'A', 'P', 'P', 'P'],
    ['P', 'P', 'P', 'P', 'P'],
    ['P', 'U', 'U', 'U', 'U'],
    ['P', 'P', 'P', 'P', 'P'],
    ['P', 'P', 'P', 'P', 'P'],
    ['A', 'A', 'A', 'A', 'A'],
  ];
  const weekRates: Array<[number | null, number | null, number | null]> = [
    [150, null, 0],
    [80, 70, 10],
    [0, 0, 0],
    [95, 85, 40],
    [null, null, null],
    [110, 0, null],
    [75, 60, 200],
    [100, 100, 100],
  ];
  const termRates: Array<[number | null, number | null, number | null]> = [
    [180, null, 40],
    [90, 90, 90],
    [0, 0, 0],
    [100, 100, 50],
    [null, null, null],
    [130, 10, null],
    [80, 70, 250],
    [100, 100, 100],
  ];
  return {
    weeks: [
      { weekStart: WEEK_1, students: roster.map((row, index) => student(row, days(WEEK_1, week1Marks[index]))) },
      { weekStart: WEEK_2, students: roster.map((row, index) => student(row, days(WEEK_2, week2Marks[index]))) },
    ],
    progress: [
      ...roster.map((row, index) => percent(WEEK_1, row, weekRates[index])),
      ...roster.map((row, index) => percent(WEEK_2, row, weekRates[index])),
      ...roster.map((row, index) => percent(null, row, termRates[index])),
    ],
    teacherByHalqaId: teachers,
    includeTermSheet: true,
  };
}

function student(
  row: [number, string, number, string],
  dayList: WeeklyReportDay[],
): WeeklyReportSourceStudent {
  return {
    studentId: row[0],
    studentName: row[1],
    halqaId: row[2],
    halqaName: row[3],
    days: dayList,
  };
}

function percent(
  weekStart: string | null,
  row: [number, string, number, string],
  rates: [number | null, number | null, number | null],
): WeeklyReportPercents {
  return {
    weekStart,
    halqaId: row[2],
    studentId: row[0],
    mur: rates[0],
    tath: rates[1],
    hifz: rates[2],
  };
}

function days(weekStart: string, codes: Code[]): WeeklyReportDay[] {
  const [year, month, day] = weekStart.split('-').map(Number);
  return codes.map((code, index) => {
    const date = new Date(year, month - 1, day + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { date: iso, status: STATUS[code], isHoliday: false };
  });
}
