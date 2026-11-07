import { optionalPositiveIntParam } from './attendance-weekly-query';
import type { ProgressReportQuery } from './models/progress.model';

/**
 * `GET /reports/progress?halqaId=&period=&startingDate=&endingDate=&termId?`
 * `halqaId` stays required. `termId` is sent for a selected term and omitted for legacy callers.
 * Explicit dates are still sent; Nest lets those dates win over `period`.
 */
export function progressReportQueryParams(query: ProgressReportQuery): Record<string, string> {
  const params: Record<string, string> = {
    halqaId: String(query.halqaId),
    period: query.period,
    startingDate: query.startingDate,
    endingDate: query.endingDate,
  };
  const termParam = optionalPositiveIntParam(query.termId);
  if (termParam) {
    params['termId'] = termParam;
  }
  return params;
}
