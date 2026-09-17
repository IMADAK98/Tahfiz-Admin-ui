/** ponytail: XOR national-id vs passport payload builder (mock 17).
 *  Keep in sync with center-signup-form.model.ts buildPendingCenterPayload(). */

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

function toIsoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateCenterSignupForm(form) {
  if (!form.adminName.trim()) return 'اسم المدير مطلوب';
  if (form.identityDocumentType === IdentityDocumentType.Passport) {
    if (!form.adminPassportNumber.trim()) return 'رقم جواز السفر مطلوب';
  } else if (!form.adminIdentificationNumber.trim()) {
    return 'رقم الهوية الوطنية مطلوب';
  }
  if (!form.adminEmail.trim()) return 'البريد الإلكتروني مطلوب';
  if (!form.adminPhone.trim()) return 'رقم الجوال مطلوب';
  if (!form.adminBirthDate) return 'تاريخ الميلاد مطلوب';
  if (!form.adminAddress.trim()) return 'عنوان المدير مطلوب';
  if (!form.adminNationality.trim()) return 'الجنسية مطلوبة';
  if (!form.centerName.trim()) return 'اسم المركز مطلوب';
  if (!form.centerAddress.trim()) return 'عنوان المركز مطلوب';
  return null;
}

if (validateCenterSignupForm({ ...base, adminName: '  ', identityDocumentType: IdentityDocumentType.NationalId }) !== 'اسم المدير مطلوب') {
  throw new Error('expected admin name required');
}
if (toIsoDate(new Date(2020, 0, 5)) !== '2020-01-05') {
  throw new Error('expected iso date');
}

console.log('center-signup-self-check: ok');
