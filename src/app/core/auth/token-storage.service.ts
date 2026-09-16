import { Injectable } from '@angular/core';
import { AuthTokens } from '../api/models/auth.model';

const ACCESS_TOKEN_KEY = 'tahfiz_access_token';
const REFRESH_TOKEN_KEY = 'tahfiz_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: AuthTokens): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clearTokens(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
