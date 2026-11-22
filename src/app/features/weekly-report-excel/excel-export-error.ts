import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../core/api/api-error';
import { formatNestMessage } from '../../core/api/error-message.helpers';
import { NestErrorBody } from '../../core/api/models/api-envelope.model';
import { TOAST_I18N } from '../../core/ui/toast-messages';

export interface ExcelExportTranslator {
  instant(key: string, params?: Record<string, string>): string;
}

/** Envelope `message` only. A missing body, a network error, or a build error has none. */
export function envelopeServerMessage(error: unknown): string | null {
  const body = nestBody(error);
  if (!body) {
    return null;
  }
  const message = formatNestMessage(body.message)?.trim();
  return message || null;
}

/**
 * Server envelope message → locked `toast.error.requestFailed` («فشل الطلب: {{message}}»).
 * Anything else → the feature «تعذّر…» key.
 */
export function excelExportFailureToast(
  error: unknown,
  translate: ExcelExportTranslator,
  failKey: string,
): string {
  const serverMessage = envelopeServerMessage(error);
  if (serverMessage) {
    return translate.instant(TOAST_I18N.errors.requestFailedWithMessage, { message: serverMessage });
  }
  return translate.instant(failKey);
}

function nestBody(error: unknown): NestErrorBody | null {
  if (error instanceof ApiError) {
    return isNestBody(error.body) ? error.body : null;
  }
  if (error instanceof HttpErrorResponse) {
    return isNestBody(error.error) ? error.error : null;
  }
  return null;
}

function isNestBody(value: unknown): value is NestErrorBody {
  return !!value && typeof value === 'object' && !(value instanceof Blob) && !(value instanceof ArrayBuffer);
}
