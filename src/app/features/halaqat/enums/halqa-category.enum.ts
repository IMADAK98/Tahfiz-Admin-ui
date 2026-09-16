import { HalqaCategory } from '../../../core/api/models/halqa.model';

export const HALQA_CATEGORY_OPTIONS: ReadonlyArray<{ value: HalqaCategory; label: string }> = [
  { value: 'PRIMARY', label: 'ابتدائي' },
  { value: 'SECONDARY', label: 'متوسط' },
  { value: 'HIGHER', label: 'ثانوي' },
  { value: 'SPECIAL', label: 'متميزين' },
  { value: 'TALQIN', label: 'تلقين' },
  { value: 'TELAWAH', label: 'تلاوة' },
];

export function halqaCategoryLabel(category: HalqaCategory | null | undefined): string {
  if (!category) {
    return '—';
  }
  return HALQA_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}
