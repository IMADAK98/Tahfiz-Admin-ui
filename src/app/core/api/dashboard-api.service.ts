import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { DashboardHalaqaPerformanceRow } from './models/term-dashboard.model';

/** A missing or non-numeric rate stays «no data» instead of turning into 0 or NaN. */
function rate(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function toHalaqaPerformanceRow(
  row: DashboardHalaqaPerformanceRow,
): DashboardHalaqaPerformanceRow {
  return {
    halaqaId: row.halaqaId,
    name: row.name,
    teacherName: row.teacherName ?? '',
    studentCount: row.studentCount ?? 0,
    attendance: {
      present: row.attendance?.present ?? 0,
      late: row.attendance?.late ?? 0,
      absent: row.attendance?.absent ?? 0,
      leave: row.attendance?.leave ?? 0,
    },
    attendanceRate: rate(row.attendanceRate),
    typeAverages: {
      HIFZ: rate(row.typeAverages?.HIFZ),
      TATHBEET: rate(row.typeAverages?.TATHBEET),
      MURAJAA: rate(row.typeAverages?.MURAJAA),
    },
    coverage: rate(row.coverage),
    score: rate(row.score),
    rank: row.rank,
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * GET /dashboard/term/:termId/halqa-performance (ADMIN / SYSTEM_ADMIN). Rows come ranked worst
   * first. 404 TERM_NOT_FOUND reaches the caller as ApiError (httpErrorToApiInterceptor); the
   * dashboard shows it inline, so no global toast.
   */
  getHalqaPerformance(termId: number): Observable<DashboardHalaqaPerformanceRow[]> {
    return this.http
      .get<ApiEnvelope<DashboardHalaqaPerformanceRow[]>>(
        `${this.apiBaseUrl}/dashboard/term/${termId}/halqa-performance`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const rows = unwrapEnvelope(res.body, res.status);
          if (!Array.isArray(rows)) {
            throw new Error('Unexpected halqa-performance payload');
          }
          return rows.map(toHalaqaPerformanceRow);
        }),
      );
  }
}
