import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope } from './envelope.helpers';
import { isNoHalqasForTermError } from './error-message.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  HalqaByTermItem,
  ProgressReportQuery,
  ProgressReportResponse,
} from './models/progress.model';
import { progressReportQueryParams } from './progress-report-query';

/**
 * Admin progress report reads — Nest Reports + Halqa tags.
 * Writes stay on teacher mobile (student-daily-progress).
 */
@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * GET /reports/progress?halqaId=&period=&startingDate=&endingDate=&termId?
   * Period must be lowercase. `termId` is omitted when the caller does not pass one.
   */
  getProgressReport(query: ProgressReportQuery): Observable<ProgressReportResponse> {
    const params = new HttpParams({ fromObject: progressReportQueryParams(query) });
    return this.http
      .get<ApiEnvelope<ProgressReportResponse>>(
        `${this.apiBaseUrl}/reports/progress`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * Ḥalaqas of one term. Nest includes inactive rows only when that term is COMPLETED.
   * This request adds no membership query.
   */
  getHalqasByTerm(termId: number): Observable<HalqaByTermItem[]> {
    return this.http
      .get<ApiEnvelope<HalqaByTermItem[]>>(
        `${this.apiBaseUrl}/halqa/by-term/${encodeURIComponent(String(termId))}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const data = unwrapEnvelope(res.body, res.status);
          return Array.isArray(data) ? data : [];
        }),
        catchError((error: unknown) =>
          isNoHalqasForTermError(error) ? of([]) : throwError(() => error),
        ),
      );
  }
}