import { HifzQuality } from '../../../core/api/models/student.model';

export const HIFZ_QUALITY_OPTIONS: ReadonlyArray<{ value: HifzQuality; label: string }> = [
  { value: 'HAFIZ', label: 'حافظ' },
  { value: 'NON_HAFIZ', label: 'غير حافظ' },
  { value: 'MUTQEN', label: 'متقن' },
  { value: 'NON_MUTQEN', label: 'غير متقن' },
];

export function hifzQualityLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return HIFZ_QUALITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
