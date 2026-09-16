import { TeacherTajweedLevel } from '../../../core/api/models/teacher.model';

export const TEACHER_TAJWEED_LEVEL_OPTIONS: ReadonlyArray<{ value: TeacherTajweedLevel; label: string }> = [
  { value: 'BEGINNER', label: 'مبتدئ' },
  { value: 'INTERMEDIATE', label: 'جيد' },
  { value: 'ADVANCED', label: 'متقن' },
];

export function teacherTajweedLevelLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return TEACHER_TAJWEED_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
