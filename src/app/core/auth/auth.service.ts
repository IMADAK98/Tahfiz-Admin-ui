import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';

const ACCESS_TOKEN_KEY = 'tahfiz_access_token';
const REFRESH_TOKEN_KEY = 'tahfiz_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /** Stub — full login flow lands in PR3. */
  login(_email: string, _password: string): Observable<boolean> {
    return of(false);
  }

  logout(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /** Reserved for PR3 interceptor refresh queue. */
  protected get refreshUrl(): string {
    return `${this.apiBaseUrl}/auth/refresh`;
  }
}
