/** ponytail: view mappers + path locks for the two admin profile pages. */
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

const { mapCenterProfile } = await import(
  '../src/app/features/center-profile/dto/center-profile-view.model.ts'
);
const { mapAdminProfile } = await import('../src/app/features/profile/dto/admin-profile-view.model.ts');

const center = mapCenterProfile({
  name: 'مركز النور',
  address: 'حي العليا، شارع التخصصي، الرياض',
  isActive: true,
});
assert.equal(center.name, 'مركز النور');
assert.equal(center.address, 'حي العليا، شارع التخصصي، الرياض');
assert.equal(center.isActive, true);
assert.equal(center.initial, 'م');
assert.equal('phone' in center, false);
assert.equal('email' in center, false);
assert.equal('id' in center, false);

const emptyCenter = mapCenterProfile({ name: '  ', address: null, isActive: false });
assert.equal(emptyCenter.name, '—');
assert.equal(emptyCenter.address, '—');
assert.equal(emptyCenter.isActive, false);
assert.equal(emptyCenter.initial, 'م');

const admin = mapAdminProfile({
  name: 'محمد العتيبي',
  email: 'admin@noor.example',
  phone: '0501234567',
  address: 'الرياض، حي النرجس',
  nationality: 'سعودي',
  birthDate: '1988-05-14T00:00:00.000Z',
  identificationNumber: '1098765432',
  passportNumber: '',
  isActive: true,
  role: { name: 'ADMIN' },
  center: { name: 'مركز النور' },
});
assert.equal(admin.roleLabel, 'مدير مركز');
assert.equal(admin.roleHeadLabel, 'مدير المركز');
assert.equal(admin.centerName, 'مركز النور');
assert.equal(admin.birthDate, '1988-05-14');
assert.equal(admin.passportNumber, '—');
assert.equal(admin.initial, 'م');
assert.equal('password' in admin, false);

const stringRole = mapAdminProfile({ role: 'TEACHER', center: { name: '  ' } });
assert.equal(stringRole.roleLabel, 'معلّم');
assert.equal(stringRole.centerName, '—');

const centerApi = readFileSync(new URL('../src/app/core/api/center-api.service.ts', import.meta.url), 'utf8');
assert.match(centerApi, /\/center\/\$\{centerId\}/);

const userApi = readFileSync(new URL('../src/app/core/api/user-api.service.ts', import.meta.url), 'utf8');
assert.match(userApi, /\/users\/\$\{id\}/);
assert.match(userApi, /unwrapUserRecord/);
assert.doesNotMatch(userApi, /admin-profile/);

const profileService = readFileSync(new URL('../src/app/features/profile/profile.service.ts', import.meta.url), 'utf8');
assert.match(profileService, /userApi\.getById/);
assert.doesNotMatch(profileService, /getProfile|admin-profile/);

const centerHtml = readFileSync(
  new URL('../src/app/features/center-profile/center-profile.html', import.meta.url),
  'utf8',
);
assert.match(centerHtml, /اسم المركز/);
assert.match(centerHtml, /عنوان المركز/);
assert.match(centerHtml, /الحالة/);
assert.doesNotMatch(centerHtml, /هاتف|البريد|المدينة|الشعار|تعديل|حفظ|كلمة المرور/);

const profileHtml = readFileSync(new URL('../src/app/features/profile/profile.html', import.meta.url), 'utf8');
assert.match(profileHtml, /رقم جواز السفر/);
assert.match(profileHtml, /رقم الهوية الوطنية/);
assert.doesNotMatch(profileHtml, /تعديل|حفظ|كلمة المرور|password/);

const shell = readFileSync(new URL('../src/app/layout/admin-shell/admin-shell.html', import.meta.url), 'utf8');
assert.match(shell, /الحساب/);
assert.match(shell, /\/admin\/center-profile/);
assert.match(shell, /\/admin\/profile/);

const shellTs = readFileSync(new URL('../src/app/layout/admin-shell/admin-shell.ts', import.meta.url), 'utf8');
assert.match(shellTs, /بيانات المركز/);
assert.match(shellTs, /تسجيل الخروج/);

console.log('profile-pages self-check ok');
