/** ponytail: DELETE /teacher-profile 409 parsing and `{ data: null }` success. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arabicDialogMessage } from '../src/app/core/ui/toast-messages.ts';
import {
  TEACHER_DELETE_ASSIGNED_MESSAGE,
  TEACHER_DELETE_UNEXPECTED_MESSAGE,
  canDeleteTeacher,
  readTeacherDeleteConflict,
  teacherDeleteConfirmError,
} from '../src/app/features/teachers/dto/teacher-delete.ts';

const root = dirname(fileURLToPath(import.meta.url));
const envelopeSource = readFileSync(join(root, '../src/app/core/api/envelope.helpers.ts'), 'utf8');
const apiErrorSource = readFileSync(join(root, '../src/app/core/api/api-error.ts'), 'utf8');
const teacherApiSource = readFileSync(
  join(root, '../src/app/core/api/teacher-api.service.ts'),
  'utf8',
);

assert.match(envelopeSource, /if \(body\.data === undefined\)/);
assert.match(envelopeSource, /return body\.data \?\? null/);
assert.match(teacherApiSource, /deactivate\(profileId/);
assert.match(teacherApiSource, /teacher-profile\/\$\{profileId\}/);
assert.match(teacherApiSource, /unwrapEnvelopeOrNull\(res\.body, res\.status\)/);
assert.match(apiErrorSource, /this\.code = code/);
assert.match(apiErrorSource, /this\.body = body/);

/** Mirrors unwrapEnvelope's data rule: null is success, missing data throws. */
function readData(body, httpStatus) {
  const bodyStatus = body?.statusCode ?? body?.status;
  const ok =
    bodyStatus !== undefined
      ? bodyStatus >= 200 && bodyStatus < 300
      : httpStatus >= 200 && httpStatus < 300;
  if (!body || !ok) {
    throw new Error('not ok');
  }
  if (body.data === undefined) {
    throw new Error('Missing response data');
  }
  return body.data;
}

assert.equal(readData({ status: 200, message: 'تم حذف المعلّم', data: null }, 200), null);
assert.throws(() => readData({ status: 200, message: 'تم' }, 200), /Missing response data/);

const assignedBody = {
  statusCode: 409,
  message: 'TEACHER_HAS_ASSIGNED_HALAQAS',
  code: 'TEACHER_HAS_ASSIGNED_HALAQAS',
  halqaIds: [4, '9'],
  halqaNames: ['حلقة الفجر', 'حلقة الضحى'],
};

assert.deepEqual(readTeacherDeleteConflict({ status: 409, error: assignedBody }), {
  halqas: [
    { id: 4, name: 'حلقة الفجر' },
    { id: 9, name: 'حلقة الضحى' },
  ],
});

const viaInterceptor = {
  name: 'ApiError',
  message: assignedBody.message,
  httpStatus: 409,
  code: assignedBody.code,
  body: assignedBody,
};
assert.deepEqual(readTeacherDeleteConflict(viaInterceptor)?.halqas[1], {
  id: 9,
  name: 'حلقة الضحى',
});
assert.equal(teacherDeleteConfirmError(viaInterceptor).message, TEACHER_DELETE_ASSIGNED_MESSAGE);

assert.deepEqual(
  readTeacherDeleteConflict({
    status: 409,
    error: { statusCode: 409, message: 'TEACHER_HAS_ASSIGNED_HALAQAS', halqaNames: ['حلقة العصر'] },
  }),
  { halqas: [{ id: null, name: 'حلقة العصر' }] },
);

assert.deepEqual(
  readTeacherDeleteConflict({
    status: 409,
    error: {
      message: 'لا يمكن الحذف',
      data: { halqas: [{ id: 3, name: 'حلقة المغرب' }, { name: 'بدون رقم' }] },
    },
  })?.halqas,
  [
    { id: 3, name: 'حلقة المغرب' },
    { id: null, name: 'بدون رقم' },
  ],
);

assert.equal(
  readTeacherDeleteConflict({
    status: 409,
    error: { code: 'SOME_OTHER_CONFLICT', message: 'رسالة عربية من الخادم' },
  }),
  null,
);
assert.equal(
  teacherDeleteConfirmError({
    status: 409,
    error: { code: 'SOME_OTHER_CONFLICT', message: 'رسالة عربية من الخادم' },
  }).message,
  'رسالة عربية من الخادم',
);

const notFound = {
  name: 'ApiError',
  message: 'المعلّم غير موجود',
  httpStatus: 404,
  code: 'TEACHER_PROFILE_NOT_FOUND',
  body: { statusCode: 404, message: 'المعلّم غير موجود', code: 'TEACHER_PROFILE_NOT_FOUND' },
};
assert.equal(readTeacherDeleteConflict(notFound), null);
assert.equal(teacherDeleteConfirmError(notFound).message, 'المعلّم غير موجود');
assert.equal(
  teacherDeleteConfirmError(notFound).message,
  arabicDialogMessage(notFound.message, TEACHER_DELETE_UNEXPECTED_MESSAGE),
);

const forbidden = {
  name: 'ApiError',
  message: 'NOT_AUTHORIZED',
  httpStatus: 403,
  code: 'NOT_AUTHORIZED',
  body: { statusCode: 403, message: 'NOT_AUTHORIZED', code: 'NOT_AUTHORIZED' },
};
assert.equal(teacherDeleteConfirmError(forbidden).message, TEACHER_DELETE_UNEXPECTED_MESSAGE);

assert.equal(canDeleteTeacher(null, 7, 1), false);
assert.equal(canDeleteTeacher(0, 7, 1), false);
assert.equal(canDeleteTeacher(12, 7, 7), false);
assert.equal(canDeleteTeacher(12, 7, 1), true);

console.log('teacher-delete-self-check: ok');
