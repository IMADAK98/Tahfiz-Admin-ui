import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { isNoHalqasForTermError } from './error-message.helpers';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { CreateHalqaPayload, HalqaApiRecord } from './models/halqa.model';

/** Center-admin halqa HTTP — list by term/center; create/update. No by-teacher-id (TEACHER/mobile). */
@Injectable({ providedIn: 'root' })
export class HalqaApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getByTerm(termId: number): Observable<HalqaApiRecord[]> {
    return this.http
      .get<ApiEnvelope<HalqaApiRecord[]>>(`${this.apiBaseUrl}/halqa/by-term/${termId}`, {
        observe: 'response',
      })
      .pipe(
        map((res) => unwrapEnvelope(res.body, res.status)),
        catchError((error: unknown) =>
          isNoHalqasForTermError(error) ? of([]) : throwError(() => error),
        ),
      );
  }

  getByCenterId(centerId: number): Observable<HalqaApiRecord[]> {
    const params = new HttpParams().set('centerId', String(centerId));
    return this.http
      .get<ApiEnvelope<HalqaApiRecord[]>>(`${this.apiBaseUrl}/halqa`, {
        observe: 'response',
        params,
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  createHalqa(payload: CreateHalqaPayload): Observable<HalqaApiRecord> {
    return this.http
      .post<ApiEnvelope<HalqaApiRecord>>(
        `${this.apiBaseUrl}/halqa`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}
