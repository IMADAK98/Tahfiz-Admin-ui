import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { ActiveTerm, CreateTermPayload, UpdateTermPayload } from './models/term.model';

@Injectable({ providedIn: 'root' })
export class TermApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  createTerm(payload: CreateTermPayload): Observable<ActiveTerm> {
    return this.http
      .post<ApiEnvelope<ActiveTerm>>(`${this.apiBaseUrl}/term`, payload, { observe: 'response' })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getTermsByCenterId(centerId: number): Observable<ActiveTerm[]> {
    return this.http
      .get<ApiEnvelope<ActiveTerm[]>>(`${this.apiBaseUrl}/term/by-center-id/${centerId}`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  updateTerm(termId: number, payload: UpdateTermPayload): Observable<ActiveTerm> {
    return this.http
      .put<ApiEnvelope<ActiveTerm>>(`${this.apiBaseUrl}/term/${termId}`, payload, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}
