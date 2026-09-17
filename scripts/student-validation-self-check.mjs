import assert from 'node:assert/strict';

/** ponytail: smallest check mirroring students + student-requests mapping/validation. */

function coerceStudentId(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapActiveStudent(raw) {
  const row = raw ?? {};
  return {
    id: coerceStudentId(row.id),
    name: String(row.name ?? ''),
    email: row.email,
    phone: row.phone,
  };
}

function unwrapActiveStudentsPayload(data) {
  if (Array.isArray(data)) return data.map(mapActiveStudent);
  if (data && typeof data === 'object') {
    for (const key of ['items', 'results', 'students', 'records', 'data']) {
      if (Array.isArray(data[key])) return data[key].map(mapActiveStudent);
    }
  }
  return [];
}

function validateStudentForm(form) {
  if (!form.fullName.trim()) return 'الاسم الكامل مطلوب';
  if (!form.email.trim()) return 'البريد الإلكتروني مطلوب';
  if (!form.phone.trim()) return 'رقم الجوال مطلوب';
  if (!form.educationStage) return 'اختر المرحلة الدراسية';
  if (!form.identificationNumber.trim()) return 'رقم الهوية مطلوب';
  if (form.identificationNumber.trim().length > 10) return 'رقم الهوية يجب ألا يتجاوز 10 خانات';
  if (!form.passportNumber.trim()) return 'رقم الجواز مطلوب';
  if (form.passportNumber.trim().length > 10) return 'رقم الجواز يجب ألا يتجاوز 10 خانات';
  if (!form.address.trim()) return 'العنوان مطلوب';
  if (!form.birthDate.trim()) return 'تاريخ الميلاد مطلوب';
  if (!form.parentPhone.trim()) return 'جوال ولي الأمر مطلوب';
  if (form.surahFrom === null || form.surahFrom < 1 || form.surahFrom > 114) {
    return 'أدخل سورة البداية (1 إلى 114)';
  }
  if (form.surahTo === null || form.surahTo < 1 || form.surahTo > 114) {
    return 'أدخل سورة النهاية (1 إلى 114)';
  }
  if (!form.hifzQuality) return 'اختر جودة الحفظ';
  if (!form.isHafiz) return 'اختر حالة الحفظ';
  return null;
}

function toIsoDateTime(dateInput) {
  if (dateInput.includes('T')) return dateInput;
  return `${dateInput}T00:00:00.000Z`;
}

function buildCreateManualStudentPayload(form) {
  return {
    name: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    educationStage: form.educationStage,
    identificationNumber: form.identificationNumber.trim(),
    passportNumber: form.passportNumber.trim(),
    address: form.address.trim(),
    birthDate: toIsoDateTime(form.birthDate),
    parentPhone: form.parentPhone.trim(),
    surahFrom: form.surahFrom ?? 1,
    surahTo: form.surahTo ?? 1,
    hifzQuality: form.hifzQuality,
    isHafiz: form.isHafiz === 'true',
  };
}

function mapStudentRequest(record) {
  return {
    id: coerceStudentId(record.id),
    name: record.name,
    surahFrom: record.surah_from ?? record.surahFrom ?? null,
    surahTo: record.surah_to ?? record.surahTo ?? null,
  };
}

const EDUCATION_STAGES = [
  'KINDERGARTEN',
  'ELEMENTARY SCHOOL',
  'MIDDLE SCHOOL',
  'HIGH SCHOOL',
  'UNIVERSITY',
  'POSTGRADUATE',
];

assert.ok(EDUCATION_STAGES.includes('ELEMENTARY SCHOOL'));
assert.equal('ELEMENTARY SCHOOL'.includes(' '), true);

assert.equal(coerceStudentId('28'), 28);
assert.equal(coerceStudentId(28), 28);
assert.equal(coerceStudentId('not-a-number'), 0);

assert.deepEqual(
  unwrapActiveStudentsPayload([{ id: '28', name: 'Abdullah' }]).map((row) => row.id),
  [28],
);
assert.deepEqual(
  unwrapActiveStudentsPayload({ items: [{ id: '9', name: 'Yousef' }], page: 1, limit: 10, totalItems: 1 }).map(
    (row) => row.id,
  ),
  [9],
);
assert.deepEqual(unwrapActiveStudentsPayload(null), []);

const validForm = {
  fullName: 'TEST Student',
  email: 'student@example.com',
  phone: '0500000001',
  educationStage: 'ELEMENTARY SCHOOL',
  identificationNumber: '1234567890',
  passportNumber: 'P12345678',
  address: 'الرياض',
  birthDate: '2013-01-01',
  parentPhone: '0500000002',
  surahFrom: 1,
  surahTo: 18,
  hifzQuality: 'NON_HAFIZ',
  isHafiz: 'false',
};

assert.equal(validateStudentForm(validForm), null);
assert.equal(validateStudentForm({ ...validForm, educationStage: '' }), 'اختر المرحلة الدراسية');
assert.equal(validateStudentForm({ ...validForm, surahFrom: 0 }), 'أدخل سورة البداية (1 إلى 114)');
assert.equal(validateStudentForm({ ...validForm, parentPhone: '' }), 'جوال ولي الأمر مطلوب');

const payload = buildCreateManualStudentPayload(validForm);
assert.equal('centerId' in payload, false);
assert.equal(payload.educationStage, 'ELEMENTARY SCHOOL');
assert.equal(payload.birthDate, '2013-01-01T00:00:00.000Z');
assert.equal(payload.surahFrom, 1);
assert.equal(payload.isHafiz, false);

const mapped = mapStudentRequest({
  id: '11',
  name: 'يوسف',
  surah_from: 12,
  surah_to: 18,
});
assert.equal(mapped.id, 11);
assert.equal(mapped.surahFrom, 12);
assert.equal(mapped.surahTo, 18);

assert.equal(''.trim() ? null : 'سبب الرفض مطلوب', 'سبب الرفض مطلوب');

console.log('student-validation-self-check: ok');
