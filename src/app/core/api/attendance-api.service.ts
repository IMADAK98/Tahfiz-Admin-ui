import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { CENTER_WEEKLY_TABLE_PATH, centerWeeklyHalqaIdParam } from './attendance-weekly-query';
import { unwrapEnvelope } from './envelope.helpers';
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
  ): Observable<WeeklyAttendanceTable> {
    let params = new HttpParams().set('weekStartDate', weekStartDate);
    if (studentId !== undefined) {
      params = params.set('studentId', String(studentId));
    }
    return this.http
      .get<ApiEnvelope<WeeklyAttendanceTable>>(
        `${this.apiBaseUrl}/attendance/halqa/${encodeURIComponent(String(halqaId))}/weekly-table`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * Center-wide Sun–Thu grid (Nest build B).
   * Omit `halqaId` → all active ḥalaqāt in the caller center.
   * The path lives in `CENTER_WEEKLY_TABLE_PATH`.
   */
  getCenterWeeklyTable(weekStartDate: string, halqaId?: number | null): Observable<unknown> {
    let params = new HttpParams().set('weekStartDate', weekStartDate);
    const halqaParam = centerWeeklyHalqaIdParam(halqaId);
    if (halqaParam) {
      params = params.set('halqaId', halqaParam);
    }
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