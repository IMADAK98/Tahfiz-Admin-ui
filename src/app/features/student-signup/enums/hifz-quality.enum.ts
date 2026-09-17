/** Nest hifzQuality enum (live OpenAPI). */
export enum HifzQuality {
  Hafiz = 'HAFIZ',
  NonHafiz = 'NON_HAFIZ',
  Mutqen = 'MUTQEN',
  NonMutqen = 'NON_MUTQEN',
}

/**
 * UI memorization radios (mock 12) → Nest isHafiz + hifzQuality + optional surah range.
 */
export type MemorizationLevel = 'none' | 'partial' | 'khatm';

export function mapMemorizationToHifz(level: MemorizationLevel): {
  isHafiz: boolean;
  hifzQuality: HifzQuality;
  defaultSurahFrom: number;
  defaultSurahTo: number;
} {
  switch (level) {
    case 'khatm':
      return {
        isHafiz: true,
        hifzQuality: HifzQuality.Hafiz,
        defaultSurahFrom: 1,
        defaultSurahTo: 114,
      };
    case 'partial':
      return {
        isHafiz: false,
        hifzQuality: HifzQuality.NonHafiz,
        defaultSurahFrom: 1,
        defaultSurahTo: 1,
      };
    case 'none':
    default:
      return {
        isHafiz: false,
        hifzQuality: HifzQuality.NonHafiz,
        defaultSurahFrom: 1,
        defaultSurahTo: 1,
      };
  }
}
