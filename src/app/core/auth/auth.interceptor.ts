import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import { AuthService } from './auth.service';
import { safeRedirectPath } from './redirect.helpers';
import { TokenStorageService } from './token-storage.service';

export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

let refreshInFlight: Observable<void> | null = null;

function isAuthEndpoint(url: string, apiBaseUrl: string): boolean {
  const normalized = url.replace(apiBaseUrl, '');
  return normalized.includes('/auth/login') || normalized.includes('/auth/refresh');
}

function redirectToLogin(router: Router, redirectUrl?: string): void {
  const redirect = redirectUrl ? safeRedirectPath(redirectUrl, '') : '';
  router.navigate(['/login'], {
    queryParams: redirect ? { redirect } : undefined,
  });
}

function refreshOnce(auth: AuthService, tokenStorage: TokenStorageService, router: Router): Observable<void> {
  if (!refreshInFlight) {
    refreshInFlight = auth.refresh().pipe(
      map(() => undefined),
      catchError((error) => {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => error);
      }),
      finalize(() => {
        refreshInFlight = null;
      }),
      shareReplay(1),
    );
  }

  return refreshInFlight;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const apiBaseUrl = inject(API_BASE_URL);

  const accessToken = auth.getAccessToken();
  const authReq =
    accessToken && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const retried = req.context.get(AUTH_RETRY);
      if (retried || isAuthEndpoint(req.url, apiBaseUrl)) {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => error);
      }

      return refreshOnce(auth, tokenStorage, router).pipe(
        switchMap(() => {
          const newToken = auth.getAccessToken();
          if (!newToken) {
            tokenStorage.clearTokens();
            redirectToLogin(router, router.url);
            return throwError(() => error);
          }

          const retryReq = req.clone({
            context: req.context.set(AUTH_RETRY, true),
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retryReq);
        }),
      );
    }),
  );
};
