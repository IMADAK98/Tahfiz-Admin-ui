import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** ponytail: smallest check for create-id coerce, capacity skip, email fallback. */

function coerceStudentId(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function optionalString(value) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

function mapCreatedManualStudent(data) {
  if (!data || typeof data !== 'object') return { id: null };
  const coerced = coerceStudentId(data.id);
  return {
    id: coerced > 0 ? coerced : null,
    email: optionalString(data.email),
    name: optionalString(data.name),
  };
}

function coerceOptionalCount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapActiveHalqaOption(raw) {
  const row = raw ?? {};
  const studentLimit = coerceOptionalCount(row.studentLimit);
  const studentsCount = coerceOptionalCount(row.studentsCount);
  const remainingCapacity =
    studentLimit != null && studentsCount != null ? studentLimit - studentsCount : null;
  return {
    id: coerceStudentId(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    studentLimit,
    studentsCount,
    remainingCapacity,
  };
}

function unwrapActiveHalqasPayload(data) {
  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (data && typeof data === 'object') {
    for (const key of ['items', 'results', 'halqas', 'records', 'data']) {
      if (Array.isArray(data[key])) {
        rows = data[key];
        break;
      }
    }
  }
  return rows.map(mapActiveHalqaOption).filter((halqa) => halqa.id > 0);
}

function selectableActiveHalqas(halqas) {
  return halqas.filter((halqa) => halqa.remainingCapacity == null || halqa.remainingCapacity > 0);
}

function findStudentIdByEmail(students, email) {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  const match = students.find((student) => (student.email ?? '').trim().toLowerCase() === needle);
  return match && match.id > 0 ? match.id : null;
}

function firstPositiveId(...values) {
  for (const value of values) {
    const coerced = coerceStudentId(value);
    if (coerced > 0) return coerced;
  }
  return null;
}

function mapApprovedStudent(data) {
  const created = mapCreatedManualStudent(data);
  if (created.id || !data || typeof data !== 'object') return created;
  const user = data.user && typeof data.user === 'object' ? data.user : null;
  return {
    id: firstPositiveId(data.userId, data.studentId, user?.id),
    email: created.email ?? optionalString(user?.email),
    name: created.name ?? optionalString(user?.name),
  };
}

function displayValueToOptional(value) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '—') return undefined;
  return trimmed;
}

function studentFromApprovedRequest(request, approved) {
  const existingId =
    request.existingUserId && request.existingUserId > 0 ? request.existingUserId : null;
  return {
    id: approved.id ?? existingId,
    email: approved.email ?? displayValueToOptional(request.email),
    name: approved.name ?? displayValueToOptional(request.name),
  };
}

function mergeCreatedWithForm(created, form) {
  return {
    id: created.id,
    email: created.email ?? optionalString(form.email),
    name: created.name ?? optionalString(form.fullName) ?? optionalString(form.name),
  };
}

assert.deepEqual(mapCreatedManualStudent({ id: '28', name: 'Ahmed', email: 'a@b.c' }), {
  id: 28,
  name: 'Ahmed',
  email: 'a@b.c',
});
assert.deepEqual(mapCreatedManualStudent({ id: 9 }), { id: 9, email: undefined, name: undefined });
assert.equal(mapCreatedManualStudent(null).id, null);
assert.equal(mapCreatedManualStudent({ id: 'not-a-number' }).id, null);
assert.equal(mapCreatedManualStudent({}).id, null);

const listed = unwrapActiveHalqasPayload([
  { id: '3', name: 'فجر', studentLimit: 10, studentsCount: 4 },
  { id: '4', name: 'ظهر', studentLimit: 5, studentsCount: 5 },
  { id: '5', name: 'عصر' },
  { id: 0, name: 'skip' },
]);
assert.deepEqual(
  listed.map((row) => ({ id: row.id, remaining: row.remainingCapacity })),
  [
    { id: 3, remaining: 6 },
    { id: 4, remaining: 0 },
    { id: 5, remaining: null },
  ],
);
assert.deepEqual(
  selectableActiveHalqas(listed).map((row) => row.id),
  [3, 5],
);
assert.deepEqual(
  unwrapActiveHalqasPayload({
    items: [{ id: '7', name: 'مغرب', studentLimit: '8', studentsCount: '2' }],
  }).map((row) => row.remainingCapacity),
  [6],
);
assert.deepEqual(unwrapActiveHalqasPayload(null), []);

assert.equal(
  findStudentIdByEmail(
    [
      { id: 11, email: 'other@x.com' },
      { id: 28, email: 'A@B.C' },
    ],
    'a@b.c',
  ),
  28,
);
assert.equal(findStudentIdByEmail([{ id: 1, email: 'nope@x.com' }], 'a@b.c'), null);

assert.deepEqual(mapApprovedStudent(null), { id: null });
assert.deepEqual(mapApprovedStudent({ id: '28', email: 'a@b.c' }), {
  id: 28,
  email: 'a@b.c',
  name: undefined,
});
assert.deepEqual(mapApprovedStudent({ userId: '31', user: { name: 'Sara' } }), {
  id: 31,
  email: undefined,
  name: 'Sara',
});
assert.deepEqual(mapApprovedStudent({ user: { id: '9', email: 'u@x.com', name: 'U' } }), {
  id: 9,
  email: 'u@x.com',
  name: 'U',
});
assert.deepEqual(
  studentFromApprovedRequest(
    { email: 'req@x.com', name: 'طلب', existingUserId: 44 },
    mapApprovedStudent(null),
  ),
  { id: 44, email: 'req@x.com', name: 'طلب' },
);
assert.deepEqual(
  studentFromApprovedRequest(
    { email: '—', name: '—', existingUserId: null },
    mapApprovedStudent({ id: '12' }),
  ),
  { id: 12, email: undefined, name: undefined },
);
assert.deepEqual(mergeCreatedWithForm({ id: null }, { fullName: 'Ahmed', email: 'a@b.c' }), {
  id: null,
  name: 'Ahmed',
  email: 'a@b.c',
});
assert.deepEqual(
  mergeCreatedWithForm({ id: 9, email: 'x@y.z', name: 'X' }, { fullName: 'Ahmed', email: 'a@b.c' }),
  { id: 9, email: 'x@y.z', name: 'X' },
);
assert.equal(
  findStudentIdByEmail(
    [{ id: 28, email: 'a@b.c' }],
    studentFromApprovedRequest(
      { email: 'a@b.c', name: 'Ahmed', existingUserId: null },
      { id: null },
    ).email,
  ),
  28,
);
assert.equal(
  findStudentIdByEmail(
    [{ id: 28, email: 'a@b.c' }],
    mergeCreatedWithForm(mapCreatedManualStudent(null), { email: 'a@b.c' }).email,
  ),
  28,
);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const createManual = readFileSync(
  join(root, 'src/app/core/api/student-request-api.service.ts'),
  'utf8',
);
if (
  !createManual.includes(
    'createManual(payload: CreateManualStudentPayload): Observable<CreatedManualStudent>',
  )
) {
  throw new Error('createManual must not discard the created student as Observable<void>');
}
if (!createManual.includes('mapCreatedManualStudent')) {
  throw new Error('createManual must coerce and return data.id');
}

const centerApi = readFileSync(join(root, 'src/app/core/api/center-api.service.ts'), 'utf8');
if (!centerApi.includes('getActiveHalqas') || !centerApi.includes('/active-halqas')) {
  throw new Error('CenterApiService must wrap GET /center/:centerId/active-halqas');
}

const studentsService = readFileSync(
  join(root, 'src/app/features/students/students.service.ts'),
  'utf8',
);
const createFn = studentsService.slice(
  studentsService.indexOf('createStudent('),
  studentsService.indexOf('/** Prefer create `data.id`'),
);
if (!createFn.includes('mergeCreatedWithForm')) {
  throw new Error('createStudent must merge form email/name before id fallback');
}
if (!createFn.includes('this.resolveCreatedStudentId')) {
  throw new Error('createStudent must resolve id after merge when data.id is missing');
}

const studentsModel = readFileSync(join(root, 'src/app/core/api/models/student.model.ts'), 'utf8');
if (!studentsModel.includes('export function mergeCreatedWithForm')) {
  throw new Error('mergeCreatedWithForm must live next to mapCreatedManualStudent');
}
if (!studentsModel.includes('export function mapApprovedStudent')) {
  throw new Error('mapApprovedStudent must stay for the approve-after-assign path');
}

const enrollApi = readFileSync(join(root, 'src/app/core/api/halqa-api.service.ts'), 'utf8');
if (
  !enrollApi.includes('enrollStudents') ||
  !enrollApi.includes('unwrapEnvelopeOrNull(res.body, res.status)')
) {
  throw new Error('enrollStudents must use unwrapEnvelopeOrNull — Nest enroll often has data:null');
}

const studentsTs = readFileSync(join(root, 'src/app/features/students/students.ts'), 'utf8');
if (!studentsTs.includes('onStudentSaved')) {
  throw new Error('students page must finish the create flow after assign');
}

const formModal = readFileSync(
  join(root, 'src/app/features/students/student-form-modal/student-form-modal.ts'),
  'utf8',
);
if (formModal.includes('saved.emit(created)') && formModal.includes('notifySuccess')) {
  const toastAt = formModal.indexOf('notifySuccess');
  const emitAt = formModal.indexOf('saved.emit');
  if (emitAt !== -1 && emitAt < toastAt + 200 && formModal.indexOf('createdStudent.set') === -1) {
    throw new Error('do not emit saved on create — open assign in the form modal first');
  }
}
if (!formModal.includes('createdStudent.set(created)')) {
  throw new Error('form modal must open assign confirm after create, before parent close');
}

const formHtml = readFileSync(
  join(root, 'src/app/features/students/student-form-modal/student-form-modal.html'),
  'utf8',
);
if (!formHtml.includes('app-assign-halqa-modal') || !formHtml.includes('createdStudent()')) {
  throw new Error('assign confirm must render inside the create modal after success');
}

const assignHtml = readFileSync(
  join(root, 'src/app/features/students/assign-halqa-modal/assign-halqa-modal.html'),
  'utf8',
);
if (assignHtml.includes('<button')) {
  throw new Error('assign dialog must use p-button only — no native <button>');
}
if (!assignHtml.includes('p-select') || !assignHtml.includes('p-button')) {
  throw new Error('assign dialog must use PrimeNG p-button + Select');
}
if (assignHtml.includes('@if (visible())')) {
  throw new Error('assign dialog must render when mounted — parent @if owns visibility');
}
if (!assignHtml.includes('icon="pi pi-times"')) {
  throw new Error('close control must use pi-times — projected × renders as A- on PrimeNG 22');
}
if (!assignHtml.includes('empty-halqas')) {
  throw new Error('after نعم, empty active-ḥalaqas must show a clear empty state');
}
if (assignHtml.includes('>\n          ×') || assignHtml.includes('>×<')) {
  throw new Error('do not project × into p-button');
}

const ar = JSON.parse(readFileSync(join(root, 'public/i18n/ar.json'), 'utf8'));
assert.equal(ar.students.assignHalqa.title, 'تعيين إلى حلقة؟');
assert.equal(ar.students.assignHalqa.yes, 'نعم');
assert.equal(ar.students.assignHalqa.no, 'لا');
assert.equal(ar.toast.success.studentAssignedToHalqa, 'تم تعيين الطالب إلى الحلقة');

const approveApi = readFileSync(
  join(root, 'src/app/core/api/student-request-api.service.ts'),
  'utf8',
);
if (
  !approveApi.includes('approve(id: number | string): Observable<CreatedManualStudent>') ||
  !approveApi.includes('mapApprovedStudent')
) {
  throw new Error('approve must return coerced user id, not Observable<void>');
}

const requestsTs = readFileSync(
  join(root, 'src/app/features/student-requests/student-requests.ts'),
  'utf8',
);
if (!requestsTs.includes('AssignHalqaModalComponent') || !requestsTs.includes('approvedStudent')) {
  throw new Error('student-requests must open the shared assign dialog after approve');
}
if (requestsTs.includes('notifySuccess(TOAST_I18N.success.studentRequestRejected)') === false) {
  throw new Error('reject path must stay toast + reload');
}

const requestsHtml = readFileSync(
  join(root, 'src/app/features/student-requests/student-requests.html'),
  'utf8',
);
if (
  !requestsHtml.includes('app-assign-halqa-modal') ||
  !requestsHtml.includes('@if (approvedStudent(); as student)')
) {
  throw new Error(
    'student-requests must mount the shared assign-halqa modal — do not duplicate chrome',
  );
}
if (requestsHtml.includes('confirmReject') && requestsHtml.includes('app-assign-halqa-modal')) {
  const rejectAt = requestsHtml.indexOf('confirmReject');
  const assignAt = requestsHtml.indexOf('app-assign-halqa-modal');
  if (assignAt > rejectAt) {
    // ponytail: only checks that reject still exists; assign is a sibling, not inside reject.
  }
}

const requestsDto = readFileSync(
  join(root, 'src/app/features/student-requests/dto/student-request-view.model.ts'),
  'utf8',
);
if (
  !requestsDto.includes('studentFromApprovedRequest') ||
  !requestsDto.includes('existingUserId')
) {
  throw new Error('approve must merge existingUserId / email when data is null');
}

console.log('assign-halqa-self-check: ok');
