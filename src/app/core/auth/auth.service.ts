import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthApiService } from '../api/auth-api.service';
import {
  RequestPasswordResetBody,
  ResetPasswordBody,
} from '../api/password-reset.model';
import { ApiError } from '../api/api-error';
import { decodeJwtClaims, JwtClaims } from './jwt.helpers';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);

  getAccessToken(): string | null {
    return this.tokenStorage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getClaims(): JwtClaims | null {
    const token = this.getAccessToken();
    return token ? decodeJwtClaims(token) : null;
  }

  clearSession(): void {
    this.tokenStorage.clearTokens();
  }

  login(email: string, password: string): Observable<JwtClaims> {
    return this.authApi.login({ email, password }).pipe(
      tap((tokens) => this.tokenStorage.setTokens(tokens)),
      map(() => {
        const claims = this.getClaims();
        if (!claims) {
          throw new ApiError('Could not decode access token', 200);
        }
        return claims;
      }),
    );
  }

  refresh(): Observable<JwtClaims> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new ApiError('No refresh token', 401));
    }

    return this.authApi.refresh({ refreshToken }).pipe(
      tap((tokens) => this.tokenStorage.setTokens(tokens)),
      map(() => {
        const claims = this.getClaims();
        if (!claims) {
          throw new ApiError('Could not decode access token', 200);
        }
        return claims;
      }),
    );
  }

  logout(): Observable<void> {
    const accessToken = this.getAccessToken();

    if (!accessToken && !this.getRefreshToken()) {
      this.clearSession();
      return of(undefined);
    }

    return this.authApi.logout(accessToken).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    const body: RequestPasswordResetBody = { email: email.trim() };
    return this.authApi.requestPasswordReset(body);
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    const body: ResetPasswordBody = { token, newPassword };
    return this.authApi.resetPassword(body);
  }
}
