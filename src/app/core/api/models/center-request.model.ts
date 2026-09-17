/**
 * GET /system-admin/center-requests — OpenAPI leaves `data` items untyped (`object`).
 * Fields from PendingCenterRequest; ids may be JSON strings. No students/terms/halaqat counts.
 */
export interface CenterRequestApiRecord {
  id: number | string;
  centerName?: string | null;
  centerAddress?: string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  adminPhone?: string | null;
  adminIdentificationNumber?: string | null;
  adminPassportNumber?: string | null;
  adminBirthDate?: string | null;
  adminNationality?: string | null;
  adminAddress?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string | null;
  centerId?: number | string | null;
  center?: { id?: number | string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** POST /system-admin/center-requests/{id}/reject — RejectPendingCenterDto. */
export interface RejectCenterRequestPayload {
  rejectionReason: string;
}
