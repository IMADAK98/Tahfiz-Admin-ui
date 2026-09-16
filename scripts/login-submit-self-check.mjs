/** ponytail: login must use a native submit button so Enter + click both POST /auth/login.
 *  PrimeNG 22 <p-button> defaults inner <button type="button">, which never fires form submit. */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/app/features/login/login.html', import.meta.url), 'utf8');
const ts = readFileSync(new URL('../src/app/features/login/login.ts', import.meta.url), 'utf8');

assert.match(html, /\(ngSubmit\)="onSubmit\(\$event\)"/);
assert.match(html, /<button\s+type="submit"/);
assert.doesNotMatch(
  html,
  /<p-button[\s\S]*type="submit"/,
  'login submit must not be PrimeNG p-button (type stays button; form never submits)',
);
assert.match(ts, /this\.loginService\.login\(this\.form\)/);

function isNativeSubmitControl(tag, type) {
  if (tag === 'button') return type === 'submit' || type === '' || type == null;
  if (tag === 'input') return type === 'submit' || type === 'image';
  return false;
}

assert.equal(isNativeSubmitControl('p-button', 'submit'), false);
assert.equal(isNativeSubmitControl('button', 'button'), false);
assert.equal(isNativeSubmitControl('button', 'submit'), true);

console.log('login-submit-self-check: ok');
