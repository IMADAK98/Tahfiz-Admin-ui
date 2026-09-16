import { PendingCenterRequest } from './pending-center-request.dto';
import { IdentityDocumentType } from '../enums/identity-document-type.enum';

export interface CenterSignupFormModel {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminBirthDate: string;
  adminAddress: string;
  adminNationality: string;
  centerName: string;
  centerAddress: string;
  identityDocumentType: IdentityDocumentType;
  adminIdentificationNumber: string;
  adminPassportNumber: string;
}

export function createEmptyCenterSignupForm(): CenterSignupFormModel {
  return {
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminBirthDate: '',
    adminAddress: '',
    adminNationality: '',
    centerName: '',
    centerAddress: '',
    identityDocumentType: IdentityDocumentType.NationalId,
    adminIdentificationNumber: '',
    adminPassportNumber: '',
  };
}

/** Build API payload — XOR national ID or passport per mock 17. */
export function buildPendingCenterPayload(form: CenterSignupFormModel): PendingCenterRequest {
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

  if (form.identityDocumentType === IdentityDocumentType.Passport) {
    payload.adminPassportNumber = form.adminPassportNumber.trim();
  } else {
    payload.adminIdentificationNumber = form.adminIdentificationNumber.trim();
  }

  return payload;
}
