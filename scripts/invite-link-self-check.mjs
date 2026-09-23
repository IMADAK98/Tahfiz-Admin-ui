/** ponytail: invite copy path is /identify; signup with a token still gates unless identify allowed it. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inviteTokenNeedsIdentifyGate } from '../src/app/core/auth/invite-identify.ts';
import { mapInviteRegistrationLink, rewriteInviteEntryUrl } from '../src/app/core/config/public-links.ts';

const root = dirname(fileURLToPath(import.meta.url));
const appOrigin = 'https://tahfiz-admin-ui.vercel.app';
const term = 'TEST-ReEnroll-2026-09';
const token = 'abc-token';
const nestUrl = `${appOrigin}/signup/student?term=${term}&token=${token}`;

const rewritten = rewriteInviteEntryUrl(nestUrl, appOrigin);
assert.equal(rewritten, `${appOrigin}/identify?term=${term}&token=${token}`);

const fromRegistrationUrl = mapInviteRegistrationLink(
  { registrationUrl: nestUrl, expiresAt: '2026-11-01T00:00:00.000Z' },
  appOrigin,
);
assert.equal(fromRegistrationUrl.registrationUrl, `${appOrigin}/identify?term=${term}&token=${token}`);
assert.equal(fromRegistrationUrl.expiresAt, '2026-11-01T00:00:00.000Z');

const fromOpenApi = mapInviteRegistrationLink(
  { registrationLink: 'https://tahfiz-client.vercel.app/register?token=abc123' },
  appOrigin,
);
assert.equal(fromOpenApi.registrationUrl, `${appOrigin}/identify?token=abc123`);

const fromUrlField = mapInviteRegistrationLink(
  { url: 'https://www.tahfiz.work/signup/student?token=abc123&term=T', token: 'abc123' },
  appOrigin,
);
const parsedUrlField = new URL(fromUrlField.registrationUrl);
assert.equal(parsedUrlField.origin, appOrigin);
assert.equal(parsedUrlField.pathname, '/identify');
assert.equal(parsedUrlField.searchParams.get('token'), 'abc123');
assert.equal(parsedUrlField.searchParams.get('term'), 'T');

const tokenOnly = mapInviteRegistrationLink({ token, termName: term }, appOrigin);
assert.equal(tokenOnly.registrationUrl, `${appOrigin}/identify?token=${token}&term=${term}`);

assert.equal(inviteTokenNeedsIdentifyGate('', null, undefined), false);
assert.equal(inviteTokenNeedsIdentifyGate(token, null, undefined), true);
assert.equal(inviteTokenNeedsIdentifyGate(token, token, undefined), false);
assert.equal(inviteTokenNeedsIdentifyGate(token, 'other', token), false);
assert.equal(inviteTokenNeedsIdentifyGate(token, 'other', undefined), true);

const routes = readFileSync(join(root, '../src/app/app.routes.ts'), 'utf8');
assert.match(routes, /canActivate:\s*\[inviteIdentifyGuard\]/);
const centerApi = readFileSync(join(root, '../src/app/core/api/center-api.service.ts'), 'utf8');
assert.match(centerApi, /mapRegistrationLinkResult\(/);
const identify = readFileSync(join(root, '../src/app/features/identify/identify.ts'), 'utf8');
assert.match(identify, /allowSignupFromIdentify\(this\.token\)/);
const signupHtml = readFileSync(join(root, '../src/app/features/student-signup/student-signup.html'), 'utf8');
assert.match(signupHtml, /لدي حساب بالفعل — تحقق/);

console.log('invite-link-self-check: ok');
