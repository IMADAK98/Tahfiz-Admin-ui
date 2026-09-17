import { Injectable } from '@angular/core';
import { AuthTokens } from '../api/models/auth.model';

const ACCESS_TOKEN_KEY = 'tahfiz_access_token';
const REFRESH_TOKEN_KEY = 'tahfiz_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: AuthTokens, persist = this.isPersisted()): void {
    this.clearTokens();
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  isPersisted(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  clearTokens(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
