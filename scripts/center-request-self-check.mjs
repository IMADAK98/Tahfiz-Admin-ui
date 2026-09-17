/** ponytail: mapper + Nest path locks for SYSTEM_ADMIN center requests. */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function coerceCenterRequestId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function coerceOptionalId(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function displayText(value) {
  if (value == null) {
    return '—';
  }
  const trimmed = String(value).trim();
  return trimmed || '—';
}

function displayDate(value) {
  const text = displayText(value);
  if (text === '—') {
    return text;
  }
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoDate ? isoDate[1] : text;
}

assert.equal(coerceCenterRequestId('12'), 12);
assert.equal(coerceCenterRequestId(8), 8);
assert.equal(coerceOptionalId('5'), 5);
assert.equal(coerceOptionalId(null), null);
assert.equal(coerceOptionalId(''), null);
assert.equal(displayText(''), '—');
assert.equal(displayText('  الرياض  '), 'الرياض');
assert.equal(displayDate('1400-01-15T00:00:00.000Z'), '1400-01-15');
assert.equal(displayDate('١٤٠٠/٠١/١٥'), '١٤٠٠/٠١/١٥');

const nestedCenterId = coerceOptionalId(undefined ?? { id: '5' }.id);
assert.equal(nestedCenterId, 5);
assert.equal(nestedCenterId != null ? `centerId ${nestedCenterId}` : '—', 'centerId 5');

const api = readFileSync(new URL('../src/app/core/api/center-request-api.service.ts', import.meta.url), 'utf8');
assert.match(api, /\/system-admin\/center-requests/);
assert.match(api, /\/system-admin\/center-requests\/\$\{id\}\/approve/);
assert.match(api, /\/system-admin\/center-requests\/\$\{id\}\/reject/);
assert.match(api, /withSkipGlobalErrorToast/);
assert.match(api, /unwrapEnvelopeOrNull/);

const featureService = readFileSync(
  new URL('../src/app/features/center-requests/center-requests.service.ts', import.meta.url),
  'utf8',
);
assert.match(featureService, /rejectionReason/);

const html = readFileSync(new URL('../src/app/features/center-requests/center-requests.html', import.meta.url), 'utf8');
assert.match(html, /<p-button\s/);
assert.doesNotMatch(html, /<button\b/);
assert.match(html, /بيانات المشرف/);
assert.match(html, /بيانات المركز/);
assert.match(html, /سبب الرفض/);
assert.match(html, /\[type\]="'submit'"/);
assert.doesNotMatch(html, /studentsCount|termsCount|halaqatCount/);
assert.match(html, /لوحة المؤشرات/);

const feature = readFileSync(new URL('../src/app/features/center-requests/center-requests.ts', import.meta.url), 'utf8');
assert.match(feature, /isPendingCenterRequest/);
assert.match(feature, /TOAST_I18N\.success\.centerRequestApproved/);
assert.match(feature, /TOAST_I18N\.success\.centerRequestRejected/);

const shell = readFileSync(
  new URL('../src/app/layout/system-admin-shell/system-admin-shell.html', import.meta.url),
  'utf8',
);
assert.match(shell, /طلبات المراكز/);
assert.match(shell, /لوحة المؤشرات/);
assert.match(shell, /sa-nav-link muted/);
assert.doesNotMatch(shell, /الحلقات|المعلمون|الطلاب|الدورات/);

console.log('center-request-self-check: ok');
