import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** ponytail: smallest check mirroring teachers/dto/teacher-form.model.ts + teacher-detail-view.model.ts logic. */

function coerceTeacherId(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function yesNoToBool(value) {
  return value === 'true';
}

function validateTeacherForm(form, mode) {
  const errors = {};
  if (!form.fullName.trim()) errors[mode === 'add' ? 'teacherName' : 'name'] = 'الاسم الكامل مطلوب';
  if (!form.email.trim()) errors.email = 'البريد الإلكتروني مطلوب';
  if (!form.phone.trim()) errors.phone = 'رقم الجوال مطلوب';
  if (mode === 'add') {
    if (!form.nationality.trim()) errors.nationality = 'الجنسية مطلوبة';
    if (!form.address.trim()) errors.address = 'العنوان مطلوب';
    if (!form.birthDate.trim()) errors.birthDate = 'تاريخ الميلاد مطلوب';
  }
  if (!form.qualification) errors.qualification = 'اختر المؤهل الأكاديمي';
  if (!form.hasCertificate) errors.hasCertificate = 'اختر حالة شهادة مكنون';
  const minJuz = mode === 'add' ? 1 : 0;
  if (
    form.numberOfMemorizedJuz === null ||
    form.numberOfMemorizedJuz < minJuz ||
    form.numberOfMemorizedJuz > 30
  ) {
    errors.numberOfMemorizedJuz = `أدخل عدد الأجزاء المحفوظة (${minJuz} إلى 30)`;
  }
  if (!form.hasSanadInHifz) errors.hasSanadInHifz = 'اختر حالة السند';
  if (!form.hasIjazahInHifz) errors.hasIjazahInHifz = 'اختر حالة الإجازة';
  if (!form.tajweedLevel) errors.tajweedLevel = 'اختر مستوى التجويد';
  if (!form.ageGroups.length) errors.teachingAgeGroup = 'اختر فئة عمرية واحدة على الأقل';
  if (!form.workPeriods.length) errors.availableWorkPeriod = 'اختر فترة عمل واحدة على الأقل';
  return errors;
}

const validAddForm = {
  fullName: 'TEST Teacher',
  email: 'test@example.com',
  phone: '0500000001',
  nationality: 'سعودي',
  address: 'الرياض',
  birthDate: '1990-01-01',
  qualification: 'BACHELOR',
  hasCertificate: 'true',
  numberOfMemorizedJuz: 15,
  hasSanadInHifz: 'true',
  hasIjazahInHifz: 'false',
  tajweedLevel: 'ADVANCED',
  ageGroups: ['ADULTS'],
  workPeriods: ['AFTER_ASR'],
};

assert.deepEqual(validateTeacherForm(validAddForm, 'add'), {});
assert.equal(
  validateTeacherForm({ ...validAddForm, nationality: '' }, 'add').nationality,
  'الجنسية مطلوبة',
);
assert.equal(validateTeacherForm({ ...validAddForm, nationality: '' }, 'edit').nationality, undefined);
assert.equal(
  validateTeacherForm({ ...validAddForm, ageGroups: [] }, 'add').teachingAgeGroup,
  'اختر فئة عمرية واحدة على الأقل',
);
assert.equal(
  validateTeacherForm({ ...validAddForm, numberOfMemorizedJuz: 31 }, 'add').numberOfMemorizedJuz,
  'أدخل عدد الأجزاء المحفوظة (1 إلى 30)',
);
// CreatePendingTeacherRequestDto requires numberOfMemorizedJuz >= 1 (not 0 like update).
assert.equal(
  validateTeacherForm({ ...validAddForm, numberOfMemorizedJuz: 0 }, 'add').numberOfMemorizedJuz,
  'أدخل عدد الأجزاء المحفوظة (1 إلى 30)',
);
assert.equal(
  validateTeacherForm({ ...validAddForm, numberOfMemorizedJuz: 0 }, 'edit').numberOfMemorizedJuz,
  undefined,
);

assert.equal(coerceTeacherId('27'), 27);
assert.equal(coerceTeacherId(27), 27);
assert.equal(coerceTeacherId('not-a-number'), 0);

assert.equal(yesNoToBool('true'), true);
assert.equal(yesNoToBool('false'), false);
assert.equal(yesNoToBool(''), false);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modalTs = readFileSync(
  join(root, 'src/app/features/teachers/teacher-form-modal/teacher-form-modal.ts'),
  'utf8',
);
if (!modalTs.includes('fields.applyMap(this.teachersService.validate')) {
  throw new Error('teacher form must apply client validation under fields');
}

console.log('teacher-validation-self-check: ok');
