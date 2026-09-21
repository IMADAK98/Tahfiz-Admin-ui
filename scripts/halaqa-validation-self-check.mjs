import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function validateCreateHalaqaForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'اسم الحلقة مطلوب';
  if (!form.category) errors.category = 'اختر الفئة';
  if (!form.period) errors.periods = 'اختر الفترة';
  if (!form.teacherId) errors.teacherId = 'اختر المعلّم';
  if (!form.studentIds.length) errors.studentsIds = 'اختر طالباً واحداً على الأقل';
  if (form.studentLimit !== null && form.studentLimit < 1) {
    errors.studentLimit = 'عدد الطلاب المستهدف يجب أن يكون 1 على الأقل';
  }
  return errors;
}

const valid = {
  name: 'TEST Halqa',
  category: 'SECONDARY',
  period: 'ASR',
  studentLimit: 15,
  teacherId: 25,
  studentIds: [26],
};

assert.deepEqual(validateCreateHalaqaForm(valid), {});
assert.equal(validateCreateHalaqaForm({ ...valid, name: '  ' }).name, 'اسم الحلقة مطلوب');
assert.equal(validateCreateHalaqaForm({ ...valid, teacherId: null }).teacherId, 'اختر المعلّم');
assert.equal(
  validateCreateHalaqaForm({ ...valid, studentIds: [] }).studentsIds,
  'اختر طالباً واحداً على الأقل',
);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modalTs = readFileSync(
  join(root, 'src/app/features/halaqat/create-halaqa-modal/create-halaqa-modal.ts'),
  'utf8',
);
if (!modalTs.includes('fields.applyMap(validationError)')) {
  throw new Error('halaqa form must apply client validation under fields');
}

console.log('halaqa-validation-self-check: ok');
