import { ScoreBand } from '../enums';
import { dashboardCopy } from '../i18n/dashboard-copy';
import { isLow, scoreBand, termDateLabels } from './dashboard-view';

describe('dashboard view helpers', () => {
  it('bands: < 75 low, 75–84 mid, ≥ 85 ok, null calm', () => {
    expect([74.9, 75, 84.9, 85, null].map(scoreBand)).toEqual([
      ScoreBand.Low,
      ScoreBand.Mid,
      ScoreBand.Mid,
      ScoreBand.Ok,
      ScoreBand.Ok,
    ]);
  });

  it('flags only real values below the cut-off', () => {
    expect([isLow(84, 85), isLow(85, 85), isLow(null, 85)]).toEqual([true, false, false]);
  });

  it('formats term dates and Arabic plurals', () => {
    expect(termDateLabels('2026-09-13', '2026-12-24')).toEqual({
      start: '13 سبتمبر',
      end: '24 ديسمبر 2026',
    });
    expect(termDateLabels('2026-12-20', '2027-03-04').start).toBe('20 ديسمبر 2026');
    expect(dashboardCopy('ov.row_meta', { teacher: 'م', n: 10 })).toBe('م · 10 طلاب');
    expect(dashboardCopy('ov.row_meta', { teacher: 'م', n: 13 })).toBe('م · 13 طالبًا');
  });
});
