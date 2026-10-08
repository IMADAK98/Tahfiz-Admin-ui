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
assert.deepEqual(validateCreateHalaqaForm({ ...valid, studentIds: [] }), {});

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modalTs = readFileSync(
  join(root, 'src/app/features/halaqat/create-halaqa-modal/create-halaqa-modal.ts'),
  'utf8',
);
if (!modalTs.includes('fields.applyMap(validationError)')) {
  throw new Error('halaqa form must apply client validation under fields');
}

const validationTs = readFileSync(
  join(root, 'src/app/features/halaqat/dto/create-halaqa-validation.ts'),
  'utf8',
);
if (validationTs.includes('اختر طالباً واحداً على الأقل') || validationTs.includes('studentIds.length')) {
  throw new Error('create ḥalaqa must allow an empty students list');
}
if (!validationTs.includes("errors['teacherId'] = 'اختر المعلّم'")) {
  throw new Error('create ḥalaqa must still require a teacher');
}

const requestDto = readFileSync(
  join(root, 'src/app/features/halaqat/dto/create-halaqa-request.dto.ts'),
  'utf8',
);
if (!requestDto.includes('studentsIds: form.studentIds')) {
  throw new Error('empty students must be sent as studentsIds: []');
}

const modalHtml = readFileSync(
  join(root, 'src/app/features/halaqat/create-halaqa-modal/create-halaqa-modal.html'),
  'utf8',
);
if (!modalHtml.includes("halaqat.picker.noStudents")) {
  throw new Error('empty student picker copy must stay');
}
if (modalHtml.includes('<label for="students" class="field-req">')) {
  throw new Error('students label must not be marked required');
}

console.log('halaqa-validation-self-check: ok');
