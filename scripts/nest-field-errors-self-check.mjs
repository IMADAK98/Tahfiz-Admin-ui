/** ponytail: Nest 400 `errors[]` → Record<fieldName, message>.
 *  Keep in sync with src/app/core/api/error-message.helpers.ts parseNestFieldErrors(). */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function parseNestFieldErrors(errors) {
  const result = {};
  if (!Array.isArray(errors)) {
    return result;
  }

  for (const item of errors) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const fieldName = typeof item.fieldName === 'string' ? item.fieldName.trim() : '';
    const message = typeof item.message === 'string' ? item.message.trim() : '';
    if (!fieldName || !message) {
      continue;
    }
    result[fieldName] = message;
  }

  return result;
}

function apiErrorFromBody(body, httpStatus) {
  if (body && typeof body === 'object') {
    const message =
      typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.message)
          ? body.message.join(', ')
          : (body.error ?? 'Request failed');
    return {
      message,
      httpStatus,
      bodyStatus: body.statusCode,
      fieldErrors: parseNestFieldErrors(body.errors),
    };
  }
  return { message: 'Request failed', httpStatus, fieldErrors: {} };
}

function hasNestFieldErrors(error) {
  return Object.keys(error.fieldErrors ?? parseNestFieldErrors(error.errors)).length > 0;
}

/** Locked Nest 400 body (IMADAK98/Tahfiz#3) — display messages as returned. */
const contractBody = {
  statusCode: 400,
  error: 'Bad Request',
  message: 'Validation failed',
  errors: [
    { fieldName: 'adminEmail', message: 'adminEmail must be an email' },
    { fieldName: 'adminName', message: 'adminName should not be empty' },
  ],
};

const parsed = parseNestFieldErrors(contractBody.errors);
if (parsed.adminEmail !== 'adminEmail must be an email') {
  throw new Error('expected adminEmail message as returned');
}
if (parsed.adminName !== 'adminName should not be empty') {
  throw new Error('expected adminName message as returned');
}
if (Object.keys(parsed).sort().join(',') !== 'adminEmail,adminName') {
  throw new Error(`unexpected fieldNames: ${Object.keys(parsed)}`);
}
if ('adminPassword' in parsed) {
  throw new Error('must not invent adminPassword');
}

const lastWins = parseNestFieldErrors([
  { fieldName: 'centerName', message: 'first' },
  { fieldName: 'centerName', message: 'second' },
]);
if (lastWins.centerName !== 'second') {
  throw new Error('expected last write wins');
}

const skipped = parseNestFieldErrors([
  { fieldName: '  ', message: 'x' },
  { fieldName: 'adminName', message: '  ' },
  null,
  { fieldName: 'adminAddress', message: 'العنوان قصير' },
]);
if (Object.keys(skipped).join(',') !== 'adminAddress') {
  throw new Error(`unexpected skip result: ${JSON.stringify(skipped)}`);
}

if (Object.keys(parseNestFieldErrors(undefined)).length !== 0) {
  throw new Error('expected empty record when errors missing');
}

const apiError = apiErrorFromBody(contractBody, 400);
if (apiError.message !== 'Validation failed' || !hasNestFieldErrors(apiError)) {
  throw new Error('expected ApiError to keep generic message + fieldErrors');
}

const generic = apiErrorFromBody({ statusCode: 400, message: 'تعذّر إرسال الطلب' }, 400);
if (generic.message !== 'تعذّر إرسال الطلب' || hasNestFieldErrors(generic)) {
  throw new Error('expected generic message-only 400 to have no fieldErrors');
}

const arrayMessage = apiErrorFromBody({ message: ['one', 'two'] }, 400);
if (arrayMessage.message !== 'one, two') {
  throw new Error('expected string[] message join');
}

function nestSubmitBanner(error, applyFn, fieldBanner, fallback) {
  if (applyFn(error)) {
    return fieldBanner;
  }
  return error.message ?? fallback;
}

const banner = nestSubmitBanner(
  apiError,
  (err) => Object.keys(err.fieldErrors).length > 0,
  'راجع الحقول أدناه وصحّح الأخطاء.',
  'fallback',
);
if (banner !== 'راجع الحقول أدناه وصحّح الأخطاء.') {
  throw new Error('expected field-errors banner, not Nest generic message');
}

const genericBanner = nestSubmitBanner(
  generic,
  (err) => Object.keys(err.fieldErrors).length > 0,
  'راجع الحقول أدناه وصحّح الأخطاء.',
  'fallback',
);
if (genericBanner !== 'تعذّر إرسال الطلب') {
  throw new Error('expected generic 400 to keep Nest message');
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const interceptor = readFileSync(join(root, 'src/app/core/http/error-toast.interceptor.ts'), 'utf8');
if (!interceptor.includes('hasNestFieldErrors')) {
  throw new Error('error toast interceptor must skip when Nest errors[] present');
}

const appConfig = readFileSync(join(root, 'src/app/app.config.ts'), 'utf8');
if (!appConfig.includes('httpErrorToApiInterceptor')) {
  throw new Error('httpErrorToApiInterceptor must convert Nest JSON bodies to ApiError');
}
const interceptorsLine = appConfig.match(/withInterceptors\(\[([^\]]+)\]\)/)?.[1] ?? '';
if (!interceptorsLine.trim().startsWith('httpErrorToApiInterceptor')) {
  throw new Error('httpErrorToApiInterceptor must be outermost so auth still sees HttpErrorResponse');
}

const loginHtml = readFileSync(join(root, 'src/app/features/login/login.html'), 'utf8');
if (!loginHtml.includes("fieldError('email')") || !loginHtml.includes("fieldError('password')")) {
  throw new Error('login must bind Nest email/password under inputs');
}

const teacherHtml = readFileSync(
  join(root, 'src/app/features/teachers/teacher-form-modal/teacher-form-modal.html'),
  'utf8',
);
const teacherTs = readFileSync(
  join(root, 'src/app/features/teachers/teacher-form-modal/teacher-form-modal.ts'),
  'utf8',
);
if (!teacherTs.includes("isAdd ? 'teacherName' : 'name'") || !teacherHtml.includes('nameField()')) {
  throw new Error('teacher form must bind Nest teacherName (add) / name (edit)');
}
if (
  !teacherHtml.includes("fieldError('teachingAgeGroup')") ||
  !teacherHtml.includes("fieldError('availableWorkPeriod')")
) {
  throw new Error('teacher form must bind Nest teachingAgeGroup / availableWorkPeriod');
}

const rejectFiles = [
  'src/app/features/teacher-requests/teacher-requests.html',
  'src/app/features/student-requests/student-requests.html',
  'src/app/features/center-requests/center-requests.html',
  'src/app/features/re-enrollment/re-enrollment.html',
];
for (const rel of rejectFiles) {
  const html = readFileSync(join(root, rel), 'utf8');
  if (!html.includes("fieldError('rejectionReason')")) {
    throw new Error(`${rel} must bind Nest rejectionReason under textarea`);
  }
}

const signupTs = readFileSync(join(root, 'src/app/features/center-signup/center-signup.ts'), 'utf8');
if (!signupTs.includes('validateCenterSignupForm') || !signupTs.includes('nestSubmitBanner')) {
  throw new Error('center-signup must keep client validate + Nest field banner');
}

const arJson = JSON.parse(readFileSync(join(root, 'public/i18n/ar.json'), 'utf8'));
if (arJson.errors?.fieldErrorsBanner !== 'راجع الحقول أدناه وصحّح الأخطاء.') {
  throw new Error('shared ar errors.fieldErrorsBanner missing');
}

console.log('nest-field-errors-self-check: ok');
