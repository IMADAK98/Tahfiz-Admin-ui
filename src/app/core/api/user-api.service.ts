import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { UserApiRecord } from './models/user.model';

/** GET /users/{id} — full user row for the admin profile page. */
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getById(id: number): Observable<UserApiRecord> {
    return this.http
      .get<ApiEnvelope<UserApiRecord> | UserApiRecord>(`${this.apiBaseUrl}/users/${id}`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapUserRecord(res.body, res.status)));
  }
}

/** Live Nest returns the user row itself. Some callers still wrap `{ status, data }`. */
function unwrapUserRecord(
  body: ApiEnvelope<UserApiRecord> | UserApiRecord | null,
  httpStatus: number,
): UserApiRecord {
  if (body && typeof body === 'object' && 'name' in body && !('data' in body)) {
    return body;
  }
  return unwrapEnvelope(body as ApiEnvelope<UserApiRecord> | null, httpStatus);
}
