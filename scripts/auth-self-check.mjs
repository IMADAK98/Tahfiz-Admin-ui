/** ponytail: keep in sync with redirect.helpers.ts + auth-role.helpers.ts */

function safeRedirectPath(path, fallback = '/admin') {
  if (!path || typeof path !== 'string') {
    return fallback;
  }

  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed.includes('://') || trimmed.includes('\\')) {
    return fallback;
  }

  return trimmed;
}

function isAdminRole(role) {
  return role === 'ADMIN' || role === 'SYSTEM_ADMIN';
}

function isSystemAdminRole(role) {
  return role === 'SYSTEM_ADMIN';
}

function isCenterAdminRole(role) {
  return role === 'ADMIN';
}

const CENTER_ADMIN_HOME = '/admin';
const SYSTEM_ADMIN_HOME = '/system-admin/center-requests';

function postLoginPath(role, redirect) {
  if (role === 'SYSTEM_ADMIN') {
    const path = safeRedirectPath(redirect, SYSTEM_ADMIN_HOME);
    return path.startsWith('/system-admin') ? path : SYSTEM_ADMIN_HOME;
  }

  const path = safeRedirectPath(redirect, CENTER_ADMIN_HOME);
  return path.startsWith('/system-admin') ? CENTER_ADMIN_HOME : path;
}

const redirectCases = [
  ['/admin', '/admin'],
  ['/admin/halaqat', '/admin/halaqat'],
  ['https://evil.com', '/admin'],
  ['//evil.com', '/admin'],
  ['', '/admin'],
  [null, '/admin'],
  ['/login?x=1', '/login?x=1'],
];

for (const [input, expected] of redirectCases) {
  const actual = safeRedirectPath(input);
  if (actual !== expected) {
    throw new Error(`safeRedirectPath(${JSON.stringify(input)}) => ${actual}, expected ${expected}`);
  }
}

const roleCases = [
  ['ADMIN', true],
  ['SYSTEM_ADMIN', true],
  ['TEACHER', false],
  ['STUDENT', false],
  [undefined, false],
];

for (const [role, expected] of roleCases) {
  const actual = isAdminRole(role);
  if (actual !== expected) {
    throw new Error(`isAdminRole(${JSON.stringify(role)}) => ${actual}, expected ${expected}`);
  }
}

if (!isSystemAdminRole('SYSTEM_ADMIN') || isSystemAdminRole('ADMIN')) {
  throw new Error('isSystemAdminRole should match SYSTEM_ADMIN only');
}

if (!isCenterAdminRole('ADMIN') || isCenterAdminRole('SYSTEM_ADMIN')) {
  throw new Error('isCenterAdminRole should match ADMIN only');
}

const postLoginCases = [
  ['SYSTEM_ADMIN', null, SYSTEM_ADMIN_HOME],
  ['SYSTEM_ADMIN', '/admin', SYSTEM_ADMIN_HOME],
  ['SYSTEM_ADMIN', '/system-admin/center-requests', SYSTEM_ADMIN_HOME],
  ['ADMIN', null, CENTER_ADMIN_HOME],
  ['ADMIN', '/admin/halaqat', '/admin/halaqat'],
  ['ADMIN', '/system-admin/center-requests', CENTER_ADMIN_HOME],
  ['ADMIN', 'https://evil.com', CENTER_ADMIN_HOME],
];

for (const [role, redirect, expected] of postLoginCases) {
  const actual = postLoginPath(role, redirect);
  if (actual !== expected) {
    throw new Error(
      `postLoginPath(${JSON.stringify(role)}, ${JSON.stringify(redirect)}) => ${actual}, expected ${expected}`,
    );
  }
}

console.log('auth-self-check: ok');
