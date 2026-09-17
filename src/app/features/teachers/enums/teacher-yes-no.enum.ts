/** Shared نعم/لا select options for the boolean profile fields (hasCertificate, hasSanadInHifz, hasIjazahInHifz). */
export const TEACHER_YES_NO_OPTIONS: ReadonlyArray<{ value: 'true' | 'false'; label: string }> = [
  { value: 'true', label: 'نعم' },
  { value: 'false', label: 'لا' },
];

export function yesNoLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value ? 'نعم' : 'لا';
}
