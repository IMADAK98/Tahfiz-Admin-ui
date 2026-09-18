import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import {
  extractHttpErrorMessage,
  hasNestFieldErrors,
  isAbortedRequest,
  resolveErrorStatus,
  urlPathWithoutQuery,
} from '../api/error-message.helpers';
import { AuthService } from '../auth/auth.service';
import {
  AUTH_RETRY,
  isAuthEndpoint,
  isAuthRefreshInProgress,
} from '../auth/auth.interceptor';
import { ToastErrorService } from '../toast/toast-error.service';
import { SKIP_GLOBAL_ERROR_TOAST } from './skip-global-error-toast.token';

export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  // ponytail: resolve toast lazily. Constructing ToastErrorService on every
  // request cycles TranslateService → HttpClient (NG0200) and login POST never fires.
  const injector = inject(Injector);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (req.context.get(SKIP_GLOBAL_ERROR_TOAST)) {
        return throwError(() => error);
      }

      if (isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      if (isAbortedRequest(error)) {
        return throwError(() => error);
      }

      // Field errors belong under inputs (center-signup POC). Skip toast so
      // Nest `errors[]` is not also dumped as a generic failure banner.
      if (hasNestFieldErrors(error)) {
        return throwError(() => error);
      }

      const httpStatus = error.status;
      const status = resolveErrorStatus(error);
      const urlPath = urlPathWithoutQuery(req.url);
      const serverMessage = extractHttpErrorMessage(error);

      if (httpStatus === 401) {
        const isFinal401 = req.context.get(AUTH_RETRY) || !auth.getRefreshToken();

        if (!isFinal401 && (auth.getRefreshToken() || isAuthRefreshInProgress())) {
          return throwError(() => error);
        }

        injector.get(ToastErrorService).notifyFailure({
          method: req.method,
          urlPath,
          httpStatus,
          status,
          isSessionExpired: true,
        });
        return throwError(() => error);
      }

      injector.get(ToastErrorService).notifyFailure({
        method: req.method,
        urlPath,
        httpStatus,
        status,
        serverMessage,
        isNetworkError: httpStatus === 0,
      });

      return throwError(() => error);
    }),
  );
};
