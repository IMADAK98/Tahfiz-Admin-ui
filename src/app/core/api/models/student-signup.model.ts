/**
 * Nest educationStage — values include **spaces** (live OpenAPI).
 * Mirror in features/student-signup/enums/education-stage.enum.ts
 */
export type EducationStageValue =
  | 'KINDERGARTEN'
  | 'ELEMENTARY SCHOOL'
  | 'MIDDLE SCHOOL'
  | 'HIGH SCHOOL'
  | 'UNIVERSITY'
  | 'POSTGRADUATE';

export type HifzQualityValue = 'HAFIZ' | 'NON_HAFIZ' | 'MUTQEN' | 'NON_MUTQEN';

/** Nest `GET /register-token/validate/{token}` data (public). */
export interface RegisterTokenValidation {
  centerName: string;
  termName: string;
  expiresAt: string;
}

/**
 * Nest `CreatePendingStudentRequestDto` — public `POST /pending-student-request`.
 * Same fields as admin manual-create + required `token`.
 */
export interface CreatePendingStudentRequest {
  name: string;
  email: string;
  phone: string;
  educationStage: EducationStageValue | string;
  identificationNumber: string;
  passportNumber: string;
  address: string;
  /** ISO date-time string */
  birthDate: string;
  parentPhone: string;
  surahFrom: number;
  surahTo: number;
  hifzQuality: HifzQualityValue | string;
  isHafiz: boolean;
  token: string;
}

/** Optional thin success payload when Nest returns data (often null). */
export interface PendingStudentRequestResult {
  id?: number | string;
  [key: string]: unknown;
}
