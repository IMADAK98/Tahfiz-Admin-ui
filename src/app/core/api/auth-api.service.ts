import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { bearerHeaders } from './http-auth.helpers';
import { mapEnvelopeResponse } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { AuthTokens, LoginRequest, RefreshRequest } from './models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http
      .post<ApiEnvelope<AuthTokens>>(`${this.apiBaseUrl}/auth/login`, request, { observe: 'response' })
      .pipe(map(mapEnvelopeResponse));
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
}
