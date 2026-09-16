import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import { TokenStorageService } from './token-storage.service';

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'] as const;

let refreshInFlight = false;
const refreshedAccessToken$ = new BehaviorSubject<string | null>(null);

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function withBearer(url: string, req: Parameters<HttpInterceptorFn>[0], token: string | null) {
  if (!token || isAuthEndpoint(url)) {
    return req;
  }

  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function redirectToLogin(router: Router, redirect?: string): void {
  router.navigate(['/login'], {
    queryParams: redirect ? { redirect } : undefined,
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);

  const authedReq = withBearer(req.url, req, tokenStorage.getAccessToken());

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = true;
        refreshedAccessToken$.next(null);

        return authApi.refresh({ refreshToken }).pipe(
          switchMap((tokens) => {
            tokenStorage.setTokens(tokens);
            refreshInFlight = false;
            refreshedAccessToken$.next(tokens.accessToken);
            return next(withBearer(req.url, req, tokens.accessToken));
          }),
          catchError((refreshError) => {
            refreshInFlight = false;
            refreshedAccessToken$.next(null);
            tokenStorage.clearTokens();
            redirectToLogin(router, router.url);
            return throwError(() => refreshError);
          }),
        );
      }

      return refreshedAccessToken$.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => next(withBearer(req.url, req, token))),
      );
    }),
  );
};
