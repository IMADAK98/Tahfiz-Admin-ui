/** ponytail: plans-tab delete and assign-students must patch the signal on success. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, '..');

const hook = `
export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('.') || specifier.startsWith('/')) && !/\\.(ts|js|mjs|cjs|json|css)$/.test(specifier)) {
    return nextResolve(specifier + '.ts', context);
  }
  return nextResolve(specifier, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(hook));

const { plansWithoutItem, plansWithStudents } = await import(
  '../src/app/features/halaqa-detail/dto/plan-list-patch.ts'
);
const { readAssignedStudyPlan } = await import(
  '../src/app/core/api/study-plan-assign-response.ts'
);

const plans = [
  {
    id: 4,
    items: [
      { id: 10, type: 'HIFZ' },
      { id: 11, type: 'MURAJAA' },
    ],
    students: [],
  },
  { id: 5, items: [{ id: 12, type: 'TATHBEET' }], students: [{ id: 2, name: 'سعد' }] },
];

const removed = plansWithoutItem(plans, 4, 11);
assert.deepEqual(
  removed[0].items.map((item) => item.id),
  [10],
);
assert.equal(removed[1], plans[1]);
assert.equal(plansWithoutItem(plans, 4, 99)[0], plans[0]);
assert.deepEqual(plans[0].items.map((item) => item.id), [10, 11]);

const withStudents = plansWithStudents(removed, 4, [
  { id: 7, name: 'ليان' },
  { id: 7, name: 'ليان' },
]);
assert.deepEqual(withStudents[0].students, [{ id: 7, name: 'ليان' }]);
assert.equal(withStudents[1], plans[1]);
const again = plansWithStudents(withStudents, 4, [{ id: 8, name: 'فهد' }]);
assert.deepEqual(
  again[0].students.map((student) => student.id),
  [7, 8],
);

const rawPlan = { id: 4, name: 'خطة', students: [{ id: 7, name: 'ليان' }], studyPlanItems: [] };
assert.equal(readAssignedStudyPlan(rawPlan, 201).ok, true);
assert.equal(readAssignedStudyPlan(rawPlan, 201).plan?.id, 4);
assert.equal(readAssignedStudyPlan({ status: 200, message: 'ok', data: rawPlan }, 200).plan?.name, 'خطة');
assert.equal(readAssignedStudyPlan({ statusCode: 200, data: null }, 200).ok, true);
assert.equal(readAssignedStudyPlan({ statusCode: 200, data: null }, 200).plan, null);
assert.equal(readAssignedStudyPlan({ status: 200, message: 'ok' }, 200).ok, true);
assert.equal(readAssignedStudyPlan(null, 200).ok, true);
assert.equal(readAssignedStudyPlan('Students assigned successfully', 200).ok, false);
assert.equal(readAssignedStudyPlan({ statusCode: 400, message: 'bad' }, 400).ok, false);
assert.equal(
  readAssignedStudyPlan({ statusCode: 400, message: 'bad', data: null }, 200).ok,
  false,
);

const api = readFileSync(join(repo, 'src/app/core/api/study-plan-api.service.ts'), 'utf8');
const assignStart = api.indexOf('assignStudents(');
const unassignStart = api.indexOf('unassignStudents(');
assert.ok(assignStart >= 0 && unassignStart > assignStart);
const assignSlice = api.slice(assignStart, unassignStart);
assert.match(assignSlice, /readAssignedStudyPlan/);
assert.doesNotMatch(assignSlice, /unwrapEnvelope/);

const pageTs = readFileSync(join(repo, 'src/app/features/halaqa-detail/halaqa-detail.ts'), 'utf8');
const confirmStart = pageTs.indexOf('confirmDeletePlanItem()');
const savedStart = pageTs.indexOf('onPlanItemSaved(', confirmStart);
assert.ok(confirmStart >= 0 && savedStart > confirmStart);
const confirm = pageTs.slice(confirmStart, savedStart);
const nextStart = confirm.indexOf('next:');
const errorStart = confirm.indexOf('error:');
assert.ok(nextStart >= 0 && errorStart > nextStart);
const beforeSubscribe = confirm.slice(0, confirm.indexOf('.subscribe'));
assert.doesNotMatch(beforeSubscribe, /plansWithoutItem/);
assert.match(confirm.slice(nextStart, errorStart), /plansWithoutItem\(this\.plans\(\), planId, item\.id\)/);
assert.doesNotMatch(confirm.slice(errorStart), /plansWithoutItem|this\.plans\.set/);

const assignedStart = pageTs.indexOf('onStudentsAssigned(');
const unassignOpen = pageTs.indexOf('openUnassignPlanStudent(', assignedStart);
assert.ok(assignedStart >= 0 && unassignOpen > assignedStart);
const assigned = pageTs.slice(assignedStart, unassignOpen);
assert.match(assigned, /plansWithStudents\(this\.plans\(\), planId, additions\)/);
assert.match(assigned, /studentIds/);

const modal = readFileSync(
  join(repo, 'src/app/features/halaqa-detail/assign-plan-students-modal/assign-plan-students-modal.ts'),
  'utf8',
);
assert.match(modal, /assigned = output<number\[\]>\(\)/);
const modalNext = modal.indexOf('next:');
const modalError = modal.indexOf('error:', modalNext);
assert.ok(modalNext >= 0 && modalError > modalNext);
assert.match(modal.slice(modalNext, modalError), /this\.assigned\.emit\(studentIds\)/);
assert.doesNotMatch(modal.slice(modalError), /assigned\.emit/);

const page = readFileSync(join(repo, 'src/app/features/halaqa-detail/halaqa-detail.html'), 'utf8');
assert.match(page, /\(assigned\)="onStudentsAssigned\(\$event\)"/);

console.log('plan-tab-refresh-self-check: ok');
