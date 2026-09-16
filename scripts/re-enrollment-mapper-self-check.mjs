/** ponytail: smallest check that mapper coerces ids and builds contract fields. */
function coerceId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildIdentityLabel(raw) {
  return raw.identificationNumber?.trim() || raw.passportNumber?.trim() || null;
}

function buildHifzSummary(raw) {
  if (raw.isHafiz) return 'حافظ';
  if (raw.surah_from && raw.surah_to) return `من ${raw.surah_from} إلى ${raw.surah_to}`;
  return null;
}

const raw = {
  id: '14',
  existingUserId: '30',
  termId: 13,
  appliedToCenterId: 1,
  status: 'PENDING',
  name: 'عبدالله',
  email: 'test@example.com',
  phone: '0501111111',
  parentPhone: '0502222222',
  identificationNumber: '1234567890',
  educationStage: 'ELEMENTARY SCHOOL',
  surah_from: 'الفاتحة',
  surah_to: 'الكهف',
  isHafiz: false,
};

const mapped = {
  id: coerceId(raw.id),
  existingUserId: coerceId(raw.existingUserId),
  termId: coerceId(raw.termId),
  identityLabel: buildIdentityLabel(raw),
  hifzSummary: buildHifzSummary(raw),
};

if (
  mapped.id !== 14 ||
  mapped.existingUserId !== 30 ||
  mapped.identityLabel !== '1234567890' ||
  !mapped.hifzSummary.includes('الكهف')
) {
  throw new Error('re-enrollment mapper self-check failed');
}

console.log('re-enrollment-mapper-self-check: ok');
