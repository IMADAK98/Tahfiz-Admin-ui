/**
 * Pure contract checks for the report term picker.
 * Mocked: no Nest process is contacted. Tahfiz PR 43 is unmerged.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { centerWeeklyQueryParams, halqaWeeklyQueryParams } from '../src/app/core/api/attendance-weekly-query.ts';
import { progressReportQueryParams } from '../src/app/core/api/progress-report-query.ts';
import { readTermList } from '../src/app/core/api/term-list.ts';
import { buildAttendanceWeeklyCsv } from '../src/app/features/attendance-report/attendance-report-csv.ts';
import { ALL_ACTIVE_HALAQAT } from '../src/app/features/attendance-report/dto/attendance-report-filters.dto.ts';
import { buildProgressReportCsv } from '../src/app/features/progress-report/progress-report-csv.ts';
import { REPORT_TERM_NO_FALLBACK, toReportTermRef } from '../src/app/features/report-term/dto/report-term.dto.ts';
import {
  attendanceAllLabel,
  attendanceHalqaAfterTermChange,
  attendanceWeekForTerm,
  explicitTermFailureMessage,
  parseReportTermQuery,
  progressDateForTerm,
  progressHalqaAfterTermChange,
  reportTermBlockedReason,
  resolveReportTerm,
  termIdAfterFailure,
} from '../src/app/features/report-term/report-term-context.ts';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, '..', 'src');

const active = {
  id: 40,
  name: 'الدورة الحالية',
  status: 'ACTIVE',
  startDate: '2026-11-08',
  endDate: '2026-12-31',
};
const sliced29 = toReportTermRef({
  id: 29,
  name: 'الدورة ٢٩',
  status: 'COMPLETED',
  startDate: '2026-11-03T00:00:00.000Z',
  endDate: '2026-11-07T00:00:00.000Z',
});
assert.equal(sliced29?.startDate, '2026-11-03');
assert.equal(sliced29?.endDate, '2026-11-07');
const term29 = sliced29;
const catalog = { terms: [term29, active], listErrorMessage: null };

assert.deepEqual(parseReportTermQuery(null), { kind: 'absent' });
assert.deepEqual(parseReportTermQuery('29'), { kind: 'explicit', termId: 29 });
assert.deepEqual(parseReportTermQuery('abc'), { kind: 'invalid' });
assert.equal(parseReportTermQuery('29').kind === 'explicit' && String(parseReportTermQuery('29').termId), '29');

const defaulted = resolveReportTerm({ kind: 'absent' }, catalog);
assert.equal(defaulted.state, 'selected');
assert.equal(defaulted.term.id, 40);
assert.equal(defaulted.explicit, false);
assert.equal(progressReportQueryParams({
  halqaId: 27,
  period: 'week',
  startingDate: '2026-11-08',
  endingDate: '2026-11-12',
  termId: defaulted.term.id,
}).termId, '40');

const explicit29 = resolveReportTerm({ kind: 'explicit', termId: 29 }, catalog);
assert.equal(explicit29.state, 'selected');
assert.equal(explicit29.term.id, 29);
assert.equal(explicit29.explicit, true);
assert.equal(termIdAfterFailure(explicit29), 29);
assert.notEqual(termIdAfterFailure(explicit29), active.id);
const missing = resolveReportTerm({ kind: 'explicit', termId: 99 }, catalog);
assert.equal(missing.state, 'explicit-missing');
assert.equal(termIdAfterFailure(missing), 99);
assert.match(reportTermBlockedReason(missing), new RegExp(REPORT_TERM_NO_FALLBACK));
assert.doesNotMatch(reportTermBlockedReason(missing), /الدورة الحالية/);

const unresolved = resolveReportTerm(
  { kind: 'explicit', termId: 29 },
  { terms: null, listErrorMessage: 'تعذر' },
);
assert.equal(unresolved.state, 'explicit-unresolved');
assert.equal(termIdAfterFailure(unresolved), 29);
const unresolvedMessage = reportTermBlockedReason(unresolved, 'تعذر');
assert.match(unresolvedMessage, /29/);
assert.match(unresolvedMessage, /أعد المحاولة/);
assert.doesNotMatch(unresolvedMessage, /نشطة|مكتملة/);
const listFailed = resolveReportTerm({ kind: 'absent' }, { terms: null, listErrorMessage: 'تعذر' });
assert.equal(listFailed.state, 'list-failed');
assert.doesNotMatch(reportTermBlockedReason(listFailed), /نشطة|مكتملة/);
assert.match(explicitTermFailureMessage(unresolved, 'HALQA_NOT_FOUND'), /HALQA_NOT_FOUND/);
assert.match(explicitTermFailureMessage(unresolved, 'HALQA_NOT_FOUND'), new RegExp(REPORT_TERM_NO_FALLBACK));

const invalid = resolveReportTerm({ kind: 'invalid' }, catalog);
assert.equal(invalid.state, 'explicit-invalid');
assert.equal(termIdAfterFailure(invalid), null);
assert.match(reportTermBlockedReason(invalid), new RegExp(REPORT_TERM_NO_FALLBACK));

const noActive = resolveReportTerm(
  { kind: 'absent' },
  { terms: [term29], listErrorMessage: null },
);
assert.equal(noActive.state, 'no-active');
assert.match(reportTermBlockedReason(noActive), /دورة مكتملة/);

assert.equal(progressDateForTerm('week', '2026-11-08', explicit29.term), '2026-11-01');
assert.equal(progressDateForTerm('week', '2026-11-01', explicit29.term), '2026-11-01');
assert.equal(progressDateForTerm('day', '2026-11-05', explicit29.term), '2026-11-05');
assert.equal(progressDateForTerm('day', '2026-11-08', explicit29.term), '2026-11-03');
assert.equal(progressDateForTerm('month', '2026-11', explicit29.term), '2026-11');
assert.equal(progressDateForTerm('month', '2026-10', explicit29.term), '2026-11');
assert.equal(attendanceWeekForTerm('2026-11-08', explicit29.term), '2026-11-01');

assert.equal(attendanceHalqaAfterTermChange(ALL_ACTIVE_HALAQAT, [27]), ALL_ACTIVE_HALAQAT);
assert.equal(attendanceHalqaAfterTermChange('27', [27, 28]), '27');
assert.equal(attendanceHalqaAfterTermChange('99', [27]), ALL_ACTIVE_HALAQAT);
assert.equal(progressHalqaAfterTermChange(27, [27, 28], false), 27);
assert.equal(progressHalqaAfterTermChange(99, [27], false), null);
assert.equal(progressHalqaAfterTermChange(null, [27], true), 27);
assert.equal(attendanceAllLabel(active), 'كل الحلقات النشطة');
assert.equal(attendanceAllLabel(explicit29.term), 'كل حلقات الدورة');

const activeAll = centerWeeklyQueryParams('2026-11-08', null, 40);
assert.equal(activeAll.termId, '40');
assert.equal(activeAll.halqaId, undefined);
assert.equal(activeAll.weekStartDate, '2026-11-08');
const oneHalqa = centerWeeklyQueryParams('2026-11-03', 27, 29);
assert.equal(oneHalqa.halqaId, '27');
assert.equal(oneHalqa.termId, '29');
const legacy = centerWeeklyQueryParams('2026-11-08', null, null);
assert.equal(legacy.termId, undefined);
assert.equal(legacy.halqaId, undefined);
assert.equal(halqaWeeklyQueryParams('2026-11-03', undefined, 29).termId, '29');

const progressScoped = progressReportQueryParams({
  halqaId: 27,
  period: 'day',
  startingDate: '2026-11-05',
  endingDate: '2026-11-05',
  termId: 29,
});
assert.equal(progressScoped.halqaId, '27');
assert.equal(progressScoped.period, 'day');
assert.equal(progressScoped.startingDate, '2026-11-05');
assert.equal(progressScoped.endingDate, '2026-11-05');
assert.equal(progressScoped.termId, '29');
const progressLegacy = progressReportQueryParams({
  halqaId: 27,
  period: 'week',
  startingDate: '2026-11-08',
  endingDate: '2026-11-12',
});
assert.equal(progressLegacy.termId, undefined);

const percentSource = readFileSync(
  join(src, 'app/features/progress-report/enums/progress-plan-item-type.enum.ts'),
  'utf8',
);
assert.match(percentSource, /if \(n > 100\) \{\s*return 100;/);

const progressCsv = buildProgressReportCsv(
  [{
    studentId: 73,
    studentName: 'S1',
    hifzPercent: 100,
    tathPercent: 100,
    murPercent: 25,
    lastUpdatedLabel: '5 نوفمبر 2026',
    lastUpdatedRaw: '2026-11-05',
  }],
  {
    halqaName: 'H1',
    periodLabel: 'يوم',
    rangeLabel: '5 نوفمبر 2026',
    termName: term29.name,
    termStatusLabel: 'مكتملة',
    termStart: '2026-11-03',
    termEnd: '2026-11-07',
  },
);
assert.match(progressCsv, /الدورة ٢٩/);
assert.match(progressCsv, /مكتملة/);
assert.match(progressCsv, /5 نوفمبر 2026/);
assert.match(progressCsv, /100/);
assert.match(progressCsv, /25/);
assert.doesNotMatch(progressCsv, /150/);
assert.doesNotMatch(progressCsv, /الدورة الحالية/);
const oldProgressCsv = buildProgressReportCsv(
  [{
    studentId: 73,
    studentName: 'S1',
    hifzPercent: 100,
    tathPercent: 100,
    murPercent: 25,
    lastUpdatedLabel: '',
    lastUpdatedRaw: null,
  }],
  { halqaName: 'H1', periodLabel: 'أسبوع', rangeLabel: 'الأسبوع' },
);
assert.doesNotMatch(oldProgressCsv, /مكتملة/);

const attendanceCsv = buildAttendanceWeeklyCsv(
  [{ date: '2026-11-03', dayOfWeekEn: 'Tuesday', dowAr: 'الثلاثاء', dayOfMonth: '3', isHoliday: false, holidayHint: null }],
  [{
    trackId: '27-81-0',
    studentId: 81,
    studentName: 'S81',
    halqaId: 27,
    halqaName: 'H1',
    cells: [{ date: '2026-11-03', statusRaw: 'NOT_MARKED', viewKind: 'blank', label: '—', chipClass: null, isHoliday: false }],
  }],
  {
    halqaName: 'كل حلقات الدورة',
    weekLabel: 'الأحد 1 – الخميس 5 نوفمبر 2026',
    termName: term29.name,
    termStatusLabel: 'مكتملة',
    termStart: '2026-11-03',
    termEnd: '2026-11-07',
  },
);
assert.match(attendanceCsv, /الدورة ٢٩/);
assert.match(attendanceCsv, /مكتملة/);
assert.match(attendanceCsv, /كل حلقات الدورة/);
assert.doesNotMatch(attendanceCsv, /603/);

const bareList = readTermList([
  {
    id: 29,
    name: 'SMOKE E2E دورة نوفمبر',
    status: 'COMPLETED',
    startDate: '2026-11-03T00:00:00.000Z',
    endDate: '2026-11-07T00:00:00.000Z',
  },
]);
assert.equal(bareList[0].id, 29);
assert.equal(bareList[0].status, 'COMPLETED');
assert.throws(() => readTermList({ status: 200, data: bareList }), /term array/);

const progressPage = readFileSync(join(src, 'app/features/progress-report/progress-report.ts'), 'utf8');
const attendancePage = readFileSync(join(src, 'app/features/attendance-report/attendance-report.ts'), 'utf8');
const termService = readFileSync(join(src, 'app/features/report-term/report-term.service.ts'), 'utf8');
assert.match(progressPage, /loadProgress\(halqaId, this\.period\(\), this\.dateContext\(\), termId\)/);
assert.match(progressPage, /normalizePercent\(byType\.get\('HIFZ'\)\)/);
assert.match(attendancePage, /loadCenterWeeklyTable\(weekStartDate, halqaValue, termId\)/);
assert.match(attendancePage, /this\.table\.set\(data\)/);
assert.doesNotMatch(attendancePage, /scopeAttendanceTable|includeInactive|getTerm\(/);
assert.doesNotMatch(progressPage, /includeInactive/);
assert.doesNotMatch(termService, /getTerm\(|getActiveTerm\(|centerApi|\/center\//);
const progressApi = readFileSync(join(src, 'app/core/api/progress-api.service.ts'), 'utf8');
const attendanceApi = readFileSync(join(src, 'app/core/api/attendance-api.service.ts'), 'utf8');
assert.doesNotMatch(progressApi, /includeInactive/);
assert.doesNotMatch(attendanceApi, /includeInactive/);
assert.doesNotMatch(progressPage, /603|604|605|606|607/);
assert.doesNotMatch(attendancePage, /603|604|605|606|607/);

console.log('report-term-context-self-check: ok');
