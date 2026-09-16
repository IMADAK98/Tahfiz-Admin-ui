import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiErrorFromBody } from './api-error';
import { API_BASE_URL } from '../config/api-config';
import { envelopeOk } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { PendingCenterRequest } from './models/pending-center.model';

@Injectable({ providedIn: 'root' })
export class SignupApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  submitPendingCenterRequest(request: PendingCenterRequest): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(`${this.apiBaseUrl}/pending-center-request`, request, {
        observe: 'response',
      })
      .pipe(
        map((res) => {
          if (!envelopeOk(res.body, res.status)) {
            throw apiErrorFromBody(res.body, res.status);
          }
        }),
      );
  }
}
