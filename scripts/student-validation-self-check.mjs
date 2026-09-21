import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const errors = {};
  if (!form.fullName.trim()) errors.name = 'الاسم الكامل مطلوب';
  if (!form.email.trim()) errors.email = 'البريد الإلكتروني مطلوب';
  if (!form.phone.trim()) errors.phone = 'رقم الجوال مطلوب';
  if (!form.educationStage) errors.educationStage = 'اختر المرحلة الدراسية';
  const identificationNumber = form.identificationNumber.trim();
  if (!identificationNumber) errors.identificationNumber = 'رقم الهوية مطلوب';
  else if (identificationNumber.length > 10) {
    errors.identificationNumber = 'رقم الهوية يجب ألا يتجاوز 10 خانات';
  }
  const passportNumber = form.passportNumber.trim();
  if (!passportNumber) errors.passportNumber = 'رقم الجواز مطلوب';
  else if (passportNumber.length > 10) {
    errors.passportNumber = 'رقم الجواز يجب ألا يتجاوز 10 خانات';
  }
  if (!form.address.trim()) errors.address = 'العنوان مطلوب';
  if (!form.birthDate.trim()) errors.birthDate = 'تاريخ الميلاد مطلوب';
  if (!form.parentPhone.trim()) errors.parentPhone = 'جوال ولي الأمر مطلوب';
  if (form.surahFrom === null || form.surahFrom < 1 || form.surahFrom > 114) {
    errors.surahFrom = 'أدخل سورة البداية (1 إلى 114)';
  }
  if (form.surahTo === null || form.surahTo < 1 || form.surahTo > 114) {
    errors.surahTo = 'أدخل سورة النهاية (1 إلى 114)';
  }
  if (!form.hifzQuality) errors.hifzQuality = 'اختر جودة الحفظ';
  if (!form.isHafiz) errors.isHafiz = 'اختر حالة الحفظ';
  return errors;
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

assert.deepEqual(validateStudentForm(validForm), {});
assert.equal(validateStudentForm({ ...validForm, educationStage: '' }).educationStage, 'اختر المرحلة الدراسية');
assert.equal(validateStudentForm({ ...validForm, surahFrom: 0 }).surahFrom, 'أدخل سورة البداية (1 إلى 114)');
assert.equal(validateStudentForm({ ...validForm, parentPhone: '' }).parentPhone, 'جوال ولي الأمر مطلوب');

const emptyName = validateStudentForm({ ...validForm, fullName: '  ', email: '', phone: '' });
assert.equal(emptyName.name, 'الاسم الكامل مطلوب');
assert.equal(emptyName.email, 'البريد الإلكتروني مطلوب');
assert.equal(emptyName.phone, 'رقم الجوال مطلوب');
assert.equal('fullName' in emptyName, false);

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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modalTs = readFileSync(
  join(root, 'src/app/features/students/student-form-modal/student-form-modal.ts'),
  'utf8',
);
if (!modalTs.includes('fields.applyMap(')) {
  throw new Error('student form must apply client validation under fields');
}
if (!modalTs.includes('untracked(')) {
  throw new Error('student modal open-reset must untrack so submit applyMap does not wipe the form');
}
if (modalTs.includes('errorMessage.set(validationError)')) {
  throw new Error('student form must not dump client validation onto the top banner');
}

const componentsScss = readFileSync(join(root, 'src/styles/_components.scss'), 'utf8');
if (!componentsScss.includes(':has(+ [required])::after')) {
  throw new Error('required labels must get a * from shared CSS, not per-form markup');
}

console.log('student-validation-self-check: ok');
