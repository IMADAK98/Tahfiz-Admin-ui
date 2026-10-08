/** ponytail: Nest active-term 404-in-body must become null, and the ended toast follows that read. */
import assert from 'node:assert/strict';

const { activeTermReadDroppedTerm, isNoActiveTermEnvelope } =
  await import('../src/app/core/api/active-term-envelope.ts');

assert.equal(isNoActiveTermEnvelope({ status: 404, data: null, message: 'none' }, 200), true);
assert.equal(isNoActiveTermEnvelope({ statusCode: 404, data: null }, 200), true);
assert.equal(isNoActiveTermEnvelope(null, 404), true);
assert.equal(
  isNoActiveTermEnvelope({ status: 200, data: { id: 4, status: 'ACTIVE' } }, 200),
  false,
);
assert.equal(isNoActiveTermEnvelope({ status: 500, message: 'nope' }, 500), false);

const stillActive = { id: 4 };
assert.equal(activeTermReadDroppedTerm(4, stillActive), false);
assert.equal(activeTermReadDroppedTerm(4, null), true);
assert.equal(activeTermReadDroppedTerm(4, { id: 9 }), true);

console.log('active-term-envelope-self-check: ok');
