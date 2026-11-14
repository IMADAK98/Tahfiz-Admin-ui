/**
 * Nest planItemType → UI labels حفظ / تثبيت / مراجعة.
 * LEAVE/attendance chip rules do NOT apply here.
 */
export enum ProgressPlanItemType {
  Hifz = 'HIFZ',
  Tathbeet = 'TATHBEET',
  Murajaa = 'MURAJAA',
}

export type ProgressBarKind = 'hifz' | 'tath' | 'mur';

export interface ProgressTypeView {
  kind: ProgressBarKind;
  labelAr: string;
  barClass: string;
  badgeClass: string;
}

const VIEWS: Record<string, ProgressTypeView> = {
  HIFZ: {
    kind: 'hifz',
    labelAr: 'حفظ',
    barClass: '',
    badgeClass: 'type-badge hifz',
  },
  TATHBEET: {
    kind: 'tath',
    labelAr: 'تثبيت',
    barClass: 'is-tath',
    badgeClass: 'type-badge tath',
  },
  MURAJAA: {
    kind: 'mur',
    labelAr: 'مراجعة',
    barClass: 'is-mur',
    badgeClass: 'type-badge mur',
  },
};

export function mapPlanItemType(type: string | null | undefined): ProgressTypeView {
  if (type && VIEWS[type]) {
    return VIEWS[type];
  }
  return {
    kind: 'hifz',
    labelAr: type ?? '—',
    barClass: '',
    badgeClass: 'type-badge hifz',
  };
}

/**
 * Real percent, no upper cap (115 stays 115). null/undefined = the student has no
 * such plan type → null, never 0. NaN/negative → 0.
 */
export function normalizePercent(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.round(n);
}

export function formatPercent(value: number | null): string {
  return value == null ? '—' : `${value}%`;
}

/** Bar fill only stops at full width; the label keeps the real value. */
export function percentBarWidth(value: number | null): number {
  return Math.min(value ?? 0, 100);
}
