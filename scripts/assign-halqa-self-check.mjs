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
  unwrapActiveHalqasPayload({ items: [{ id: '7', name: 'مغرب', studentLimit: '8', studentsCount: '2' }] }).map(
    (row) => row.remainingCapacity,
  ),
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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const createManual = readFileSync(join(root, 'src/app/core/api/student-request-api.service.ts'), 'utf8');
if (!createManual.includes('createManual(payload: CreateManualStudentPayload): Observable<CreatedManualStudent>')) {
  throw new Error('createManual must not discard the created student as Observable<void>');
}
if (!createManual.includes('mapCreatedManualStudent')) {
  throw new Error('createManual must coerce and return data.id');
}

const centerApi = readFileSync(join(root, 'src/app/core/api/center-api.service.ts'), 'utf8');
if (!centerApi.includes('getActiveHalqas') || !centerApi.includes('/active-halqas')) {
  throw new Error('CenterApiService must wrap GET /center/:centerId/active-halqas');
}

const studentsTs = readFileSync(join(root, 'src/app/features/students/students.ts'), 'utf8');
if (!studentsTs.includes('showAssignModal') || !studentsTs.includes('onStudentSaved')) {
  throw new Error('students page must open the assign dialog after create');
}

const formModal = readFileSync(join(root, 'src/app/features/students/student-form-modal/student-form-modal.ts'), 'utf8');
if (formModal.includes('saved = output<void>()')) {
  throw new Error('student form must emit created { id, email?, name? }');
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

const ar = JSON.parse(readFileSync(join(root, 'public/i18n/ar.json'), 'utf8'));
assert.equal(ar.students.assignHalqa.title, 'تعيين إلى حلقة؟');
assert.equal(ar.students.assignHalqa.yes, 'نعم');
assert.equal(ar.students.assignHalqa.no, 'لا');
assert.equal(ar.toast.success.studentAssignedToHalqa, 'تم تعيين الطالب إلى الحلقة');

console.log('assign-halqa-self-check: ok');
