import { PendingCenterRequest } from '../api/models/pending-center.model';

export interface CenterSignupFormValues {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminBirthDate: string;
  adminAddress: string;
  adminNationality: string;
  centerName: string;
  centerAddress: string;
  adminIdentificationNumber: string;
  adminPassportNumber: string;
  usePassport: boolean;
}

/** Build API payload — XOR national ID or passport per mock 17. */
export function buildPendingCenterPayload(form: CenterSignupFormValues): PendingCenterRequest {
  const payload: PendingCenterRequest = {
    adminName: form.adminName.trim(),
    adminEmail: form.adminEmail.trim(),
    adminPhone: form.adminPhone.trim(),
    adminBirthDate: form.adminBirthDate,
    adminAddress: form.adminAddress.trim(),
    adminNationality: form.adminNationality.trim(),
    centerName: form.centerName.trim(),
    centerAddress: form.centerAddress.trim(),
  };

  if (form.usePassport) {
    payload.adminPassportNumber = form.adminPassportNumber.trim();
  } else {
    payload.adminIdentificationNumber = form.adminIdentificationNumber.trim();
  }

  return payload;
}
