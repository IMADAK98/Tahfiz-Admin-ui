import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { SKIP_GLOBAL_ERROR_TOAST } from '../http/skip-global-error-toast.token';
import { apiErrorFromBody } from './api-error';
import { catchHttpAsApiError, envelopeOk, unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  ActivateStudentRequest,
  ActivateStudentResult,
  IdentifiedStudent,
  RegisterTokenValidation,
} from './models/identify.model';

/**
 * Public identify (mock 16) + returning-student activate.
 *
 * API notes (Nest live / discovery):
 * - `GET /register-token/validate/{token}` — public
 * - `GET /users/students/by-identification-number?identification=&passportNumber=` —
 *   OpenAPI lists `access-token`, but reg-link-e2e proved **no auth** works and
 *   returns PII. Prefer calling without requiring adminGuard; handle 401 inline.
 * - `POST /center/activate-student` `{ token, studentId:number }` — OpenAPI JWT;
 *   live probe used ADMIN JWT. TODO: if public 401 persists, Nest must open a
 *   token-scoped public activate or the product must route activate via admin.
 */
@Injectable({ providedIn: 'root' })
export class IdentifyApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

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
   * Lookup existing student by national ID or passport.
   * Pass exactly one query param (the other omitted).
   */
  findByIdentification(opts: {
    identification?: string;
    passportNumber?: string;
  }): Observable<IdentifiedStudent | null> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true);
    let params = new HttpParams();
    if (opts.identification?.trim()) {
      params = params.set('identification', opts.identification.trim());
    }
    if (opts.passportNumber?.trim()) {
      params = params.set('passportNumber', opts.passportNumber.trim());
    }

    return this.http
      .get<ApiEnvelope<IdentifiedStudent | IdentifiedStudent[] | null>>(
        `${this.apiBaseUrl}/users/students/by-identification-number`,
        { observe: 'response', context, params },
      )
      .pipe(
        map((res) => {
          const data = unwrapEnvelopeOrNull(res.body, res.status);
          if (data == null) return null;
          if (Array.isArray(data)) {
            return data[0] ?? null;
          }
          return data;
        }),
      );
  }

  /**
   * Returning student → re-enrollment / activate against token term.
   * studentId MUST be number (Nest rejects string).
   *
   * TODO(Nest): OpenAPI marks access-token; public identify may get 401.
   * Keep this method; do not invent a different path.
   */
  activateStudent(body: ActivateStudentRequest): Observable<ActivateStudentResult | null> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true);
    return this.http
      .post<ApiEnvelope<ActivateStudentResult | null>>(
        `${this.apiBaseUrl}/center/activate-student`,
        body,
        { observe: 'response', context },
      )
      .pipe(
        map((res) => {
          if (!envelopeOk(res.body, res.status)) {
            throw apiErrorFromBody(res.body, res.status);
          }
          return res.body?.data ?? null;
        }),
        catchHttpAsApiError(),
      );
  }
}
