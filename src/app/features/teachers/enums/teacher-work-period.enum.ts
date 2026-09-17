import { TeacherWorkPeriod } from '../../../core/api/models/teacher.model';

/** mock 07 lists الفجر/الظهر/العصر/المغرب/العشاء/عن بُعد — live enum has no Duhur/remote but adds WEEKDAYS. */
export const TEACHER_WORK_PERIOD_OPTIONS: ReadonlyArray<{ value: TeacherWorkPeriod; label: string }> = [
  { value: 'AFTER_FAJR', label: 'بعد الفجر' },
  { value: 'AFTER_ASR', label: 'بعد العصر' },
  { value: 'AFTER_MAGHRIB', label: 'بعد المغرب' },
  { value: 'AFTER_ISHA', label: 'بعد العشاء' },
  { value: 'WEEKDAYS', label: 'أيام الأسبوع' },
];

export function teacherWorkPeriodLabel(value: string): string {
  return TEACHER_WORK_PERIOD_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function teacherWorkPeriodsLabel(values: readonly string[] | null | undefined): string {
  if (!values?.length) {
    return '—';
  }
  return values.map(teacherWorkPeriodLabel).join(' · ');
}
