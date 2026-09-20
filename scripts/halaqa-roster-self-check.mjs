/** ponytail: roster comes from enrollments; date fallback skips Fri/Sat. */

function coerceId(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function personDisplayName(record) {
  if (record.name?.trim()) return record.name.trim();
  const user = record.user;
  if (user?.name?.trim()) return user.name.trim();
  return '—';
}

function mapHalqaStudent(record) {
  return {
    id: coerceId(record.id ?? record.userId ?? record.user?.id),
    name: personDisplayName(record),
  };
}

function mapHalqaRoster(record) {
  if (record.students?.length) {
    return record.students.map((student) => mapHalqaStudent(student)).filter((student) => student.id > 0);
  }
  return (record.enrollments ?? [])
    .filter((enrollment) => enrollment.isActive !== false && enrollment.user)
    .map((enrollment) => mapHalqaStudent(enrollment.user ?? {}))
    .filter((student) => student.id > 0);
}

function rosterQueryDate(today) {
  const [year, month, day] = today.split('-').map(Number);
  const utcMs = Date.UTC(year, month - 1, day);
  const weekday = new Date(utcMs).getUTCDay();
  const daysBack = weekday === 5 ? 1 : weekday === 6 ? 2 : 0;
  if (!daysBack) return today;
  const shifted = new Date(utcMs);
  shifted.setUTCDate(shifted.getUTCDate() - daysBack);
  return shifted.toISOString().slice(0, 10);
}

const fromEnrollments = mapHalqaRoster({
  id: 16,
  name: 'نموذج عماد',
  enrollments: [
    { isActive: true, user: { id: '30', name: 'TEST Student PriorTerm' } },
    { isActive: false, user: { id: '31', name: 'Inactive' } },
  ],
});
if (fromEnrollments.length !== 1 || fromEnrollments[0].id !== 30) {
  throw new Error(`expected active enrollment 30, got ${JSON.stringify(fromEnrollments)}`);
}

const emptyDateRoster = mapHalqaRoster({ id: 16, name: 'x', enrollments: [] });
if (emptyDateRoster.length !== 0) {
  throw new Error('expected empty enrollments to yield empty roster');
}

if (rosterQueryDate('2026-09-18') !== '2026-09-17') {
  throw new Error(`Friday should map to Thursday, got ${rosterQueryDate('2026-09-18')}`);
}
if (rosterQueryDate('2026-09-19') !== '2026-09-17') {
  throw new Error(`Saturday should map to Thursday, got ${rosterQueryDate('2026-09-19')}`);
}
if (rosterQueryDate('2026-09-17') !== '2026-09-17') {
  throw new Error('Thursday should stay Thursday');
}

console.log('halaqa-roster-self-check: ok');
