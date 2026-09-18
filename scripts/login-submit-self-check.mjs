/** ponytail: دخول stays PrimeNG p-button; inner type must be bound to submit.
 *  PrimeNG 22 defaults type to 'button'; a static type="submit" attr can stay on the host. */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/app/features/login/login.html', import.meta.url), 'utf8');
const ts = readFileSync(new URL('../src/app/features/login/login.ts', import.meta.url), 'utf8');
const loginService = readFileSync(new URL('../src/app/features/login/login.service.ts', import.meta.url), 'utf8');
const tokenStorage = readFileSync(
  new URL('../src/app/core/auth/token-storage.service.ts', import.meta.url),
  'utf8',
);
const interceptor = readFileSync(
  new URL('../src/app/core/http/error-toast.interceptor.ts', import.meta.url),
  'utf8',
);

assert.match(html, /\(ngSubmit\)="onSubmit\(\$event\)"/);
assert.match(html, /<p-button\s/);
assert.match(
  html,
  /\[type\]="'submit'"/,
  'p-button type must be a property binding so the inner <button> is type=submit',
);
assert.match(html, /fieldError\('email'\)/);
assert.match(html, /fieldError\('password'\)/);
assert.match(html, /<app-field-error/);
assert.doesNotMatch(
  html,
  /<button[^>]*type="submit"/,
  'دخول must remain p-button, not a native submit button',
);
assert.match(ts, /this\.loginService\.login\(this\.form\)/);
assert.match(ts, /if \(this\.submitting\(\)\)/);
assert.match(loginService, /form\.rememberMe/);
assert.match(tokenStorage, /persist \? localStorage : sessionStorage/);

const interceptorFn = interceptor.slice(interceptor.indexOf('export const errorToastInterceptor'));
assert.doesNotMatch(
  interceptorFn.split('catchError')[0],
  /inject\(ToastErrorService\)/,
  'eager ToastErrorService inject cycles TranslateService and blocks POST /auth/login',
);
assert.match(interceptorFn, /injector\.get\(ToastErrorService\)/);

console.log('login-submit-self-check: ok');
