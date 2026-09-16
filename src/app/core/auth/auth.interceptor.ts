import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { safeRedirectPath } from './redirect.helpers';
import { TokenStorageService } from './token-storage.service';

export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

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

function redirectToLogin(router: Router, redirectUrl?: string): void {
  const redirect = redirectUrl ? safeRedirectPath(redirectUrl, '') : '';
  router.navigate(['/login'], {
    queryParams: redirect ? { redirect } : undefined,
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const authedReq = withBearer(req.url, req, auth.getAccessToken());

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (req.context.get(AUTH_RETRY) || isAuthEndpoint(req.url)) {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => error);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = true;
        refreshedAccessToken$.next(null);

        return auth.refresh().pipe(
          switchMap(() => {
            const token = auth.getAccessToken();
            if (!token) {
              return throwError(() => error);
            }

            refreshInFlight = false;
            refreshedAccessToken$.next(token);
            const retryReq = req.clone({
              context: req.context.set(AUTH_RETRY, true),
            });
            return next(withBearer(req.url, retryReq, token));
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
        switchMap((token) => {
          const retryReq = req.clone({
            context: req.context.set(AUTH_RETRY, true),
          });
          return next(withBearer(req.url, retryReq, token));
        }),
      );
    }),
  );
};
