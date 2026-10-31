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
