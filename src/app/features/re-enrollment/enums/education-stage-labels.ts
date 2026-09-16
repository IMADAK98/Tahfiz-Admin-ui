/** OpenAPI educationStage values use spaces e.g. `ELEMENTARY SCHOOL`. */
const EDUCATION_STAGE_LABELS: Record<string, string> = {
  'ELEMENTARY SCHOOL': 'ابتدائي',
  'MIDDLE SCHOOL': 'متوسط',
  'HIGH SCHOOL': 'ثانوي',
};

export function educationStageLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return EDUCATION_STAGE_LABELS[trimmed] ?? trimmed;
}
