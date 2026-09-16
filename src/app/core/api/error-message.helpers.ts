import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';
import { NestErrorBody } from './models/api-envelope.model';

export function formatNestMessage(message: NestErrorBody['message']): string | undefined {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return undefined;
}

/** Prefer Nest body.message → body.error → ApiError.message. */
export function extractHttpErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }

  const body = error.error;
  if (body && typeof body === 'object') {
    const nest = body as NestErrorBody;
    const fromMessage = formatNestMessage(nest.message);
    if (fromMessage) {
      return fromMessage;
    }
    if (typeof nest.error === 'string' && nest.error) {
      return nest.error;
    }
  }

  if (typeof body === 'string' && body) {
    return body;
  }

  return null;
}

export function resolveErrorStatus(error: unknown): number {
  if (error instanceof ApiError) {
    return error.bodyStatus ?? error.httpStatus;
  }
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body && typeof body === 'object') {
      const nest = body as NestErrorBody;
      if (nest.statusCode !== undefined) {
        return nest.statusCode;
      }
    }
    return error.status;
  }
  return 0;
}

export function urlPathWithoutQuery(url: string): string {
  try {
    return new URL(url, 'http://local').pathname;
  } catch {
    return url.split('?')[0] ?? url;
  }
}

/** Nest returns 404 when a term has zero ḥalaqas — treat as empty list until API returns 200 []. */
export function isNoHalqasForTermError(error: unknown): boolean {
  const status = resolveErrorStatus(error);
  if (status !== 404) {
    return false;
  }

  const message = extractHttpErrorMessage(error);
  return message !== null && /no halqas found/i.test(message);
}

export function isAbortedRequest(error: HttpErrorResponse): boolean {
  if (error.status !== 0) {
    return false;
  }

  if (error.error instanceof DOMException && error.error.name === 'AbortError') {
    return true;
  }

  const message = error.message.toLowerCase();
  return message.includes('abort') || message.includes('cancel');
}
