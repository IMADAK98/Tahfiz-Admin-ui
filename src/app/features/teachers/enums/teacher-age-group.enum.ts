import { TeacherAgeGroup } from '../../../core/api/models/teacher.model';

/**
 * mock 07 shows numeric age ranges (7–9 · 10–15 · 16–18 · كبار · نساء) but the live
 * teachingAgeGroup enum is school-stage based with no "نساء" option — labels follow the
 * verified live contract, not the static mock text.
 */
export const TEACHER_AGE_GROUP_OPTIONS: ReadonlyArray<{ value: TeacherAgeGroup; label: string }> = [
  { value: 'PRESCHOOL', label: 'ما قبل المدرسة' },
  { value: 'PRIMARY_LOWER', label: 'ابتدائي — الصفوف الأولى' },
  { value: 'PRIMARY_UPPER', label: 'ابتدائي — الصفوف العليا' },
  { value: 'MIDDLE_SCHOOL', label: 'متوسط' },
  { value: 'HIGH_SCHOOL', label: 'ثانوي' },
  { value: 'UNIVERSITY', label: 'جامعي' },
  { value: 'ADULTS', label: 'كبار' },
];

export function teacherAgeGroupLabel(value: string): string {
  return TEACHER_AGE_GROUP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function teacherAgeGroupsLabel(values: readonly string[] | null | undefined): string {
  if (!values?.length) {
    return '—';
  }
  return values.map(teacherAgeGroupLabel).join(' · ');
}
