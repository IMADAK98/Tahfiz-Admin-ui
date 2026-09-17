import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { CreateManualStudentPayload } from './models/student.model';
import { RejectStudentRequestPayload, StudentRequestApiRecord } from './models/student-request.model';

/** Admin student-requests HTTP — list is pending-only per OpenAPI summary. */
@Injectable({ providedIn: 'root' })
export class StudentRequestApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(): Observable<StudentRequestApiRecord[]> {
    return this.http
      .get<ApiEnvelope<StudentRequestApiRecord[]>>(
        `${this.apiBaseUrl}/admin/student-requests`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status) ?? []));
  }

  getById(id: number | string): Observable<StudentRequestApiRecord> {
    return this.http
      .get<ApiEnvelope<StudentRequestApiRecord>>(
        `${this.apiBaseUrl}/admin/student-requests/${id}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * Admin add-student: creates user + profile directly (no pending row).
   * Success often returns `data: null` — caller must re-list active-students.
   */
  createManual(payload: CreateManualStudentPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/admin/student-requests/manual-create`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelopeOrNull(res.body, res.status);
        }),
      );
  }

  /** May return `data: null` on success — caller must re-list. */
  approve(id: number | string): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/admin/student-requests/${id}/approve`,
        {},
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelopeOrNull(res.body, res.status);
        }),
      );
  }

  reject(id: number | string, payload: RejectStudentRequestPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/admin/student-requests/${id}/reject`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelopeOrNull(res.body, res.status);
        }),
      );
  }
}
