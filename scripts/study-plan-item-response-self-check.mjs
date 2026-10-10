/** ponytail: PUT /study-plan-item/:id is raw entity today and envelope data later. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readStudyPlanItemBody } from '../src/app/core/api/study-plan-item-response.ts';
import { arabicDialogMessage } from '../src/app/core/ui/toast-messages.ts';

const root = dirname(fileURLToPath(import.meta.url));

const rawItem = {
  id: 7,
  type: 'MURAJAA',
  direction: 'NORMAL',
  fromSurahNumber: 11,
  fromSurahName: 'هود',
  fromAyah: 1,
  toSurahNumber: 11,
  toSurahName: 'هود',
  toAyah: 8,
  amountType: 'PAGE',
  amountValue: 10,
};

const raw = readStudyPlanItemBody(rawItem, 200);
assert.equal(raw.ok, true);
assert.equal(raw.item?.toAyah, 8);
assert.equal(raw.item?.toSurahNumber, 11);
assert.equal(raw.item?.toSurahName, 'هود');

const wrapped = readStudyPlanItemBody({ status: 200, message: 'updated', data: rawItem }, 200);
assert.equal(wrapped.ok, true);
assert.equal(wrapped.item?.id, 7);
assert.equal(wrapped.item?.toAyah, 8);

const statusCodeWrapped = readStudyPlanItemBody(
  { statusCode: 200, message: 'updated', data: rawItem },
  200,
);
assert.equal(statusCodeWrapped.item?.fromSurahNumber, 11);

assert.deepEqual(readStudyPlanItemBody({ status: 200, data: null }, 200), { item: null, ok: true });
assert.deepEqual(readStudyPlanItemBody({ statusCode: 200, message: 'ok' }, 200), {
  item: null,
  ok: true,
});
assert.deepEqual(readStudyPlanItemBody(null, 200), { item: null, ok: true });
assert.deepEqual(readStudyPlanItemBody(null, 204), { item: null, ok: true });
assert.deepEqual(
  readStudyPlanItemBody({ statusCode: 400, message: 'Missing response data' }, 400),
  {
    item: null,
    ok: false,
  },
);
assert.equal(readStudyPlanItemBody({ id: '7', type: 'MURAJAA' }, 200).item, null);

const api = readFileSync(join(root, '../src/app/core/api/study-plan-api.service.ts'), 'utf8');
const updateStart = api.indexOf('updateItem(');
const updateBody = api.slice(updateStart);
assert.match(updateBody, /readStudyPlanItemBody/);
assert.doesNotMatch(updateBody, /unwrapEnvelope/);
assert.match(api.slice(0, updateStart), /getDetails/);
assert.match(api.slice(0, updateStart), /unwrapEnvelope/);

const modal = readFileSync(
  join(root, '../src/app/features/halaqa-detail/edit-plan-item-modal/edit-plan-item-modal.ts'),
  'utf8',
);
assert.match(modal, /arabicDialogMessage/);
assert.doesNotMatch(modal, /Missing response data/);
assert.match(modal, /surahSelectReady/);
assert.match(modal, /fromSurahNumber/);
const readyAt = modal.indexOf('surahCount > 0 && !this.surahSelectReady()');
assert.ok(readyAt >= 0);
const readyBlock = modal.slice(readyAt, readyAt + 400);
assert.match(readyBlock, /setValue\(item\.fromSurahNumber/);
assert.match(readyBlock, /surahSelectReady\.set\(true\)/);
assert.doesNotMatch(modal, /\bFormsModule\b/);

const editHtml = readFileSync(
  join(root, '../src/app/features/halaqa-detail/edit-plan-item-modal/edit-plan-item-modal.html'),
  'utf8',
);
assert.match(editHtml, /surahSelectReady\(\)/);
assert.match(editHtml, /fromSurahStandIn\(\)/);
assert.match(editHtml, /computedOnSave/);
assert.match(editHtml, /\[formGroup\]="form"/);
assert.doesNotMatch(editHtml, /عرض فقط/);
assert.doesNotMatch(editHtml, /\(ngSubmit\)|FormsModule|\bngModel\b/);

const mapper = readFileSync(
  join(root, '../src/app/features/halaqa-detail/dto/halaqa-detail.mapper.ts'),
  'utf8',
);
assert.match(mapper, /toAyah: item\.toAyah/);
assert.match(mapper, /toSurahNumber/);
assert.match(mapper, /toSurahName/);

assert.equal(
  arabicDialogMessage('Missing response data', 'حدث خطأ غير متوقع'),
  'حدث خطأ غير متوقع',
);
assert.equal(arabicDialogMessage('العنصر غير موجود', 'حدث خطأ غير متوقع'), 'العنصر غير موجود');

const envelope = readFileSync(join(root, '../src/app/core/api/envelope.helpers.ts'), 'utf8');
assert.match(envelope, /Missing response data/);

console.log('study-plan-item-response-self-check: ok');
