/** Nest educationStage — keep spaces exactly as live OpenAPI. */
export enum EducationStage {
  Kindergarten = 'KINDERGARTEN',
  ElementarySchool = 'ELEMENTARY SCHOOL',
  MiddleSchool = 'MIDDLE SCHOOL',
  HighSchool = 'HIGH SCHOOL',
  University = 'UNIVERSITY',
  Postgraduate = 'POSTGRADUATE',
}

export const EDUCATION_STAGE_OPTIONS: ReadonlyArray<{ value: EducationStage; labelKey: string; labelAr: string }> = [
  { value: EducationStage.Kindergarten, labelKey: 'studentSignup.education.kindergarten', labelAr: 'روضة' },
  { value: EducationStage.ElementarySchool, labelKey: 'studentSignup.education.elementary', labelAr: 'ابتدائي' },
  { value: EducationStage.MiddleSchool, labelKey: 'studentSignup.education.middle', labelAr: 'متوسط' },
  { value: EducationStage.HighSchool, labelKey: 'studentSignup.education.high', labelAr: 'ثانوي' },
  { value: EducationStage.University, labelKey: 'studentSignup.education.university', labelAr: 'جامعة' },
  { value: EducationStage.Postgraduate, labelKey: 'studentSignup.education.postgraduate', labelAr: 'دراسات عليا' },
];
