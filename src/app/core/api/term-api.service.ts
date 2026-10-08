import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { apiErrorFromBody } from './api-error';
import { envelopeOk, unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { ActiveTerm, CreateTermPayload, UpdateTermPayload } from './models/term.model';
import { readTermEditConflict, TermEditConflictError } from './term-edit-conflict';

@Injectable({ providedIn: 'root' })
export class TermApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  createTerm(payload: CreateTermPayload): Observable<ActiveTerm> {
    return this.http
      .post<ApiEnvelope<ActiveTerm>>(
        `${this.apiBaseUrl}/term`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * PUT /term/:id. Skips the global error toast: 409 stays in the dialog
   * banner, other 4xx become ApiError for the same inline banner as create.
   */
  updateTerm(termId: number, payload: UpdateTermPayload): Observable<ActiveTerm> {
    return this.http
      .put<ApiEnvelope<ActiveTerm>>(
        `${this.apiBaseUrl}/term/${termId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const conflict = readTermEditConflict({ status: res.status, error: res.body });
          if (conflict) {
            throw new TermEditConflictError(conflict.affectedDates);
          }
          return unwrapEnvelope(res.body, res.status);
        }),
        catchError((err: unknown) => {
          if (err instanceof TermEditConflictError) {
            return throwError(() => err);
          }
          if (err instanceof HttpErrorResponse) {
            const conflict = readTermEditConflict(err);
            if (conflict) {
              return throwError(() => new TermEditConflictError(conflict.affectedDates));
            }
            return throwError(() => apiErrorFromBody(err.error, err.status));
          }
          return throwError(() => err);
        }),
      );
  }

  getTermsByCenterId(centerId: number): Observable<ActiveTerm[]> {
    return this.http
      .get<ApiEnvelope<ActiveTerm[]>>(`${this.apiBaseUrl}/term/by-center-id/${centerId}`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * POST /term/{id}/end — no body. Success is the HTTP envelope, not `data`
   * (completed term or null). 4xx stays on the global error toast.
   */
  endTerm(termId: number): Observable<void> {
    return this.http
      .post<ApiEnvelope<ActiveTerm | null> | null>(`${this.apiBaseUrl}/term/${termId}/end`, null, {
        observe: 'response',
      })
      .pipe(
        map((res) => {
          if (res.body && !envelopeOk(res.body, res.status)) {
            throw apiErrorFromBody(res.body, res.status);
          }
        }),
      );
  }
}
