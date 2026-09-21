/** ponytail: XOR national-id vs passport payload builder (mock 17).
 *  Keep in sync with center-signup-form.model.ts buildPendingCenterPayload(). */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const IdentityDocumentType = {
  NationalId: 'national_id',
  Passport: 'passport',
};

function buildPendingCenterPayload(form) {
  const payload = {
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

const base = {
  adminName: ' Admin ',
  adminEmail: ' a@b.com ',
  adminPhone: '050',
  adminBirthDate: '1990-01-01',
  adminAddress: ' Addr ',
  adminNationality: ' SA ',
  centerName: ' Center ',
  centerAddress: ' CAddr ',
  adminIdentificationNumber: ' 123 ',
  adminPassportNumber: ' AB1 ',
};

const idPayload = buildPendingCenterPayload({
  ...base,
  identityDocumentType: IdentityDocumentType.NationalId,
});
if (idPayload.adminIdentificationNumber !== '123' || idPayload.adminPassportNumber !== undefined) {
  throw new Error('expected national id only');
}

const passPayload = buildPendingCenterPayload({
  ...base,
  identityDocumentType: IdentityDocumentType.Passport,
});
if (passPayload.adminPassportNumber !== 'AB1' || passPayload.adminIdentificationNumber !== undefined) {
  throw new Error('expected passport only');
}

const dtoFieldNames = new Set([
  'centerName',
  'centerAddress',
  'adminName',
  'adminIdentificationNumber',
  'adminPassportNumber',
  'adminEmail',
  'adminPhone',
  'adminBirthDate',
  'adminAddress',
  'adminNationality',
]);
for (const payload of [idPayload, passPayload]) {
  if ('adminPassword' in payload || 'identityDocumentType' in payload) {
    throw new Error('must not send adminPassword or identityDocumentType');
  }
  for (const key of Object.keys(payload)) {
    if (!dtoFieldNames.has(key)) {
      throw new Error(`unexpected payload field: ${key}`);
    }
  }
}

function toIsoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateCenterSignupForm(form) {
  const errors = {};
  if (!form.adminName.trim()) errors.adminName = 'اسم المدير مطلوب';
  if (form.identityDocumentType === IdentityDocumentType.Passport) {
    if (!form.adminPassportNumber.trim()) errors.adminPassportNumber = 'رقم جواز السفر مطلوب';
  } else if (!form.adminIdentificationNumber.trim()) {
    errors.adminIdentificationNumber = 'رقم الهوية الوطنية مطلوب';
  }
  if (!form.adminEmail.trim()) errors.adminEmail = 'البريد الإلكتروني مطلوب';
  if (!form.adminPhone.trim()) errors.adminPhone = 'رقم الجوال مطلوب';
  if (!form.adminBirthDate) errors.adminBirthDate = 'تاريخ الميلاد مطلوب';
  if (!form.adminAddress.trim()) errors.adminAddress = 'عنوان المدير مطلوب';
  if (!form.adminNationality.trim()) errors.adminNationality = 'الجنسية مطلوبة';
  if (!form.centerName.trim()) errors.centerName = 'اسم المركز مطلوب';
  if (!form.centerAddress.trim()) errors.centerAddress = 'عنوان المركز مطلوب';
  return errors;
}

const emptyName = validateCenterSignupForm({
  ...base,
  adminName: '  ',
  identityDocumentType: IdentityDocumentType.NationalId,
});
if (emptyName.adminName !== 'اسم المدير مطلوب') {
  throw new Error('expected admin name required under adminName');
}
if (toIsoDate(new Date(2020, 0, 5)) !== '2020-01-05') {
  throw new Error('expected iso date');
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const signupTs = readFileSync(join(root, 'src/app/features/center-signup/center-signup.ts'), 'utf8');
if (!signupTs.includes('fields.applyMap(validateCenterSignupForm')) {
  throw new Error('center signup must apply client validation under fields');
}
if (signupTs.includes('errorMessage.set(validationError)')) {
  throw new Error('center signup must not dump client validation onto the top banner');
}

console.log('center-signup-self-check: ok');
