import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { CenterRequestApiRecord, RejectCenterRequestPayload } from './models/center-request.model';

/** SYSTEM_ADMIN center-requests HTTP — Nest findAll() returns all statuses. */
@Injectable({ providedIn: 'root' })
export class CenterRequestApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(): Observable<CenterRequestApiRecord[]> {
    return this.http
      .get<ApiEnvelope<CenterRequestApiRecord[]>>(
        `${this.apiBaseUrl}/system-admin/center-requests`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const body = res.body;
          // ponytail: legacy Nest handler returned a bare array — accept until all envs use envelope
          if (Array.isArray(body)) {
            return body;
          }
          const data = unwrapEnvelopeOrNull(body, res.status);
          return Array.isArray(data) ? data : [];
        }),
      );
  }

  /** May return `data: null` on success — caller must re-list. */
  approve(id: number | string): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/system-admin/center-requests/${id}/approve`,
        {},
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelopeOrNull(res.body, res.status);
        }),
      );
  }

  reject(id: number | string, payload: RejectCenterRequestPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/system-admin/center-requests/${id}/reject`,
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
