import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  HalqaByTermItem,
  ProgressReportQuery,
  ProgressReportResponse,
} from './models/progress.model';

/**
 * Admin progress report reads — Nest Reports + Halqa tags.
 * Writes stay on teacher mobile (student-daily-progress).
 */
@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * GET /reports/progress?halqaId=&period=day|week|month&startingDate=&endingDate=
   * Period must be lowercase (API-SCREEN-MAP live gap).
   */
  getProgressReport(query: ProgressReportQuery): Observable<ProgressReportResponse> {
    const params = new HttpParams()
      .set('halqaId', String(query.halqaId))
      .set('period', query.period)
      .set('startingDate', query.startingDate)
      .set('endingDate', query.endingDate);
    return this.http
      .get<ApiEnvelope<ProgressReportResponse>>(
        `${this.apiBaseUrl}/reports/progress`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /** Ḥalaqa dropdown; live empty array when term has none. */
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
      );
  }
}