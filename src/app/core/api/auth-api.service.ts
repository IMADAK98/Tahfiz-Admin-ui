import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { bearerHeaders } from './http-auth.helpers';
import { apiErrorFromBody } from './api-error';
import { catchHttpAsApiError, envelopeOk, mapEnvelopeResponse, unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { AuthTokens, LoginRequest, RefreshRequest } from './models/auth.model';
import { RequestPasswordResetBody, ResetPasswordBody } from './password-reset.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http
      .post<ApiEnvelope<AuthTokens>>(
        `${this.apiBaseUrl}/auth/login`,
        request,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map(mapEnvelopeResponse), catchHttpAsApiError());
  }

  refresh(request: RefreshRequest): Observable<AuthTokens> {
    return this.http
      .post<ApiEnvelope<AuthTokens>>(`${this.apiBaseUrl}/auth/refresh`, request, { observe: 'response' })
      .pipe(map(mapEnvelopeResponse));
  }

  logout(accessToken: string | null): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(`${this.apiBaseUrl}/auth/logout`, {}, {
        observe: 'response',
        headers: bearerHeaders(accessToken),
      })
      .pipe(map(() => undefined));
  }

  getProfile(): Observable<unknown> {
    return this.http
      .get<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/profile`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /** Web: email a reset link (enumeration-safe 200). */
  requestPasswordReset(body: RequestPasswordResetBody): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/auth/request-password-reset`,
        body,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          if (!envelopeOk(res.body, res.status)) {
            throw apiErrorFromBody(res.body, res.status);
          }
          return undefined;
        }),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse) {
            return throwError(() => apiErrorFromBody(err.error, err.status));
          }
          return throwError(() => err);
        }),
      );
  }

  /** Web: consume email token + set new password. */
  resetPassword(body: ResetPasswordBody): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/auth/reset-password`,
        body,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          if (!envelopeOk(res.body, res.status)) {
            throw apiErrorFromBody(res.body, res.status);
          }
          return undefined;
        }),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse) {
            return throwError(() => apiErrorFromBody(err.error, err.status));
          }
          return throwError(() => err);
        }),
      );
  }
}
