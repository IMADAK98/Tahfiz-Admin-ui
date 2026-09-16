/** POST /pending-center-request — manager + center fields (mock 17). */
export interface PendingCenterRequest {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminBirthDate: string;
  adminAddress: string;
  adminNationality: string;
  centerName: string;
  centerAddress: string;
  adminIdentificationNumber?: string;
  adminPassportNumber?: string;
}
