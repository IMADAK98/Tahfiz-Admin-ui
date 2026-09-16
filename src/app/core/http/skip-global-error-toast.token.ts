import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SKIP_GLOBAL_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export function skipGlobalErrorToastContext(existing?: HttpContext): HttpContext {
  const context = existing ?? new HttpContext();
  return context.set(SKIP_GLOBAL_ERROR_TOAST, true);
}

export function withSkipGlobalErrorToast<T extends object>(
  options: T,
): T & { context: HttpContext } {
  return {
    ...options,
    context: skipGlobalErrorToastContext(
      'context' in options ? (options.context as HttpContext | undefined) : undefined,
    ),
  };
}
