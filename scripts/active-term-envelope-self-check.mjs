/** ponytail: Nest active-term 404-in-body must become null. */
import assert from 'node:assert/strict';

const { isNoActiveTermEnvelope } = await import('../src/app/core/api/active-term-envelope.ts');

assert.equal(isNoActiveTermEnvelope({ status: 404, data: null, message: 'none' }, 200), true);
assert.equal(isNoActiveTermEnvelope({ statusCode: 404, data: null }, 200), true);
assert.equal(isNoActiveTermEnvelope(null, 404), true);
assert.equal(
  isNoActiveTermEnvelope({ status: 200, data: { id: 4, status: 'ACTIVE' } }, 200),
  false,
);
assert.equal(isNoActiveTermEnvelope({ status: 500, message: 'nope' }, 500), false);

console.log('active-term-envelope-self-check: ok');
