/** ponytail: client rules + path locks for admin credential dialogs. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\\.(ts|js|mjs|json)$/.test(specifier)) {
    try {
      return await nextResolve(specifier + '.ts', context);
    } catch {
      return nextResolve(specifier + '/index.ts', context);
    }
  }
  return nextResolve(specifier, context);
}
`),
);

const { validateChangePasswordForm, toChangePasswordRequest, CHANGE_PASSWORD_MIN_LENGTH } = await import(
  '../src/app/features/profile/dto/change-password-form.model.ts'
);
const { validateChangeEmailForm, toChangeEmailRequest } = await import(
  '../src/app/features/profile/dto/change-email-form.model.ts'
);
const { authTokensFromUnknown } = await import('../src/app/core/api/credential-change.model.ts');

assert.equal(CHANGE_PASSWORD_MIN_LENGTH, 8);

const mismatch = validateChangePasswordForm({
  currentPassword: 'old-pass',
  newPassword: '1234567',
  confirmPassword: '12345678',
});
assert.equal(mismatch.newPassword, 'ثمانية أحرف على الأقل');
assert.equal(mismatch.confirmPassword, 'كلمتا المرور غير متطابقتين');

const missingCurrent = validateChangePasswordForm({
  currentPassword: '',
  newPassword: '12345678',
  confirmPassword: '12345678',
});
assert.ok(missingCurrent.currentPassword);

const okPassword = validateChangePasswordForm({
  currentPassword: 'old-pass',
  newPassword: '12345678',
  confirmPassword: '12345678',
});
assert.equal(Object.keys(okPassword).length, 0);
assert.deepEqual(toChangePasswordRequest({
  currentPassword: 'old-pass',
  newPassword: '12345678',
  confirmPassword: '12345678',
}), { currentPassword: 'old-pass', newPassword: '12345678' });
assert.equal('confirmPassword' in toChangePasswordRequest({
  currentPassword: 'a',
  newPassword: '12345678',
  confirmPassword: '12345678',
}), false);

const badEmail = validateChangeEmailForm({ newEmail: 'not-an-email', currentPassword: '' });
assert.ok(badEmail.newEmail);
assert.ok(badEmail.currentPassword);

const emailBody = toChangeEmailRequest({ newEmail: '  name@example.com  ', currentPassword: 'secret' });
assert.deepEqual(emailBody, { newEmail: 'name@example.com', currentPassword: 'secret' });

assert.equal(authTokensFromUnknown(null), null);
assert.equal(authTokensFromUnknown({ accessToken: 'a' }), null);
assert.equal(authTokensFromUnknown({ data: null }), null);
assert.deepEqual(authTokensFromUnknown({ accessToken: 'a', refreshToken: 'b' }), {
  accessToken: 'a',
  refreshToken: 'b',
});
assert.deepEqual(authTokensFromUnknown({ tokens: { accessToken: 'a', refreshToken: 'b' } }), {
  accessToken: 'a',
  refreshToken: 'b',
});

const authApi = readFileSync(new URL('../src/app/core/api/auth-api.service.ts', import.meta.url), 'utf8');
assert.match(authApi, /\/auth\/change-password/);
assert.match(authApi, /\/auth\/change-email/);
assert.match(authApi, /تعذّر تحديث الجلسة بعد تغيير البريد/);
const passwordMethod = authApi.slice(authApi.indexOf('changePassword('), authApi.indexOf('changeEmail('));
assert.doesNotMatch(passwordMethod, /setTokens|authTokensFromUnknown/);
const credentialModel = readFileSync(
  new URL('../src/app/core/api/credential-change.model.ts', import.meta.url),
  'utf8',
);
assert.match(credentialModel, /currentPassword/);
assert.match(credentialModel, /newPassword/);
assert.match(credentialModel, /newEmail/);

const profileDir = [
  '../src/app/features/profile/profile.ts',
  '../src/app/features/profile/profile.service.ts',
  '../src/app/features/profile/change-password-dialog/change-password-dialog.ts',
  '../src/app/features/profile/change-email-dialog/change-email-dialog.ts',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');
assert.doesNotMatch(profileDir, /request-password-reset|reset-password|admin-profile|teacher-profile/);
assert.match(profileDir, /changePassword/);
assert.match(profileDir, /changeEmail/);

const authService = readFileSync(new URL('../src/app/core/auth/auth.service.ts', import.meta.url), 'utf8');
const servicePassword = authService.slice(authService.indexOf('changePassword('), authService.indexOf('changeEmail('));
const serviceEmail = authService.slice(authService.indexOf('changeEmail('), authService.indexOf('requestPasswordReset('));
assert.doesNotMatch(servicePassword, /setTokens/);
assert.match(serviceEmail, /setTokens\(tokens\)/);

const interceptor = readFileSync(new URL('../src/app/core/auth/auth.interceptor.ts', import.meta.url), 'utf8');
assert.match(interceptor, /\/auth\/change-password/);
assert.match(interceptor, /\/auth\/change-email/);
assert.match(interceptor, /isCredentialChangeEndpoint/);
assert.doesNotMatch(
  interceptor.slice(0, interceptor.indexOf('CREDENTIAL_CHANGE_PATHS')),
  /change-password/,
);

const centerHtml = readFileSync(
  new URL('../src/app/features/center-profile/center-profile.html', import.meta.url),
  'utf8',
);
assert.doesNotMatch(centerHtml, /تغيير البريد|تغيير كلمة المرور/);

console.log('profile-credentials self-check ok');
