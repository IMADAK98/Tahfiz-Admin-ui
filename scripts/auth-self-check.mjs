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

console.log('auth-self-check: ok');
