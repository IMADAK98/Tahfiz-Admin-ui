/** ponytail: invite copy path is /identify; signup with a token still gates unless identify allowed it. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inviteTokenNeedsIdentifyGate } from '../src/app/core/auth/invite-identify.ts';
import {
  mapInviteRegistrationLink,
  rewriteInviteEntryUrl,
} from '../src/app/core/config/public-links.ts';

const root = dirname(fileURLToPath(import.meta.url));
const appOrigin = 'https://tahfiz-admin-ui.vercel.app';
const term = 'TEST-ReEnroll-2026-09';
const token = 'abc-token';
const nestUrl = `${appOrigin}/signup/student?term=${term}&token=${token}`;
const onrenderUrl = `https://tahfiz.onrender.com/signup/student?term=${term}&token=${token}`;
const identifyUrl = `${appOrigin}/identify?term=${term}&token=${token}`;

function assertShare(label, url, expectedToken, expectedTerm) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, appOrigin, label);
  assert.equal(parsed.pathname, '/identify', label);
  assert.equal(parsed.searchParams.get('token'), expectedToken, label);
  assert.equal(parsed.searchParams.get('term'), expectedTerm, label);
  assert.doesNotMatch(url, /\/signup\/student/, label);
  assert.equal(parsed.hostname, 'tahfiz-admin-ui.vercel.app', label);
}

const rewritten = rewriteInviteEntryUrl(nestUrl, appOrigin);
assert.equal(rewritten, identifyUrl);
assertShare('rewrite admin signup', rewritten, token, term);

const rewrittenOnrender = rewriteInviteEntryUrl(onrenderUrl, appOrigin);
assert.equal(rewrittenOnrender, identifyUrl);

const fromRegistrationUrl = mapInviteRegistrationLink(
  { registrationUrl: nestUrl, expiresAt: '2026-11-01T00:00:00.000Z' },
  appOrigin,
);
assert.equal(fromRegistrationUrl.shareUrl, identifyUrl);
assert.equal(fromRegistrationUrl.expiresAt, '2026-11-01T00:00:00.000Z');
assert.equal('registrationUrl' in fromRegistrationUrl, false);

// Live Nest `buildRegistrationResponse`: registrationUrl + token + termName together.
const nestBody = mapInviteRegistrationLink(
  { registrationUrl: nestUrl, token, expiresAt: '2026-11-01T00:00:00.000Z', termName: term },
  appOrigin,
);
assert.equal(nestBody.shareUrl, identifyUrl);
assertShare('admin-host signup body', nestBody.shareUrl, token, term);

const fromOnrender = mapInviteRegistrationLink(
  { registrationUrl: onrenderUrl, token, termName: term },
  appOrigin,
);
assert.equal(fromOnrender.shareUrl, identifyUrl);
assertShare('onrender signup body', fromOnrender.shareUrl, token, term);

const fromOpenApi = mapInviteRegistrationLink(
  { registrationLink: 'https://tahfiz-client.vercel.app/register?token=abc123' },
  appOrigin,
);
assert.equal(fromOpenApi.shareUrl, `${appOrigin}/identify?token=abc123`);
assert.equal(new URL(fromOpenApi.shareUrl).pathname, '/identify');

const fromUrlField = mapInviteRegistrationLink(
  { url: 'https://www.tahfiz.work/signup/student?token=abc123&term=T', token: 'abc123' },
  appOrigin,
);
const parsedUrlField = new URL(fromUrlField.shareUrl);
assert.equal(parsedUrlField.origin, appOrigin);
assert.equal(parsedUrlField.pathname, '/identify');
assert.equal(parsedUrlField.searchParams.get('token'), 'abc123');
assert.equal(parsedUrlField.searchParams.get('term'), 'T');
assert.doesNotMatch(fromUrlField.shareUrl, /\/signup\/student/);

const tokenOnly = mapInviteRegistrationLink({ token, termName: term }, appOrigin);
assert.equal(tokenOnly.shareUrl, identifyUrl);

assert.equal(inviteTokenNeedsIdentifyGate('', null, undefined), false);
assert.equal(inviteTokenNeedsIdentifyGate(token, null, undefined), true);
assert.equal(inviteTokenNeedsIdentifyGate(token, token, undefined), false);
assert.equal(inviteTokenNeedsIdentifyGate(token, 'other', token), false);
assert.equal(inviteTokenNeedsIdentifyGate(token, 'other', undefined), true);

function functionBody(source, name) {
  const fn = source.indexOf(`function ${name}`);
  const start = fn === -1 ? source.indexOf(`${name}(`) : fn;
  assert.notEqual(start, -1, name);
  let i = source.indexOf('(', start);
  let paren = 0;
  for (; i < source.length; i += 1) {
    if (source[i] === '(') paren += 1;
    else if (source[i] === ')') {
      paren -= 1;
      if (paren === 0) {
        i += 1;
        break;
      }
    }
  }
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] === ':') {
    i += 1;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    if (source[i] === '{') {
      let typeDepth = 0;
      for (; i < source.length; i += 1) {
        if (source[i] === '{') typeDepth += 1;
        else if (source[i] === '}') {
          typeDepth -= 1;
          if (typeDepth === 0) {
            i += 1;
            break;
          }
        }
      }
    }
  }
  const brace = source.indexOf('{', i);
  let depth = 0;
  for (let j = brace; j < source.length; j += 1) {
    if (source[j] === '{') depth += 1;
    else if (source[j] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(brace, j + 1);
    }
  }
  assert.fail(`unclosed ${name}`);
}

const routes = readFileSync(join(root, '../src/app/app.routes.ts'), 'utf8');
assert.match(routes, /canActivate:\s*\[inviteIdentifyGuard\]/);
const centerApi = readFileSync(join(root, '../src/app/core/api/center-api.service.ts'), 'utf8');
const generateLink = functionBody(centerApi, 'generateRegistrationLink');
assert.match(generateLink, /mapRegistrationLinkResult\(/);
assert.doesNotMatch(generateLink, /registrationUrl/);
const identify = readFileSync(join(root, '../src/app/features/identify/identify.ts'), 'utf8');
assert.match(identify, /allowSignupFromIdentify\(this\.token\)/);
const signupHtml = readFileSync(
  join(root, '../src/app/features/student-signup/student-signup.html'),
  'utf8',
);
assert.match(signupHtml, /لدي حساب بالفعل — تحقق/);

const studentsTs = readFileSync(join(root, '../src/app/features/students/students.ts'), 'utf8');
const studentsHtml = readFileSync(join(root, '../src/app/features/students/students.html'), 'utf8');
const linkBoxStart = studentsHtml.indexOf('class="link-box"');
const footerStart = studentsHtml.indexOf('class="modal-footer"', linkBoxStart);
assert.notEqual(linkBoxStart, -1);
assert.ok(footerStart > linkBoxStart);
const linkBox = studentsHtml.slice(linkBoxStart, footerStart);
assert.match(linkBox, /\{\{\s*result\.shareUrl\s*\}\}/);
assert.match(linkBox, /copyRegistrationLink\(\)/);
assert.match(linkBox, /label="نسخ"/);
assert.match(studentsHtml, /linkResult\(\)\?\.shareUrl/);
assert.doesNotMatch(studentsHtml, /registrationUrl/);
assert.doesNotMatch(studentsHtml, /registrationShareUrl/);
assert.doesNotMatch(studentsHtml, /\/signup\/student/);

const copyBody = functionBody(studentsTs, 'copyRegistrationLink');
assert.match(copyBody, /linkResult\(\)\?\.shareUrl/);
assert.match(copyBody, /clipboard\.writeText\(link\)/);
assert.doesNotMatch(copyBody, /registrationUrl/);
assert.doesNotMatch(copyBody, /\/signup\/student/);
assert.doesNotMatch(studentsTs, /registrationUrl/);
assert.doesNotMatch(studentsTs, /registrationShareUrl/);
assert.doesNotMatch(studentsTs, /\/signup\/student/);

// Dialog text and نسخ both read the stored share field for the smoke Nest body.
const dialogText = nestBody.shareUrl;
const clipboardText = nestBody.shareUrl.trim();
assert.equal(dialogText, clipboardText);
assert.equal(dialogText, identifyUrl);

const links = readFileSync(join(root, '../src/app/core/config/public-links.ts'), 'utf8');
const builder = functionBody(links, 'buildAdminIdentifyShareUrl');
assert.match(builder, /IDENTIFY_ROUTE/);
assert.doesNotMatch(builder, /signup\/student/);
assert.doesNotMatch(builder, /PRODUCT_PUBLIC_HOST/);
assert.doesNotMatch(builder, /registrationUrl/);
const mapper = functionBody(links, 'mapInviteRegistrationLink');
assert.match(mapper, /shareUrl:\s*token \? buildAdminIdentifyShareUrl/);
assert.doesNotMatch(mapper, /shareUrl:\s*raw/);
assert.doesNotMatch(mapper, /rewriteInviteEntryUrl/);

const pkg = readFileSync(join(root, '../package.json'), 'utf8');
assert.match(pkg, /"build":\s*"npm run check:invite-link && ng build"/);

console.log('invite-link-self-check: ok');
