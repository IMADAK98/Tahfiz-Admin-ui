import { RegisterTokenValidation } from './student-signup.model';

export type { RegisterTokenValidation };

/**
 * Live `GET /users/students/by-identification-number` row (auth: OpenAPI JWT;
 * live prove succeeded with **no** auth — see reg-link-e2e/FLOW.md).
 * Coerce `id` string→number at the call site.
 */
export interface IdentifiedStudent {
  id: number | string;
  name?: string;
  email?: string;
  phone?: string;
  identificationNumber?: string;
  passportNumber?: string;
  birthDate?: string;
  address?: string;
  nationality?: string;
  centerId?: number | string;
  isActive?: boolean;
  isReturningStudent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Nest `ActivateStudentDto` — `POST /center/activate-student`. */
export interface ActivateStudentRequest {
  token: string;
  /** Must be number (Nest class-validator rejects string). */
  studentId: number;
}

/**
 * localization-refactor / live OpenAPI success shape.
 * Stale GitHub main used `{ activated: true }` without requestId — ignore for Thafiz.
 */
export interface ActivateStudentResult {
  requestSubmitted?: boolean;
  requestId?: number | string;
  activated?: boolean;
}
