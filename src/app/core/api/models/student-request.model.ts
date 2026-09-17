import { EducationStage, HifzQuality } from './student.model';

/**
 * GET /admin/student-requests — OpenAPI leaves `data` items untyped (`object`).
 * Live entity uses snake_case `surah_from` / `surah_to`; create DTO uses camelCase.
 * Ids may be JSON strings.
 */
export interface StudentRequestApiRecord {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  educationStage?: EducationStage | string | null;
  identificationNumber?: string | null;
  passportNumber?: string | null;
  address?: string | null;
  birthDate?: string | null;
  parentPhone?: string | null;
  surah_from?: number | string | null;
  surah_to?: number | string | null;
  surahFrom?: number | string | null;
  surahTo?: number | string | null;
  hifzQuality?: HifzQuality | string | null;
  isHafiz?: boolean | null;
  appliedToCenterId?: number | string | null;
  termId?: number | string | null;
  existingUserId?: number | string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** POST /admin/student-requests/{id}/reject — rejectionReason required. */
export interface RejectStudentRequestPayload {
  rejectionReason: string;
}
