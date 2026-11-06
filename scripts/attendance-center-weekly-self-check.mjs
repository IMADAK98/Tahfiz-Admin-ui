/** ponytail: Option 2 grid normalizes one center-wide payload and does not fan out. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CENTER_WEEKLY_TABLE_PATH, centerWeeklyHalqaIdParam } from '../src/app/core/api/attendance-weekly-query.ts';
import { ALL_ACTIVE_HALAQAT, ALL_ACTIVE_HALAQAT_LABEL } from '../src/app/features/attendance-report/dto/attendance-report-filters.dto.ts';
import {
  formatStudentCountAr,
  normalizeCenterWeeklyTable,
  readHalqaDropdown,
  withAllActiveHalqaOption,
} from '../src/app/features/attendance-report/dto/center-weekly-table.mapper.ts';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, '..', 'src');

assert.equal(CENTER_WEEKLY_TABLE_PATH, '/attendance/weekly-table');
assert.equal(centerWeeklyHalqaIdParam(null), null);
assert.equal(centerWeeklyHalqaIdParam(undefined), null);
assert.equal(centerWeeklyHalqaIdParam(0), null);
assert.equal(centerWeeklyHalqaIdParam(Number.NaN), null);
assert.equal(centerWeeklyHalqaIdParam(12.9), '12');

assert.equal(ALL_ACTIVE_HALAQAT_LABEL, 'كل الحلقات النشطة');
assert.equal(formatStudentCountAr(0), 'لا طلاب');
assert.equal(formatStudentCountAr(1), 'طالب واحد');
assert.equal(formatStudentCountAr(2), 'طالبان');
assert.equal(formatStudentCountAr(5), '5 طلاب');
assert.equal(formatStudentCountAr(11), '11 طالباً');

const statusSrc = readFileSync(
  join(src, 'app/features/attendance-report/enums/attendance-status.enum.ts'),
  'utf8',
);
assert.match(statusSrc, /case AttendanceStatusUi\.Leave:[\s\S]*?label: 'معذور'/);
assert.match(statusSrc, /kind: 'blank', label: '—'/);
assert.match(statusSrc, /case AttendanceStatusUi\.Present:[\s\S]*?label: 'حاضر'/);

const flat = normalizeCenterWeeklyTable({
  halqa: null,
  weekStartDate: '2026-11-08T00:00:00.000Z',
  weekEndDate: '2026-11-12T00:00:00.000Z',
  columns: [{ dayOfWeek: 'Sunday', date: '2026-11-08', termDayId: '105', isHoliday: false }],
  students: [
    {
      student: { id: 2, name: 'زياد' },
      halqa: { id: '1', name: 'ب' },
      days: [{ date: '2026-11-08T00:00:00.000Z', status: 'NOT_MARKED', termDayId: '105' }],
    },
    {
      student: { id: '26', name: 'عبدالله بن سعد الدوسري' },
      halqa: { id: '3', name: 'حلقة الفجر' },
      days: [{ date: '2026-11-08T00:00:00.000Z', status: 'PRESENT', termDayId: '105' }],
    },
  ],
});
assert.equal(flat.halqa, null);
assert.equal(flat.weekStartDate, '2026-11-08');
assert.equal(flat.columns[0].date, '2026-11-08');
assert.equal(flat.columns[0].termDayId, 105);
assert.equal(flat.students.length, 2);
assert.deepEqual(
  flat.students.map((row) => row.student.name),
  ['زياد', 'عبدالله بن سعد الدوسري'],
);
assert.equal(flat.students[1].student.id, 26);
assert.equal(flat.students[1].halqa?.name, 'حلقة الفجر');
assert.equal(flat.students[1].days[0].date, '2026-11-08');
assert.equal(flat.students[1].days[0].status, 'PRESENT');

const single = normalizeCenterWeeklyTable({
  halqa: { id: '9', name: 'حلقة العصر' },
  columns: [{ date: '2026-11-09', dayOfWeek: 'Monday' }],
  students: [{ student: { id: 4, name: 'سارة' }, days: [{ date: '2026-11-09', status: 'ABSENT' }] }],
});
assert.equal(single.students[0].halqa?.id, 9);
assert.equal(single.students[0].halqa?.name, 'حلقة العصر');

const dropdown = withAllActiveHalqaOption(
  readHalqaDropdown([
    { id: '3', name: 'حلقة الفجر', category: 'PRIMARY' },
    { id: 5, name: 'مغلقة', isActive: false, category: 'PRIMARY' },
    { id: '3', name: 'مكرر', category: 'PRIMARY' },
    { id: '7', name: 'حلقة المراجعة', category: 'SECONDARY' },
  ]),
);
assert.deepEqual(
  dropdown.map((option) => option.value),
  [ALL_ACTIVE_HALAQAT, '3', '7'],
);
assert.equal(dropdown[0].name, 'كل الحلقات النشطة');
assert.equal(dropdown[2].name, 'حلقة المراجعة');

const api = readFileSync(join(src, 'app/core/api/attendance-api.service.ts'), 'utf8');
const feature = readFileSync(join(src, 'app/features/attendance-report/attendance-report.service.ts'), 'utf8');
const html = readFileSync(join(src, 'app/features/attendance-report/attendance-report.html'), 'utf8');
const pathHits = api.match(/\/attendance\/weekly-table/g) ?? [];
assert.equal(pathHits.length, 0, 'path string stays in CENTER_WEEKLY_TABLE_PATH');
assert.match(api, /CENTER_WEEKLY_TABLE_PATH/);
assert.match(api, /getHalqaDropdown/);
assert.match(feature, /getCenterWeeklyTable/);
assert.match(feature, /getHalqaDropdown/);
assert.doesNotMatch(feature, /getWeeklyTable\(/);
assert.doesNotMatch(feature, /forkJoin/);
assert.doesNotMatch(feature, /getActiveTerm|by-term|getHalqasByTerm/);
assert.doesNotMatch(feature, /\/attendance\/halqa\//);
assert.match(html, /halaqa-under/);
assert.match(html, /تصدير CSV/);
assert.match(html, /الحلقات <strong>النشطة<\/strong> فقط/);

const queryFile = readFileSync(join(src, 'app/core/api/attendance-weekly-query.ts'), 'utf8');
assert.equal(
  (queryFile.match(/CENTER_WEEKLY_TABLE_PATH = '\/attendance\/weekly-table'/g) ?? []).length,
  1,
);

console.log('attendance-center-weekly-self-check: ok');
