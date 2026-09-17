export const STUDENT_YES_NO_OPTIONS: ReadonlyArray<{ value: 'true' | 'false'; label: string }> = [
  { value: 'true', label: 'نعم' },
  { value: 'false', label: 'لا' },
];

export function yesNoLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value ? 'نعم' : 'لا';
}
