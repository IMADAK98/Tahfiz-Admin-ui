import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { safeRedirectPath } from './redirect.helpers';
import { TokenStorageService } from './token-storage.service';

export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'] as const;

let refreshInFlight$: Observable<string> | null = null;

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

function refreshAccessToken(auth: AuthService, tokenStorage: TokenStorageService, router: Router): Observable<string> {
  if (!refreshInFlight$) {
    refreshInFlight$ = auth.refresh().pipe(
      map(() => {
        const token = auth.getAccessToken();
        if (!token) {
          throw new Error('No access token after refresh');
        }
        return token;
      }),
      catchError((refreshError) => {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => refreshError);
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay(1),
    );
  }

  return refreshInFlight$;
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

      if (!auth.getRefreshToken()) {
        tokenStorage.clearTokens();
        redirectToLogin(router, router.url);
        return throwError(() => error);
      }

      return refreshAccessToken(auth, tokenStorage, router).pipe(
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
