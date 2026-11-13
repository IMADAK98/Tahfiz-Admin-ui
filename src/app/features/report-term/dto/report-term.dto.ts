import type { ActiveTerm, TermStatus } from '../../../core/api/models/term.model';
import { sliceIsoDate } from '../../terms/dto/edit-term-validation';

/** Page query key. Matches the Nest report param name from Tahfiz PR 43. */
export const REPORT_TERM_QUERY_PARAM = 'termId';

export const REPORT_TERM_NO_FALLBACK = 'لم يتم الرجوع إلى دورة أخرى.';

export interface ReportTermRef {
  id: number;
  name: string;
  status: TermStatus;
  startDate: string;
  endDate: string;
}

export type ReportTermQuery =
  | { kind: 'absent' }
  | { kind: 'explicit'; termId: number }
  | { kind: 'invalid' };

export interface ReportTermCatalog {
  /** Null when GET /term failed. */
  terms: ReportTermRef[] | null;
  listErrorMessage: string | null;
}

export type ReportTermSelection =
  | { state: 'selected'; term: ReportTermRef; explicit: boolean }
  | { state: 'explicit-missing'; termId: number }
  | { state: 'explicit-invalid' }
  | { state: 'explicit-unresolved'; termId: number }
  | { state: 'list-failed' }
  | { state: 'no-active' };

/** Map a confirmed term payload. Rows without id, name, status, or dates are dropped. */
export function toReportTermRef(raw: Partial<ActiveTerm> | null | undefined): ReportTermRef | null {
  if (!raw) {
    return null;
  }
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id);
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const status = raw.status;
  const startDate = sliceIsoDate(raw.startDate);
  const endDate = sliceIsoDate(raw.endDate);
  if (!Number.isInteger(id) || id <= 0 || !name || !startDate || !endDate) {
    return null;
  }
  if (status !== 'ACTIVE' && status !== 'INACTIVE' && status !== 'COMPLETED') {
    return null;
  }
  return { id, name, status, startDate, endDate };
}
