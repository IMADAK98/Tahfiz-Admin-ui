import { formatPercent, normalizePercent, percentBarWidth } from './progress-plan-item-type.enum';

describe('normalizePercent', () => {
  it('keeps real values above 100', () => {
    expect(normalizePercent(115)).toBe(115);
    expect(normalizePercent(200)).toBe(200);
    expect(normalizePercent('115')).toBe(115);
    expect(normalizePercent(114.6)).toBe(115);
  });

  it('keeps a real 0 and in-range values', () => {
    expect(normalizePercent(0)).toBe(0);
    expect(normalizePercent(25)).toBe(25);
    expect(normalizePercent(100)).toBe(100);
  });

  it('maps negative and invalid values to 0 as before', () => {
    expect(normalizePercent(-5)).toBe(0);
    expect(normalizePercent(Number.NaN)).toBe(0);
    expect(normalizePercent(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizePercent('abc')).toBe(0);
  });

  it('keeps null/missing as null, never 0', () => {
    expect(normalizePercent(null)).toBeNull();
    expect(normalizePercent(undefined)).toBeNull();
  });
});

describe('formatPercent', () => {
  it("shows '—' for null and the real number otherwise", () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(115)).toBe('115%');
    expect(formatPercent(200)).toBe('200%');
  });
});

describe('percentBarWidth', () => {
  it('stops the bar at full width and leaves null empty', () => {
    expect(percentBarWidth(200)).toBe(100);
    expect(percentBarWidth(115)).toBe(100);
    expect(percentBarWidth(40)).toBe(40);
    expect(percentBarWidth(0)).toBe(0);
    expect(percentBarWidth(null)).toBe(0);
  });
});
