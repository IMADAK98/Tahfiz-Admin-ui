/** ponytail: add/delete study-plan items. data-URL resolve hook appends .ts
 *  so this file can import extensionless app modules. Ceiling: that import
 *  graph cannot include a directory index.ts or a TypeScript enum. */
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

const { missingPlanItemTypes, buildAddPlanItemPayload, createEmptyPlanItemForm } =
  await import('../src/app/features/halaqa-detail/dto/plan-item-form.model.ts');
const { PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE, planItemDeleteConfirmMessage } =
  await import('../src/app/features/halaqa-detail/dto/plan-item-delete.ts');

assert.deepEqual(missingPlanItemTypes([]), ['HIFZ', 'TATHBEET', 'MURAJAA']);
assert.deepEqual(missingPlanItemTypes([{ type: 'TATHBEET' }]), ['HIFZ', 'MURAJAA']);
assert.deepEqual(missingPlanItemTypes([{ type: 'MURAJAA' }, { type: 'HIFZ' }]), ['TATHBEET']);
assert.deepEqual(
  missingPlanItemTypes([{ type: 'HIFZ' }, { type: 'TATHBEET' }, { type: 'MURAJAA' }]),
  [],
);
assert.equal(createEmptyPlanItemForm().type, 'HIFZ');
assert.equal(createEmptyPlanItemForm('MURAJAA').type, 'MURAJAA');

const payload = buildAddPlanItemPayload({
  type: 'TATHBEET',
  direction: 'REVERSE',
  fromSurah: '12',
  fromAyah: '3',
  toSurah: 80,
  toAyah: 4,
  amountType: 'PAGE',
  amountValue: '7',
});
assert.deepEqual(Object.keys(payload), [
  'type',
  'direction',
  'fromSurah',
  'fromAyah',
  'amountType',
  'amountValue',
]);
assert.equal(payload.fromSurah, 12);
assert.equal(payload.fromAyah, 3);
assert.equal(payload.amountValue, 7);
assert.equal(payload.toSurah, undefined);
assert.equal(payload.toAyah, undefined);
assert.equal(payload.studyPlanId, undefined);
assert.equal(payload.planId, undefined);

const api = readFileSync(join(repo, 'src/app/core/api/study-plan-api.service.ts'), 'utf8');
const createStart = api.indexOf('createItem(');
const deleteStart = api.indexOf('deleteItem(');
const updateStart = api.indexOf('updateItem(');
assert.ok(createStart >= 0 && deleteStart > createStart && updateStart > deleteStart);
const createSlice = api.slice(createStart, deleteStart);
const deleteSlice = api.slice(deleteStart, updateStart);
assert.match(createSlice, /study-plan-item\/\$\{planId\}/);
assert.match(createSlice, /\.post</);
assert.match(createSlice, /readStudyPlanItemBody/);
assert.doesNotMatch(createSlice, /unwrapEnvelope/);
assert.doesNotMatch(createSlice, /studyPlanId/);
assert.match(deleteSlice, /study-plan-item\/\$\{itemId\}/);
assert.match(deleteSlice, /\.delete</);
assert.match(deleteSlice, /unwrapEnvelope/);

const model = readFileSync(join(repo, 'src/app/core/api/models/study-plan.model.ts'), 'utf8');
const ifaceStart = model.indexOf('export interface AddStudyPlanItemPayload');
assert.ok(ifaceStart >= 0);
const iface = model.slice(ifaceStart, model.indexOf('}', ifaceStart));
for (const key of ['type', 'direction', 'fromSurah', 'fromAyah', 'amountType', 'amountValue']) {
  assert.match(iface, new RegExp(`\\b${key}:`));
}
assert.doesNotMatch(iface, /toSurah|toAyah|studyPlanId|\bplanId\b/);

const page = readFileSync(join(repo, 'src/app/features/halaqa-detail/halaqa-detail.html'), 'utf8');
assert.match(page, /missingTypes\(plan\)\.length > 0[\s\S]{0,280}إضافة عنصر/);
assert.match(page, /showDeletePlanItemModal\(\)/);
assert.match(page, /حذف عنصر من الخطة/);
assert.match(page, /plan\.items\.length === 1/);
assert.match(page, /لا يمكن حذف آخر عنصر/);

const pageTs = readFileSync(join(repo, 'src/app/features/halaqa-detail/halaqa-detail.ts'), 'utf8');
assert.match(pageTs, /planItemDeleteConfirmMessage/);
assert.match(pageTs, /HALAQA_DETAIL_I18N\.success\.planItemDeleted/);

const addHtml = readFileSync(
  join(repo, 'src/app/features/halaqa-detail/add-plan-item-modal/add-plan-item-modal.html'),
  'utf8',
);
assert.match(addHtml, /<form\b[^>]*\[formGroup\]="form"/);
assert.doesNotMatch(addHtml, /إلى/);
assert.doesNotMatch(addHtml, /\(ngSubmit\)/);
assert.doesNotMatch(addHtml, /FormsModule/);

const addTs = readFileSync(
  join(repo, 'src/app/features/halaqa-detail/add-plan-item-modal/add-plan-item-modal.ts'),
  'utf8',
);
assert.match(addTs, /formGroupOf/);
assert.match(addTs, /ReactiveFormsModule/);
assert.match(addTs, /STUDY_PLAN_ITEM_TYPE_OPTIONS\.filter/);
assert.doesNotMatch(addTs, /\bFormsModule\b/);
assert.doesNotMatch(addTs, /إلى/);

const ar = JSON.parse(readFileSync(join(repo, 'public/i18n/ar.json'), 'utf8'));
assert.equal(ar.halaqaDetail.errors.itemHasProgress, undefined);
assert.equal(ar.halaqaDetail.errors.itemIsLast, PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE);
assert.equal(PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE, 'لا يمكن حذف آخر عنصر في الخطة.');
assert.equal(ar.halaqaDetail.success.planItemAdded, 'تمت إضافة عنصر الخطة');
assert.equal(ar.halaqaDetail.success.planItemDeleted, 'تم حذف العنصر');
assert.equal(ar.halaqaDetail.success.planDeleted, 'تم حذف الخطة');
assert.equal(ar.halaqaDetail.success.studentsAssigned, 'تمت إضافة الطلاب إلى الخطة');
assert.equal(ar.halaqaDetail.success.studentUnassigned, 'تمت إزالة الطالب من الخطة');
assert.equal(ar.halaqaDetail.confirm.progressKept, 'سيُحفظ سجل التقدّم السابق كما هو.');
assert.equal(ar.halaqaDetail.edit.computedOnSave, 'تُحسب تلقائيًا عند الحفظ');
assert.equal((page.match(/i18n\.confirm\.progressKept/g) ?? []).length, 2);

const deleteSrc = readFileSync(
  join(repo, 'src/app/features/halaqa-detail/dto/plan-item-delete.ts'),
  'utf8',
);
assert.doesNotMatch(deleteSrc, /STUDY_PLAN_ITEM_HAS_PROGRESS/);
assert.match(deleteSrc, /STUDY_PLAN_ITEM_LAST_ITEM/);

const progress = {
  name: 'ApiError',
  message: 'Conflict',
  httpStatus: 409,
  code: 'STUDY_PLAN_ITEM_HAS_PROGRESS',
  body: {
    statusCode: 409,
    message: 'Conflict',
    error: 'Conflict',
    code: 'STUDY_PLAN_ITEM_HAS_PROGRESS',
  },
};
assert.equal(planItemDeleteConfirmMessage(progress), 'حدث خطأ غير متوقع. حاول مرة أخرى.');

const last = {
  name: 'ApiError',
  message: 'Conflict',
  httpStatus: 409,
  code: 'STUDY_PLAN_ITEM_LAST_ITEM',
  body: {
    statusCode: 409,
    message: 'Conflict',
    error: 'Conflict',
    code: 'STUDY_PLAN_ITEM_LAST_ITEM',
  },
};
assert.equal(planItemDeleteConfirmMessage(last), PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE);

assert.equal(
  planItemDeleteConfirmMessage({
    status: 409,
    error: {
      statusCode: 409,
      message: 'Conflict',
      error: 'Conflict',
      code: 'STUDY_PLAN_ITEM_LAST_ITEM',
    },
  }),
  PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE,
);

assert.equal(
  planItemDeleteConfirmMessage({
    name: 'ApiError',
    message: 'العنصر غير موجود',
    httpStatus: 404,
    code: 'STUDY_PLAN_ITEM_NOT_FOUND',
    body: { statusCode: 404, message: 'العنصر غير موجود' },
  }),
  'العنصر غير موجود',
);
assert.equal(
  planItemDeleteConfirmMessage({
    name: 'ApiError',
    message: 'NOT_AUTHORIZED',
    httpStatus: 403,
    code: 'NOT_AUTHORIZED',
    body: { statusCode: 403, message: 'NOT_AUTHORIZED', code: 'NOT_AUTHORIZED' },
  }),
  'حدث خطأ غير متوقع. حاول مرة أخرى.',
);
assert.equal(
  planItemDeleteConfirmMessage({
    name: 'ApiError',
    message: 'Missing response data',
    httpStatus: 200,
    body: 'This action removes a #1 studyPlanItem',
  }),
  'حدث خطأ غير متوقع. حاول مرة أخرى.',
);

const service = readFileSync(
  join(repo, 'src/app/features/halaqa-detail/halaqa-detail.service.ts'),
  'utf8',
);
assert.match(service, /createItem\(planId, buildAddPlanItemPayload\(form\)\)/);
assert.match(service, /deleteItem\(itemId\)/);

console.log('plan-item-crud-self-check: ok');
