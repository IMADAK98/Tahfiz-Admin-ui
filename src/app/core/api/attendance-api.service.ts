import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import {
  CENTER_WEEKLY_TABLE_PATH,
  centerWeeklyQueryParams,
  halqaWeeklyQueryParams,
} from './attendance-weekly-query';
import { halqaByTermParams } from './halqa-by-term-query';
import { unwrapEnvelope } from './envelope.helpers';
import { isNoHalqasForTermError } from './error-message.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { HalqaByTermItem, WeeklyAttendanceTable } from './models/attendance.model';

/**
 * Admin attendance reads — Nest Attendance + Halqa tags.
 * Writes (POST/PUT /attendance/bulk) stay on teacher mobile.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * Primary weekly day×student grid.
   * @param weekStartDate Sunday YYYY-MM-DD (Saudi Sun–Thu)
   */
  getWeeklyTable(
    halqaId: number | string,
    weekStartDate: string,
    studentId?: number,
    termId?: number | null,
  ): Observable<WeeklyAttendanceTable> {
    const params = new HttpParams({
      fromObject: halqaWeeklyQueryParams(weekStartDate, studentId, termId),
    });
    return this.http
      .get<ApiEnvelope<WeeklyAttendanceTable>>(
        `${this.apiBaseUrl}/attendance/halqa/${encodeURIComponent(String(halqaId))}/weekly-table`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * Center-wide Sun–Thu grid.
   * Omit `halqaId` → every ḥalaqa in the requested scope, not one forced ḥalaqa.
   * Omit `termId` → legacy active roster (any active ḥalaqa, including non-active terms).
   * Report pages pass the selected term and still omit `halqaId` for «كل الحلقات النشطة».
   */
  getCenterWeeklyTable(
    weekStartDate: string,
    halqaId?: number | null,
    termId?: number | null,
  ): Observable<unknown> {
    const params = new HttpParams({
      fromObject: centerWeeklyQueryParams(weekStartDate, halqaId, termId),
    });
    return this.http
      .get<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}${CENTER_WEEKLY_TABLE_PATH}`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /** Active ḥalaqāt in the caller center. `GET /halqa/dropdown`. */
  getHalqaDropdown(): Observable<unknown> {
    return this.http
      .get<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/halqa/dropdown`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * Ḥalaqas of one term. `includeInactive` true sends `includeInactive=true`.
   * Otherwise the param is omitted and Nest keeps the active-only list.
   */
  getHalqasByTerm(termId: number, includeInactive = false): Observable<HalqaByTermItem[]> {
    const params = new HttpParams({ fromObject: halqaByTermParams(includeInactive) });
    return this.http
      .get<ApiEnvelope<HalqaByTermItem[]>>(
        `${this.apiBaseUrl}/halqa/by-term/${encodeURIComponent(String(termId))}`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
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