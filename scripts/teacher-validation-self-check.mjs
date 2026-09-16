import assert from 'node:assert/strict';

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
  if (!form.fullName.trim()) return 'الاسم الكامل مطلوب';
  if (!form.email.trim()) return 'البريد الإلكتروني مطلوب';
  if (!form.phone.trim()) return 'رقم الجوال مطلوب';
  if (mode === 'add') {
    if (!form.nationality.trim()) return 'الجنسية مطلوبة';
    if (!form.address.trim()) return 'العنوان مطلوب';
    if (!form.birthDate.trim()) return 'تاريخ الميلاد مطلوب';
  }
  if (!form.qualification) return 'اختر المؤهل الأكاديمي';
  if (!form.hasCertificate) return 'اختر حالة شهادة مكنون';
  const minJuz = mode === 'add' ? 1 : 0;
  if (
    form.numberOfMemorizedJuz === null ||
    form.numberOfMemorizedJuz < minJuz ||
    form.numberOfMemorizedJuz > 30
  ) {
    return `أدخل عدد الأجزاء المحفوظة (${minJuz} إلى 30)`;
  }
  if (!form.hasSanadInHifz) return 'اختر حالة السند';
  if (!form.hasIjazahInHifz) return 'اختر حالة الإجازة';
  if (!form.tajweedLevel) return 'اختر مستوى التجويد';
  if (!form.ageGroups.length) return 'اختر فئة عمرية واحدة على الأقل';
  if (!form.workPeriods.length) return 'اختر فترة عمل واحدة على الأقل';
  return null;
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

assert.equal(validateTeacherForm(validAddForm, 'add'), null);
assert.equal(
  validateTeacherForm({ ...validAddForm, nationality: '' }, 'add'),
  'الجنسية مطلوبة',
);
assert.equal(validateTeacherForm({ ...validAddForm, nationality: '' }, 'edit'), null);
assert.equal(
  validateTeacherForm({ ...validAddForm, ageGroups: [] }, 'add'),
  'اختر فئة عمرية واحدة على الأقل',
);
assert.equal(
  validateTeacherForm({ ...validAddForm, numberOfMemorizedJuz: 31 }, 'add'),
  'أدخل عدد الأجزاء المحفوظة (1 إلى 30)',
);
// CreatePendingTeacherRequestDto requires numberOfMemorizedJuz >= 1 (not 0 like update).
assert.equal(
  validateTeacherForm({ ...validAddForm, numberOfMemorizedJuz: 0 }, 'add'),
  'أدخل عدد الأجزاء المحفوظة (1 إلى 30)',
);
assert.equal(validateTeacherForm({ ...validAddForm, numberOfMemorizedJuz: 0 }, 'edit'), null);

assert.equal(coerceTeacherId('27'), 27);
assert.equal(coerceTeacherId(27), 27);
assert.equal(coerceTeacherId('not-a-number'), 0);

assert.equal(yesNoToBool('true'), true);
assert.equal(yesNoToBool('false'), false);
assert.equal(yesNoToBool(''), false);

console.log('teacher-validation-self-check: ok');
