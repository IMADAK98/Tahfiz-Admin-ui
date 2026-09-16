import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { RejectTeacherRequestPayload, TeacherRequestApiRecord } from './models/teacher-request.model';

/** Admin teacher-requests HTTP — list is already pending-only per OpenAPI summary. */
@Injectable({ providedIn: 'root' })
export class TeacherRequestApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(): Observable<TeacherRequestApiRecord[]> {
    return this.http
      .get<ApiEnvelope<TeacherRequestApiRecord[]>>(
        `${this.apiBaseUrl}/admin/teacher-requests`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status) ?? []));
  }

  /** May return `data: null` on success — caller must re-list to learn the new teacher's id. */
  approve(id: number | string): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/admin/teacher-requests/${id}/approve`,
        {},
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelope(res.body, res.status);
        }),
      );
  }

  reject(id: number | string, payload: RejectTeacherRequestPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/admin/teacher-requests/${id}/reject`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelope(res.body, res.status);
        }),
      );
  }
}
