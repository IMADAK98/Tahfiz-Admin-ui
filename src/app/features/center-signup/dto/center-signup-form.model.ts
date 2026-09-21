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

/** Nest DTO keys so messages land under the input, not the top banner. */
export function validateCenterSignupForm(form: CenterSignupFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.adminName.trim()) {
    errors['adminName'] = 'اسم المدير مطلوب';
  }
  if (form.identityDocumentType === IdentityDocumentType.Passport) {
    if (!form.adminPassportNumber.trim()) {
      errors['adminPassportNumber'] = 'رقم جواز السفر مطلوب';
    }
  } else if (!form.adminIdentificationNumber.trim()) {
    errors['adminIdentificationNumber'] = 'رقم الهوية الوطنية مطلوب';
  }
  if (!form.adminEmail.trim()) {
    errors['adminEmail'] = 'البريد الإلكتروني مطلوب';
  }
  if (!form.adminPhone.trim()) {
    errors['adminPhone'] = 'رقم الجوال مطلوب';
  }
  if (!form.adminBirthDate) {
    errors['adminBirthDate'] = 'تاريخ الميلاد مطلوب';
  }
  if (!form.adminAddress.trim()) {
    errors['adminAddress'] = 'عنوان المدير مطلوب';
  }
  if (!form.adminNationality.trim()) {
    errors['adminNationality'] = 'الجنسية مطلوبة';
  }
  if (!form.centerName.trim()) {
    errors['centerName'] = 'اسم المركز مطلوب';
  }
  if (!form.centerAddress.trim()) {
    errors['centerAddress'] = 'عنوان المركز مطلوب';
  }
  return errors;
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
