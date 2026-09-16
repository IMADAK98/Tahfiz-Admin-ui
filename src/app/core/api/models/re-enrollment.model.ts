/** GET /admin/re-enrollment-requests — OpenAPI GetPendingReEnrollmentRequestDto. */
export interface ReEnrollmentRequest {
  id: number | string;
  existingUserId: number | string;
  termId: number | string;
  appliedToCenterId: number | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  parentPhone?: string | null;
  guardianName?: string | null;
  identificationNumber?: string | null;
  passportNumber?: string | null;
  educationStage?: string | null;
  address?: string | null;
  birthDate?: string | null;
  surah_from?: string | null;
  surah_to?: string | null;
  hifzQuality?: string | null;
  isHafiz?: boolean | null;
  previousTermName?: string | null;
  halqaId?: number | string | null;
  halqaName?: string | null;
  suggestedTeacherId?: number | string | null;
  suggestedTeacherName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RejectReEnrollmentPayload {
  rejectionReason: string;
}
