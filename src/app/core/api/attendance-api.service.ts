import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
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