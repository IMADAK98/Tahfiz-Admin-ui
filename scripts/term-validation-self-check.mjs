/** ponytail: smallest check that create-term validation rules stay wired. */
import assert from 'node:assert/strict';

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'اسم الدورة مطلوب';
  if (!form.startDate || !form.endDate) {
    if (!form.startDate) errors.startDate = 'تاريخ بداية ونهاية الدورة مطلوبان';
    if (!form.endDate) errors.endDate = 'تاريخ بداية ونهاية الدورة مطلوبان';
  } else if (form.startDate > form.endDate) {
    errors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  }
  if (!form.registerationStartDate || !form.registerationEndDate) {
    if (!form.registerationStartDate) errors.registerationStartDate = 'فترة التسجيل مطلوبة';
    if (!form.registerationEndDate) errors.registerationEndDate = 'فترة التسجيل مطلوبة';
  } else if (form.registerationStartDate > form.registerationEndDate) {
    errors.registerationEndDate = 'نهاية التسجيل يجب أن تكون بعد بداية التسجيل';
  } else if (form.endDate && form.registerationEndDate > form.endDate) {
    errors.registerationEndDate = 'نهاية التسجيل يجب أن تكون قبل أو في نفس يوم نهاية الدورة';
  }
  return errors;
};

assert.equal(
  validate({
    name: 'x',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    registerationStartDate: '2026-08-15',
    registerationEndDate: '2027-01-01',
    holidayDates: [],
  }).registerationEndDate,
  'نهاية التسجيل يجب أن تكون قبل أو في نفس يوم نهاية الدورة',
);

assert.deepEqual(
  validate({
    name: 'ok',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    registerationStartDate: '2026-08-15',
    registerationEndDate: '2026-09-20',
    holidayDates: [],
  }),
  {},
);

console.log('term-validation-self-check: ok');
