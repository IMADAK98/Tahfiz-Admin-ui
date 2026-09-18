/** ponytail: Nest 400 `errors[]` → Record<fieldName, message>.
 *  Keep in sync with src/app/core/api/error-message.helpers.ts parseNestFieldErrors(). */

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

console.log('nest-field-errors-self-check: ok');
