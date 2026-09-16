/** ponytail: XOR national-id vs passport payload builder (mock 17). */

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

  if (form.usePassport) {
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

const idPayload = buildPendingCenterPayload({ ...base, usePassport: false });
if (idPayload.adminIdentificationNumber !== '123' || idPayload.adminPassportNumber !== undefined) {
  throw new Error('expected national id only');
}

const passPayload = buildPendingCenterPayload({ ...base, usePassport: true });
if (passPayload.adminPassportNumber !== 'AB1' || passPayload.adminIdentificationNumber !== undefined) {
  throw new Error('expected passport only');
}

console.log('center-signup-self-check: ok');
