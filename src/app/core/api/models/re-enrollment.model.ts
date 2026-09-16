/** GET /admin/re-enrollment-requests — aligns with GetPendingReEnrollmentRequestDto (OpenAPI). */
export interface ReEnrollmentRequest {
  id: number;
  existingUserId: number;
  termId: number;
  appliedToCenterId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string | null;
  educationStage?: string | null;
  /** Student display name — API may expose `studentName` or `name`. */
  studentName?: string | null;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  identificationNumber?: string | null;
  passportNumber?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  previousTermName?: string | null;
  termName?: string | null;
  halqaId?: number | null;
  halqaName?: string | null;
  memorizationStatus?: string | null;
  suggestedTeacherId?: number | null;
  suggestedTeacherName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RejectReEnrollmentPayload {
  rejectionReason: string;
}
