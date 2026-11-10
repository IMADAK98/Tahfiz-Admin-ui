import { DashboardMockState } from '../enums/dashboard-mock-state.enum';
import { dashboardMockInput } from './dashboard-mock-fixtures';
import {
  DashboardRawInput,
  attendanceRate,
  buildTermDashboard,
  halaqaCoverage,
  needsAttention,
  performanceScore,
  rankHalaqat,
  studentCoverage,
  typeAverages,
} from './dashboard-metrics';

/**
 * Hand-checked:
 * A: (6 + 2) / (6 + 2 + 2) = 80%; coverage pairs 60, 80, 70 → 70; score 75.
 * B: (9 + 0) / (9 + 0 + 1) = 90%; coverage 40, 60 → 50 (no TATHBEET/MURAJAA, not 0); score 70.
 * HIFZ avg = (60 + 70 + 40 + 60) / 4 = 57.5 (4 students); TATHBEET = 80 (1); MURAJAA = null (0).
 */
const FIXTURE: DashboardRawInput = {
  term: {
    id: 1,
    name: 'T',
    startDate: '2026-09-13',
    endDate: '2026-12-24',
    status: 'ACTIVE',
    schoolDaysToDate: 10,
  },
  week: { weekStart: '2026-11-08', weekEnd: '2026-11-12', schoolDaysToDate: 2 },
  activeTeachersCount: 2,
  halaqat: [
    {
      halaqaId: 1,
      name: 'أ',
      teacherName: 'م1',
      attendance: { present: 6, late: 2, absent: 2, leave: 5 },
      progress: [{ HIFZ: 60, TATHBEET: 80 }, { HIFZ: 70 }],
      markedThisWeek: 4,
      expectedThisWeek: 4,
    },
    {
      halaqaId: 2,
      name: 'ب',
      teacherName: 'م2',
      attendance: { present: 9, late: 0, absent: 1, leave: 0 },
      progress: [{ HIFZ: 40 }, { HIFZ: 60 }],
      markedThisWeek: 3,
      expectedThisWeek: 4,
    },
  ],
  students: [
    {
      studentId: 1,
      name: 'غائب',
      halaqaId: 1,
      attendance: { present: 5, late: 0, absent: 3, leave: 0 },
      progress: { HIFZ: 90 },
    },
    {
      studentId: 2,
      name: 'معذور',
      halaqaId: 1,
      attendance: { present: 2, late: 0, absent: 2, leave: 6 },
      progress: { HIFZ: 90 },
    },
    {
      studentId: 3,
      name: 'حد',
      halaqaId: 2,
      attendance: { present: 8, late: 0, absent: 0, leave: 0 },
      progress: { HIFZ: 75 },
    },
    {
      studentId: 4,
      name: 'منخفض',
      halaqaId: 2,
      attendance: { present: 8, late: 0, absent: 0, leave: 0 },
      progress: { HIFZ: 70, TATHBEET: 79 },
    },
  ],
  pendingRequests: [
    { kind: 'STUDENT', requestId: 1, name: 'x', submittedAt: '2026-11-01' },
    { kind: 'RE_ENROLLMENT', requestId: 2, name: 'y', submittedAt: '2026-11-01' },
  ],
};

describe('dashboard metrics (locked rules)', () => {
  it('attendance: LATE counts as present, LEAVE is excluded', () => {
    expect(attendanceRate({ present: 6, late: 2, absent: 2, leave: 5 })).toBe(80);
    expect(attendanceRate({ present: 6, late: 2, absent: 2, leave: 500 })).toBe(80);
    expect(attendanceRate({ present: 0, late: 0, absent: 0, leave: 4 })).toBeNull();
  });

  it('coverage ignores missing plan types instead of counting 0', () => {
    expect(studentCoverage({ HIFZ: 60 })).toBe(60);
    expect(studentCoverage({})).toBeNull();
    expect(halaqaCoverage([{ HIFZ: 60, TATHBEET: 80 }, { HIFZ: 70 }])).toBe(70);
  });

  it('score is 0.5 × attendance + 0.5 × coverage', () => {
    expect(performanceScore(80, 70)).toBe(75);
    expect(performanceScore(80, null)).toBeNull();
  });

  it('attention: ≥ 3 absences or coverage < 75', () => {
    expect(needsAttention(3, 90)).toBe(true);
    expect(needsAttention(2, 90)).toBe(false);
    expect(needsAttention(0, 74.9)).toBe(true);
    expect(needsAttention(0, 75)).toBe(false);
  });

  it('per-type averages are null when no student has the type', () => {
    const { averages, studentCounts } = typeAverages([{ HIFZ: 60, TATHBEET: 80 }, { HIFZ: 40 }]);
    expect(averages).toEqual({ HIFZ: 50, TATHBEET: 80, MURAJAA: null });
    expect(studentCounts).toEqual({ HIFZ: 2, TATHBEET: 1, MURAJAA: 0 });
  });

  it('ranks lowest score first, ties by Arabic name, null last', () => {
    const ranked = rankHalaqat([
      { name: 'ب', score: 80 },
      { name: 'ج', score: null },
      { name: 'أ', score: 80 },
      { name: 'د', score: 70 },
    ]);
    expect(ranked.map((row) => [row.name, row.rank])).toEqual([
      ['د', 1],
      ['أ', 2],
      ['ب', 3],
      ['ج', 4],
    ]);
  });

  it('builds the endpoint payload from the hand-checked fixture', () => {
    const result = buildTermDashboard(FIXTURE);
    expect(
      result.halaqat.map((row) => [
        row.name,
        row.rank,
        row.attendanceRate,
        row.coverage,
        row.score,
      ]),
    ).toEqual([
      ['ب', 1, 90, 50, 70],
      ['أ', 2, 80, 70, 75],
    ]);
    expect(result.halaqat[0].typeAverages).toEqual({ HIFZ: 50, TATHBEET: null, MURAJAA: null });
    expect(result.halaqat[0]).toMatchObject({ fullyMarkedThisWeek: false, notMarkedThisWeek: 1 });
    expect(result.kpis).toEqual({
      activeHalaqatCount: 2,
      activeTeachersCount: 2,
      activeStudentsCount: 4,
      pendingRequests: { students: 1, teachers: 0, reEnrollment: 1, total: 2 },
    });
    expect(result.totals?.attendanceRate).toBe(85);
    expect(result.totals?.typeAverages.HIFZ).toBe(57.5);
    expect(result.totals?.typeAverages.MURAJAA).toBeNull();
    expect(result.totals?.typeStudentCounts).toEqual({ HIFZ: 4, TATHBEET: 1, MURAJAA: 0 });
    expect(result.markingCompleteness).toEqual({
      fullyMarkedHalaqat: 1,
      totalHalaqat: 2,
      markedCells: 7,
      expectedCells: 8,
      notMarkedCells: 1,
    });
    expect(result.attentionStudents.map((student) => [student.name, student.halaqaName])).toEqual([
      ['غائب', 'أ'],
      ['منخفض', 'ب'],
    ]);
  });

  it('returns no term-scoped data when there is no active term', () => {
    const result = buildTermDashboard({ ...FIXTURE, term: null });
    expect(result.halaqat).toEqual([]);
    expect(result.kpis.activeHalaqatCount).toBe(0);
    expect(result.kpis.activeTeachersCount).toBe(2);
    expect(result.kpis.pendingRequests.total).toBe(2);
  });
});

describe('dashboard mock states match design rev 4.1', () => {
  const scores = (state: DashboardMockState) =>
    buildTermDashboard(dashboardMockInput(state)).halaqat.map((row) => [
      row.name,
      Math.round(row.score ?? -1),
    ]);

  it('populated', () => {
    const result = buildTermDashboard(dashboardMockInput(DashboardMockState.Populated));
    expect(scores(DashboardMockState.Populated)).toEqual([
      ['حلقة الناشئين', 70],
      ['حلقة الأترجة', 74],
      ['حلقة العصر', 80],
      ['حلقة المغرب', 84],
      ['حلقة النور', 86],
      ['حلقة الفجر', 89],
      ['حلقة المراجعة', 90],
      ['حلقة الفرقان', 91],
    ]);
    expect(result.kpis.activeStudentsCount).toBe(96);
    expect(result.attentionStudents).toHaveLength(9);
    expect(result.markingCompleteness).toMatchObject({ fullyMarkedHalaqat: 8, markedCells: 192 });
    const types = result.totals!.typeAverages;
    expect([types.HIFZ, types.TATHBEET, types.MURAJAA].map((value) => Math.round(value!))).toEqual([
      72, 73, 84,
    ]);
  });

  it('incomplete-marking', () => {
    const result = buildTermDashboard(dashboardMockInput(DashboardMockState.IncompleteMarking));
    expect(result.markingCompleteness).toMatchObject({
      fullyMarkedHalaqat: 6,
      markedCells: 181,
      expectedCells: 192,
    });
  });

  it('missing-type drops تثبيت instead of counting it as 0', () => {
    const result = buildTermDashboard(dashboardMockInput(DashboardMockState.MissingType));
    expect(scores(DashboardMockState.MissingType).slice(0, 3)).toEqual([
      ['حلقة الناشئين', 70],
      ['حلقة الأترجة', 75],
      ['حلقة العصر', 81],
    ]);
    expect(result.halaqat.find((row) => row.halaqaId === 15)?.score).toBe(94);
    expect(result.totals?.typeAverages.TATHBEET).toBeNull();
  });

  it('empty-worklists', () => {
    const result = buildTermDashboard(dashboardMockInput(DashboardMockState.EmptyWorklists));
    expect(result.attentionStudents).toEqual([]);
    expect(result.halaqat.every((row) => row.score! >= 80)).toBe(true);
  });

  it('noterm', () => {
    const result = buildTermDashboard(dashboardMockInput(DashboardMockState.NoTerm));
    expect(result.term).toBeNull();
    expect(result.kpis).toMatchObject({
      activeHalaqatCount: 0,
      activeStudentsCount: 0,
      activeTeachersCount: 8,
    });
    expect(result.kpis.pendingRequests).toEqual({
      students: 2,
      teachers: 1,
      reEnrollment: 1,
      total: 4,
    });
  });
});
