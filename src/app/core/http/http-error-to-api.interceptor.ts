import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { apiErrorFromBody } from '../api/api-error';

function isNestJsonBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }
  if (body instanceof Blob || body instanceof ArrayBuffer || body instanceof ProgressEvent) {
    return false;
  }
  return true;
}

/**
 * Outermost interceptor: after auth + toast have seen HttpErrorResponse,
 * surface Nest JSON bodies as ApiError (with fieldErrors) to subscribers.
 */
export const httpErrorToApiInterceptor: HttpInterceptorFn = (_req, next) =>
  next(_req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !isNestJsonBody(error.error)) {
        return throwError(() => error);
      }
      return throwError(() => apiErrorFromBody(error.error, error.status));
    }),
  );
