import { parseLocalIsoDate, toLocalIsoDate } from '../../core/utils/local-date';
import { ALL_ACTIVE_HALAQAT, ALL_ACTIVE_HALAQAT_LABEL } from '../attendance-report/dto/attendance-report-filters.dto';
import {
  REPORT_TERM_NO_FALLBACK,
} from './dto/report-term.dto';
import type {
  ReportTermCatalog,
  ReportTermQuery,
  ReportTermRef,
  ReportTermSelection,
} from './dto/report-term.dto';
import { isCompletedTerm, reportTermHeading, reportTermStatusLabel } from './enums/report-term-status-label';

export type ProgressPeriodContext = 'day' | 'week' | 'month';

const MONTH_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** «كل حلقات الدورة» on a completed term. Active terms keep «كل الحلقات النشطة». */
export const COMPLETED_TERM_HALAQAT_LABEL = 'كل حلقات الدورة';

export function parseReportTermQuery(raw: string | null | undefined): ReportTermQuery {
  if (raw == null || raw.trim() === '') {
    return { kind: 'absent' };
  }
  if (!/^\d+$/.test(raw.trim())) {
    return { kind: 'invalid' };
  }
  const termId = Number(raw.trim());
  if (!Number.isSafeInteger(termId) || termId <= 0) {
    return { kind: 'invalid' };
  }
  return { kind: 'explicit', termId };
}

export function resolveReportTerm(query: ReportTermQuery, catalog: ReportTermCatalog): ReportTermSelection {
  if (query.kind === 'invalid') {
    return { state: 'explicit-invalid' };
  }
  if (catalog.terms == null) {
    return query.kind === 'explicit'
      ? { state: 'explicit-unresolved', termId: query.termId }
      : { state: 'list-failed' };
  }
  if (query.kind === 'explicit') {
    const fromList = catalog.terms.find((term) => term.id === query.termId) ?? null;
    if (fromList) {
      return { state: 'selected', term: fromList, explicit: true };
    }
    return { state: 'explicit-missing', termId: query.termId };
  }
  const fromList = catalog.terms.find((term) => term.status === 'ACTIVE') ?? null;
  if (fromList) {
    return { state: 'selected', term: fromList, explicit: false };
  }
  return { state: 'no-active' };
}

export function selectedTerm(selection: ReportTermSelection): ReportTermRef | null {
  return selection.state === 'selected' ? selection.term : null;
}

/** An explicit term id stays put. Failure never substitutes the active term. */
export function termIdAfterFailure(selection: ReportTermSelection): number | null {
  if (selection.state === 'selected') {
    return selection.term.id;
  }
  if (selection.state === 'explicit-missing' || selection.state === 'explicit-unresolved') {
    return selection.termId;
  }
  return null;
}

export function reportTermBlockedReason(
  selection: ReportTermSelection,
  listError?: string | null,
): string | null {
  const detail = listError ? `${listError} ` : '';
  switch (selection.state) {
    case 'explicit-invalid':
      return `معرّف الدورة في الرابط غير صالح. ${REPORT_TERM_NO_FALLBACK}`;
    case 'explicit-missing':
      return `الدورة المحددة غير موجودة في هذا المركز. ${REPORT_TERM_NO_FALLBACK}`;
    case 'explicit-unresolved':
      return `${detail}تعذر تحميل قائمة الدورات. الرابط يبقى على الدورة ${selection.termId} دون حالة معروفة. أعد المحاولة. ${REPORT_TERM_NO_FALLBACK}`;
    case 'list-failed':
      return `${detail}تعذر تحميل قائمة الدورات. أعد المحاولة. ${REPORT_TERM_NO_FALLBACK}`;
    case 'no-active':
      return 'لا توجد دورة نشطة. يمكن اختيار دورة مكتملة من القائمة.';
    case 'selected':
      return null;
  }
}

export function explicitTermFailureMessage(selection: ReportTermSelection, detail: string): string {
  if (selection.state === 'no-active') {
    return detail;
  }
  return `${detail} ${REPORT_TERM_NO_FALLBACK}`;
}

export function attendanceAllLabel(term: ReportTermRef | null): string {
  return isCompletedTerm(term?.status) ? COMPLETED_TERM_HALAQAT_LABEL : ALL_ACTIVE_HALAQAT_LABEL;
}

export function pickerTerms(catalog: ReportTermCatalog): ReportTermRef[] {
  return [...(catalog.terms ?? [])];
}

export function progressDateForTerm(
  period: ProgressPeriodContext,
  dateContext: string,
  term: ReportTermRef,
): string {
  if (period === 'day') {
    return isoInRange(dateContext, term.startDate, term.endDate) ? dateContext : term.startDate;
  }
  if (period === 'week') {
    const weekEnd = addIsoDays(dateContext, 4);
    if (rangesOverlap(dateContext, weekEnd, term.startDate, term.endDate)) {
      return dateContext;
    }
    return sundayOnOrBefore(term.startDate);
  }
  const month = monthBounds(dateContext);
  if (month && rangesOverlap(month.start, month.end, term.startDate, term.endDate)) {
    return dateContext;
  }
  return term.startDate.slice(0, 7);
}

export function attendanceWeekForTerm(weekStart: string, term: ReportTermRef): string {
  return progressDateForTerm('week', weekStart, term);
}

export function progressHalqaAfterTermChange(
  previous: number | null,
  optionIds: readonly number[],
  pickFirst: boolean,
): number | null {
  if (previous != null && optionIds.includes(previous)) {
    return previous;
  }
  if (pickFirst) {
    return optionIds[0] ?? null;
  }
  return null;
}

/** «كل الحلقات» stays the default. A ḥalaqa from another term does not stick, and is not replaced by a different id. */
export function attendanceHalqaAfterTermChange(previous: string, optionIds: readonly number[]): string {
  if (previous === ALL_ACTIVE_HALAQAT) {
    return ALL_ACTIVE_HALAQAT;
  }
  const id = Number(previous);
  if (Number.isInteger(id) && optionIds.includes(id)) {
    return previous;
  }
  return ALL_ACTIVE_HALAQAT;
}

export function formatTermBoundsAr(term: ReportTermRef): string {
  return `${formatIsoAr(term.startDate)} – ${formatIsoAr(term.endDate)}`;
}

export function termHeading(term: ReportTermRef | null): string | null {
  if (!term) {
    return null;
  }
  return reportTermHeading(term.name, term.status);
}

export function termStatusLabel(term: ReportTermRef | null): string | null {
  if (!term) {
    return null;
  }
  return reportTermStatusLabel(term.status);
}

function isoInRange(iso: string, start: string, end: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= start && iso <= end;
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function addIsoDays(iso: string, days: number): string {
  const date = parseLocalIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

function sundayOnOrBefore(iso: string): string {
  const date = parseLocalIsoDate(iso);
  date.setDate(date.getDate() - date.getDay());
  return toLocalIsoDate(date);
}

function monthBounds(yearMonth: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }
  const end = new Date(year, month, 0);
  return { start: `${match[1]}-${match[2]}-01`, end: toLocalIsoDate(end) };
}

function formatIsoAr(iso: string): string {
  const date = parseLocalIsoDate(iso);
  return `${date.getDate()} ${MONTH_AR[date.getMonth()]} ${date.getFullYear()}`;
}
