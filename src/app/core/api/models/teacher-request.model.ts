import { TeacherAgeGroup, TeacherQualification, TeacherTajweedLevel, TeacherWorkPeriod } from './teacher.model';

/**
 * GET /admin/teacher-requests — OpenAPI leaves `data` items untyped (`object`).
 * Shape assumed to mirror CreatePendingTeacherRequestDto + id/status per live discovery run.
 * Ids may be JSON strings.
 */
export interface TeacherRequestApiRecord {
  id: number | string;
  teacherName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  address?: string | null;
  birthDate?: string | null;
  qualification?: TeacherQualification | string | null;
  hasCertificate?: boolean | null;
  numberOfMemorizedJuz?: number | null;
  hasIjazahInHifz?: boolean | null;
  hasSanadInHifz?: boolean | null;
  tajweedLevel?: TeacherTajweedLevel | string | null;
  teachingAgeGroup?: (TeacherAgeGroup | string)[] | null;
  availableWorkPeriod?: (TeacherWorkPeriod | string)[] | null;
  centerId?: number | string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** POST /admin/teacher-requests/{id}/reject — RejectPendingTeacherRequestDto. */
export interface RejectTeacherRequestPayload {
  rejectionReason: string;
}
