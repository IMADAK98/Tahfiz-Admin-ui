/** ponytail: smallest check that mapper coerces ids and filters pending semantics. */
function coerceId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value) {
  const raw = String(value ?? 'PENDING').toUpperCase();
  if (raw === 'APPROVED') return 'APPROVED';
  if (raw === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

const termNames = new Map([[13, 'TEST-ReEnroll-2026-09']]);
const raw = {
  id: '14',
  existingUserId: '30',
  termId: 13,
  appliedToCenterId: 1,
  status: 'PENDING',
  studentName: 'عبدالله',
  email: 'test@example.com',
};

const mapped = {
  id: coerceId(raw.id),
  existingUserId: coerceId(raw.existingUserId),
  termId: coerceId(raw.termId),
  status: normalizeStatus(raw.status),
  termLabel: `${termNames.get(coerceId(raw.termId))} (termId ${coerceId(raw.termId)})`,
};

if (mapped.id !== 14 || mapped.existingUserId !== 30 || mapped.status !== 'PENDING') {
  throw new Error('re-enrollment mapper self-check failed');
}

console.log('re-enrollment-mapper-self-check: ok');
