import { DashboardMockState, ScoreBand, parseDashboardMockState } from '../enums';
import { dashboardCopy } from '../i18n/dashboard-copy';
import { dashboardMockInput } from '../mock/dashboard-mock-fixtures';
import { buildTermDashboard } from '../mock/dashboard-metrics';
import { scoreBand, studentGroups, termDateLabels, weekRangeLabel } from './dashboard-view';

const dashboard = (state: DashboardMockState) => buildTermDashboard(dashboardMockInput(state));

describe('dashboard view helpers', () => {
  it('bands: < 75 low, 75–84 mid, ≥ 85 ok', () => {
    expect([74.9, 75, 84.9, 85].map(scoreBand)).toEqual([
      ScoreBand.Low,
      ScoreBand.Mid,
      ScoreBand.Mid,
      ScoreBand.Ok,
    ]);
  });

  it('student groups: absence first, alphabetical, 3 shown', () => {
    const groups = studentGroups(dashboard(DashboardMockState.Populated).attentionStudents);
    expect(groups.map((group) => [group.absence, group.total, group.hidden])).toEqual([
      [true, 5, 2],
      [false, 4, 1],
    ]);
    expect(groups[0].students.map((student) => student.name)).toEqual([
      'إبراهيم بن ماجد السبيعي',
      'تركي بن بندر المالكي',
      'سلمان بن ناصر العنزي',
    ]);
  });

  it('formats design dates and Arabic plurals', () => {
    const { start, end } = termDateLabels('2026-09-13', '2026-12-24');
    expect(dashboardCopy('term.meta', { start, end, days: 41 })).toBe(
      '13 سبتمبر – 24 ديسمبر 2026 · 41 يومًا دراسيًا حتى اليوم',
    );
    expect(weekRangeLabel('2026-11-08', '2026-11-12')).toBe('الأحد 8 – الخميس 12 نوفمبر');
    expect(dashboardCopy('ov.row_meta', { teacher: 'م', n: 10 })).toBe('م · 10 طلاب');
    expect(dashboardCopy('ws.more', { n: 2 })).toBe('وآخران في هذه المجموعة');
    expect(dashboardCopy('ws.more', { n: 0 })).toBe('');
    expect(dashboardCopy('mc.big', { done: '', all: 8 }).trim()).toBe('من 8 حلقات');
    expect(dashboardCopy('pc.n', { n: 87 })).toBe('87 طالبًا في خطتهم البند');
  });

  it('mock state param is whitelisted', () => {
    expect(parseDashboardMockState('noterm')).toBe(DashboardMockState.NoTerm);
    expect(parseDashboardMockState('<script>')).toBe(DashboardMockState.Populated);
    expect(parseDashboardMockState(null)).toBe(DashboardMockState.Populated);
  });
});
