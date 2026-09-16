/** ponytail: smallest check that create-term validation rules stay wired. */
import assert from 'node:assert/strict';

const validate = (form) => {
  if (!form.name.trim()) return 'اسم الدورة مطلوب';
  if (!form.startDate || !form.endDate) return 'تاريخ بداية ونهاية الدورة مطلوبان';
  if (!form.registerationStartDate || !form.registerationEndDate) return 'فترة التسجيل مطلوبة';
  if (form.startDate > form.endDate) return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  if (form.registerationStartDate > form.registerationEndDate) {
    return 'نهاية التسجيل يجب أن تكون بعد بداية التسجيل';
  }
  if (form.registerationEndDate > form.endDate) {
    return 'نهاية التسجيل يجب أن تكون قبل أو في نفس يوم نهاية الدورة';
  }
  return null;
};

assert.equal(
  validate({
    name: 'x',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    registerationStartDate: '2026-08-15',
    registerationEndDate: '2027-01-01',
    holidayDates: [],
  }),
  'نهاية التسجيل يجب أن تكون قبل أو في نفس يوم نهاية الدورة',
);

assert.equal(
  validate({
    name: 'ok',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    registerationStartDate: '2026-08-15',
    registerationEndDate: '2026-09-20',
    holidayDates: [],
  }),
  null,
);

console.log('term-validation-self-check: ok');
