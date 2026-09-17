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

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateCenterSignupForm(form: CenterSignupFormModel): string | null {
  if (!form.adminName.trim()) {
    return 'اسم المدير مطلوب';
  }
  if (form.identityDocumentType === IdentityDocumentType.Passport) {
    if (!form.adminPassportNumber.trim()) {
      return 'رقم جواز السفر مطلوب';
    }
  } else if (!form.adminIdentificationNumber.trim()) {
    return 'رقم الهوية الوطنية مطلوب';
  }
  if (!form.adminEmail.trim()) {
    return 'البريد الإلكتروني مطلوب';
  }
  if (!form.adminPhone.trim()) {
    return 'رقم الجوال مطلوب';
  }
  if (!form.adminBirthDate) {
    return 'تاريخ الميلاد مطلوب';
  }
  if (!form.adminAddress.trim()) {
    return 'عنوان المدير مطلوب';
  }
  if (!form.adminNationality.trim()) {
    return 'الجنسية مطلوبة';
  }
  if (!form.centerName.trim()) {
    return 'اسم المركز مطلوب';
  }
  if (!form.centerAddress.trim()) {
    return 'عنوان المركز مطلوب';
  }
  return null;
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
