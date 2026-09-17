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

/** Clamp 0–100; treat null/NaN as 0 (still a visible row). */
export function normalizePercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  if (n > 100) {
    return 100;
  }
  return Math.round(n);
}
