import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { apiErrorFromBody } from './api-error';
import { envelopeOk } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  ReEnrollmentRequest,
  RejectReEnrollmentPayload,
} from './models/re-enrollment.model';

@Injectable({ providedIn: 'root' })
export class ReEnrollmentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listRequests(): Observable<ReEnrollmentRequest[]> {
    return this.http
      .get<ApiEnvelope<ReEnrollmentRequest[]>>(
        `${this.apiBaseUrl}/admin/re-enrollment-requests`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => this.unwrapList(res.body, res.status)));
  }

  getRequest(id: number): Observable<ReEnrollmentRequest> {
    return this.http
      .get<ApiEnvelope<ReEnrollmentRequest>>(
        `${this.apiBaseUrl}/admin/re-enrollment-requests/${id}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => this.unwrapItem(res.body, res.status)));
  }

  approveRequest(id: number): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/admin/re-enrollment-requests/${id}/approve`,
        {},
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => this.unwrapMutation(res.body, res.status)));
  }

  rejectRequest(id: number, payload: RejectReEnrollmentPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/admin/re-enrollment-requests/${id}/reject`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => this.unwrapMutation(res.body, res.status)));
  }

  private unwrapList(body: ApiEnvelope<ReEnrollmentRequest[]> | null, httpStatus: number): ReEnrollmentRequest[] {
    if (!body || !envelopeOk(body, httpStatus)) {
      throw apiErrorFromBody(body, httpStatus);
    }
    return body.data ?? [];
  }

  private unwrapItem(body: ApiEnvelope<ReEnrollmentRequest> | null, httpStatus: number): ReEnrollmentRequest {
    if (!body || !envelopeOk(body, httpStatus)) {
      throw apiErrorFromBody(body, httpStatus);
    }
    if (!body.data) {
      throw apiErrorFromBody(body, httpStatus);
    }
    return body.data;
  }

  /** Approve/reject may return `data: null` on success — trust envelope status only. */
  private unwrapMutation(body: ApiEnvelope<null> | null, httpStatus: number): void {
    if (!body || !envelopeOk(body, httpStatus)) {
      throw apiErrorFromBody(body, httpStatus);
    }
  }
}
