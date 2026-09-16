import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiErrorFromBody } from '../../core/api/api-error';
import { envelopeOk } from '../../core/api/envelope.helpers';
import { ApiEnvelope } from '../../core/api/models/api-envelope.model';
import { PendingCenterRequest } from '../../core/api/models/pending-center.model';
import { API_BASE_URL } from '../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class CenterSignupService {
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
