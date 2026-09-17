import { TeacherQualification } from '../../../core/api/models/teacher.model';

export const TEACHER_QUALIFICATION_OPTIONS: ReadonlyArray<{ value: TeacherQualification; label: string }> = [
  { value: 'HIGH_SCHOOL', label: 'ثانوية عامة' },
  { value: 'DIPLOMA', label: 'دبلوم' },
  { value: 'BACHELOR', label: 'بكالوريوس' },
  { value: 'MASTER', label: 'ماجستير' },
  { value: 'PHD', label: 'دكتوراه' },
  { value: 'OTHER', label: 'أخرى' },
];

export function teacherQualificationLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return TEACHER_QUALIFICATION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
