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
   * Omit `halqaId` for every ḥalaqa in the requested scope, not one forced ḥalaqa.
   * Report pages send the selected termId with that omission.
   * Omitting termId remains the legacy caller path. This client does not drop rows.
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