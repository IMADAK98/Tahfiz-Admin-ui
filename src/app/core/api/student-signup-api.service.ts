import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { SKIP_GLOBAL_ERROR_TOAST } from '../http/skip-global-error-toast.token';
import { apiErrorFromBody } from './api-error';
import { catchHttpAsApiError, envelopeOk, unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  CreatePendingStudentRequest,
  PendingStudentRequestResult,
  RegisterTokenValidation,
} from './models/student-signup.model';

/**
 * Public student signup + shared register-token validate.
 * Nest: `POST /pending-student-request`, `GET /register-token/validate/{token}`.
 */
@Injectable({ providedIn: 'root' })
export class StudentSignupApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** Public — no JWT. Soft-fail invalid tokens at the call site. */
  validateRegisterToken(token: string): Observable<RegisterTokenValidation> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true);
    return this.http
      .get<ApiEnvelope<RegisterTokenValidation>>(
        `${this.apiBaseUrl}/register-token/validate/${encodeURIComponent(token)}`,
        { observe: 'response', context },
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * Public pending student intake (creates PENDING row for admin queue).
   * Success often `data: null` — treat void success via envelopeOk.
   */
  submitPendingStudentRequest(
    body: CreatePendingStudentRequest,
  ): Observable<PendingStudentRequestResult | null> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true);
    return this.http
      .post<ApiEnvelope<PendingStudentRequestResult | null>>(
        `${this.apiBaseUrl}/pending-student-request`,
        body,
        { observe: 'response', context },
      )
      .pipe(
        map((res) => {
          if (!envelopeOk(res.body, res.status)) {
            throw apiErrorFromBody(res.body, res.status);
          }
          // data may be null — caller shows success toast / panel
          return res.body?.data ?? null;
        }),
        catchHttpAsApiError(),
      );
  }
}
