import {
  parseLocalIsoDate,
  parseLocalYearMonth,
  toLocalIsoDate,
  toLocalYearMonth,
} from './local-date';

describe('local-date', () => {
  const riyadhOffset = -new Date(2026, 9, 31).getTimezoneOffset() === 180;
  const utcOffset = new Date(2026, 9, 31).getTimezoneOffset() === 0;

  it('formats a local Date as yyyy-MM-dd', () => {
    expect(toLocalIsoDate(new Date(2026, 9, 31))).toBe('2026-10-31');
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('parses yyyy-MM-dd with the local calendar day', () => {
    const parsed = parseLocalIsoDate('2026-10-31');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(31);
    expect(toLocalIsoDate(parsed)).toBe('2026-10-31');
    expect(toLocalIsoDate(parseLocalIsoDate('2026-01-05'))).toBe('2026-01-05');
  });

  it('reads the calendar prefix of a full ISO timestamp', () => {
    const parsed = parseLocalIsoDate('2026-11-27T00:00:00.000Z');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(10);
    expect(parsed.getDate()).toBe(27);
    expect(toLocalIsoDate(parsed)).toBe('2026-11-27');
    expect(toLocalIsoDate(parseLocalIsoDate('2026-11-27T00:00:00.000+03:00'))).toBe('2026-11-27');
    expect(toLocalIsoDate(parseLocalIsoDate('2026-01-05T23:59:59.999Z'))).toBe('2026-01-05');
  });

  it('returns an invalid date when there is no YYYY-MM-DD prefix', () => {
    for (const value of ['', '   ', '2026-11', '2026/11/27', 'not-a-date']) {
      expect(Number.isNaN(parseLocalIsoDate(value).getTime())).toBe(true);
    }
  });

  it('round-trips a month as yyyy-MM', () => {
    const parsed = parseLocalYearMonth('2026-10');
    expect(toLocalIsoDate(parsed)).toBe('2026-10-01');
    expect(toLocalYearMonth(parsed)).toBe('2026-10');
    expect(toLocalYearMonth(new Date(2026, 9, 31))).toBe('2026-10');
  });

  it('keeps 31 Oct when toISOString would move it in Asia/Riyadh', () => {
    const picked = new Date(2026, 9, 31);
    expect(toLocalIsoDate(picked)).toBe('2026-10-31');
    const utcDay = picked.toISOString().slice(0, 10);
    if (riyadhOffset) {
      expect(utcDay).toBe('2026-10-30');
    } else if (utcOffset) {
      expect(utcDay).toBe('2026-10-31');
    } else {
      throw new Error(`run this spec in UTC or Asia/Riyadh, offset ${picked.getTimezoneOffset()}`);
    }
  });
});
