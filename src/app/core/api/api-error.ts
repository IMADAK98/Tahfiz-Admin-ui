import { formatNestMessage, parseNestFieldErrors } from './error-message.helpers';
import { NestErrorBody } from './models/api-envelope.model';

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly bodyStatus?: number;
  readonly fieldErrors: Record<string, string>;
  /** Nest `code` when the JSON body included one. Absent on non-envelope failures. */
  readonly code?: string;
  /** Original Nest JSON body so callers can read fields the message string drops. */
  readonly body?: unknown;

  constructor(
    message: string,
    httpStatus: number,
    bodyStatus?: number,
    fieldErrors: Record<string, string> = {},
    code?: string,
    body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.bodyStatus = bodyStatus;
    this.fieldErrors = fieldErrors;
    this.code = code;
    this.body = body;
  }
}

export function apiErrorFromBody(body: unknown, httpStatus: number): ApiError {
  if (body && typeof body === 'object') {
    const nest = body as NestErrorBody;
    const message = formatNestMessage(nest.message) ?? nest.error ?? 'Request failed';
    const code = typeof nest.code === 'string' && nest.code.trim() ? nest.code.trim() : undefined;
    return new ApiError(
      message,
      httpStatus,
      nest.statusCode,
      parseNestFieldErrors(nest.errors),
      code,
      body,
    );
  }
  if (typeof body === 'string' && body.trim()) {
    return new ApiError(body, httpStatus);
  }
  return new ApiError('Request failed', httpStatus);
}
