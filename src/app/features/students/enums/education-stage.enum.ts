import { EducationStage } from '../../../core/api/models/student.model';

export const EDUCATION_STAGE_OPTIONS: ReadonlyArray<{ value: EducationStage; label: string }> = [
  { value: 'KINDERGARTEN', label: 'روضة' },
  { value: 'ELEMENTARY SCHOOL', label: 'ابتدائي' },
  { value: 'MIDDLE SCHOOL', label: 'متوسط' },
  { value: 'HIGH SCHOOL', label: 'ثانوي' },
  { value: 'UNIVERSITY', label: 'جامعي' },
  { value: 'POSTGRADUATE', label: 'دراسات عليا' },
];

export function educationStageLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return EDUCATION_STAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
