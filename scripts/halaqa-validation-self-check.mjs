import assert from 'node:assert/strict';

function validateCreateHalaqaForm(form) {
  if (!form.name.trim()) return 'اسم الحلقة مطلوب';
  if (!form.category) return 'اختر الفئة';
  if (!form.period) return 'اختر الفترة';
  if (!form.teacherId) return 'اختر المعلّم';
  if (!form.studentIds.length) return 'اختر طالباً واحداً على الأقل';
  if (form.studentLimit !== null && form.studentLimit < 1) {
    return 'عدد الطلاب المستهدف يجب أن يكون 1 على الأقل';
  }
  return null;
}

const valid = {
  name: 'TEST Halqa',
  category: 'SECONDARY',
  period: 'ASR',
  studentLimit: 15,
  teacherId: 25,
  studentIds: [26],
};

assert.equal(validateCreateHalaqaForm(valid), null);
assert.equal(validateCreateHalaqaForm({ ...valid, name: '  ' }), 'اسم الحلقة مطلوب');
assert.equal(validateCreateHalaqaForm({ ...valid, teacherId: null }), 'اختر المعلّم');
assert.equal(validateCreateHalaqaForm({ ...valid, studentIds: [] }), 'اختر طالباً واحداً على الأقل');

console.log('halaqa-validation-self-check: ok');
